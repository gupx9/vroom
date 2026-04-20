import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import {
  completeMarketplaceTransaction,
  getSaleItem,
  transferSaleItemToBuyer,
} from '@/lib/marketplacePurchase';
import { initiateSSLCommerzSandboxPayment } from '@/lib/sslcommerz';

type ItemType = 'car' | 'diorama';
type PaymentMethod = 'cash_on_delivery' | 'card' | 'mobile_banking';

type MarketplacePurchaseTransactionClient = {
  marketplaceTransaction: typeof prisma.marketplaceTransaction;
  car: typeof prisma.car;
  diorama: typeof prisma.diorama;
};

interface PurchaseRequestBody {
  itemId?: string;
  itemType?: ItemType;
  paymentMethod?: PaymentMethod;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostcode?: string;
}

function isItemType(value: string): value is ItemType {
  return value === 'car' || value === 'diorama';
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === 'cash_on_delivery' || value === 'card' || value === 'mobile_banking';
}

export async function GET() {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [buyer, latestTransaction] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { username: true, email: true },
      }),
      prisma.marketplaceTransaction.findFirst({
        where: { buyerId: session.userId },
        orderBy: { createdAt: 'desc' },
        select: {
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          shippingAddress: true,
          shippingCity: true,
          shippingPostcode: true,
        },
      }),
    ]);

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      defaults: {
        customerName: latestTransaction?.customerName || buyer.username || '',
        customerEmail: latestTransaction?.customerEmail || buyer.email || '',
        customerPhone: latestTransaction?.customerPhone || '',
        shippingAddress: latestTransaction?.shippingAddress || '',
        shippingCity: latestTransaction?.shippingCity || 'Dhaka',
        shippingPostcode: latestTransaction?.shippingPostcode || '1200',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load purchase defaults' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as PurchaseRequestBody;
    const itemId = body.itemId?.trim();
    const itemType = body.itemType;
    const paymentMethod = body.paymentMethod;

    if (!itemId || !itemType || !paymentMethod || !isItemType(itemType) || !isPaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid purchase request' }, { status: 400 });
    }

    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.trim();
    const shippingAddress = body.shippingAddress?.trim();
    const shippingCity = body.shippingCity?.trim() || 'Dhaka';
    const shippingPostcode = body.shippingPostcode?.trim() || '1200';

    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Customer name and phone are required' }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    const buyer = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, username: true },
    });

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });
    }

    const customerEmail = body.customerEmail?.trim() || buyer.email;
    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is required for payment' }, { status: 400 });
    }

    const listing = await getSaleItem(itemType, itemId);
    if (!listing) {
      return NextResponse.json({ error: 'Item is no longer available for sale' }, { status: 404 });
    }

    if (listing.sellerId === session.userId) {
      return NextResponse.json({ error: 'You cannot buy your own listing' }, { status: 400 });
    }

    const externalTxnId = `VRM-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

    if (paymentMethod === 'cash_on_delivery') {
      await prisma.$transaction(async (tx: MarketplacePurchaseTransactionClient) => {
        await tx.marketplaceTransaction.create({
          data: {
            externalTxnId,
            itemType,
            itemId,
            sellerId: listing.sellerId,
            buyerId: session.userId,
            paymentMethod,
            status: 'processing',
            amount: listing.amount,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            shippingCity,
            shippingPostcode,
          },
        });

        const transferred = await transferSaleItemToBuyer(
          tx,
          itemType,
          itemId,
          listing.sellerId,
          session.userId,
        );

        if (!transferred) {
          await tx.marketplaceTransaction.update({
            where: { externalTxnId },
            data: { status: 'failed', errorMessage: 'Item was already sold' },
          });
          return;
        }

        await tx.marketplaceTransaction.update({
          where: { externalTxnId },
          data: { status: 'completed' },
        });
      });

      revalidatePath('/marketplace');
      revalidatePath('/garage');

      return NextResponse.json({
        success: true,
        mode: 'cash_on_delivery',
        message: 'Order placed successfully via cash on delivery',
      });
    }

    const transaction = await prisma.marketplaceTransaction.create({
      data: {
        externalTxnId,
        itemType,
        itemId,
        sellerId: listing.sellerId,
        buyerId: session.userId,
        paymentMethod,
        status: 'pending_gateway',
        amount: listing.amount,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        shippingPostcode,
      },
    });

    const origin = new URL(request.url).origin;
    const callbackBase = process.env.SSLCOMMERZ_CALLBACK_BASE_URL || origin;

    const paymentInit = await initiateSSLCommerzSandboxPayment({
      totalAmount: listing.amount,
      currency: 'BDT',
      transactionId: externalTxnId,
      successUrl: `${callbackBase}/api/sslcommerz/sandbox/success`,
      failUrl: `${callbackBase}/api/sslcommerz/sandbox/fail`,
      cancelUrl: `${callbackBase}/api/sslcommerz/sandbox/cancel`,
      ipnUrl: `${callbackBase}/api/sslcommerz/sandbox/success`,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress: shippingAddress,
      customerCity: shippingCity,
      customerPostcode: shippingPostcode,
      productName: listing.title,
      productCategory: listing.category,
      valueA: paymentMethod,
      valueB: transaction.id,
      valueC: buyer.username,
    });
    const gatewayPayload = paymentInit as never;

    const gatewayUrl = typeof paymentInit.GatewayPageURL === 'string' ? paymentInit.GatewayPageURL : null;
    if (!gatewayUrl) {
      await prisma.marketplaceTransaction.update({
        where: { externalTxnId },
        data: {
          status: 'failed',
          errorMessage: typeof paymentInit.failedreason === 'string'
            ? paymentInit.failedreason
            : 'SSLCommerz did not return a gateway URL',
          gatewayPayload,
        },
      });
      return NextResponse.json({ error: 'Unable to initialize SSLCommerz payment' }, { status: 502 });
    }

    await prisma.marketplaceTransaction.update({
      where: { externalTxnId },
      data: {
        gatewayUrl,
        gatewayPayload,
      },
    });

    return NextResponse.json({
      success: true,
      mode: paymentMethod,
      redirectUrl: gatewayUrl,
      transactionId: externalTxnId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Purchase initialization failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { transactionId?: string; valId?: string };
    const transactionId = body.transactionId?.trim();

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
    }

    const result = await completeMarketplaceTransaction(transactionId, body.valId?.trim());
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    revalidatePath('/marketplace');
    revalidatePath('/garage');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to complete purchase' }, { status: 500 });
  }
}
