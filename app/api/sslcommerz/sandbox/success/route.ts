import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { completeMarketplaceTransaction, markTransactionStatus } from '@/lib/marketplacePurchase';
import { validateSSLCommerzSandboxPayment } from '@/lib/sslcommerz';

async function readCallbackData(request: Request) {
  if (request.method === 'GET') {
    const params = new URL(request.url).searchParams;
    return {
      status: params.get('status') ?? '',
      tranId: params.get('tran_id') ?? '',
      valId: params.get('val_id') ?? '',
      failedReason: params.get('failedreason') ?? '',
    };
  }

  const form = await request.formData();
  return {
    status: String(form.get('status') ?? ''),
    tranId: String(form.get('tran_id') ?? ''),
    valId: String(form.get('val_id') ?? ''),
    failedReason: String(form.get('failedreason') ?? ''),
  };
}

function redirectToMarketplace(request: Request, state: string) {
  const redirectUrl = new URL('/marketplace', request.url);
  redirectUrl.searchParams.set('purchase', state);
  return NextResponse.redirect(redirectUrl);
}

async function handleCallback(request: Request) {
  const { status, tranId, valId, failedReason } = await readCallbackData(request);

  if (!tranId) {
    return redirectToMarketplace(request, 'missing_txn');
  }

  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus !== 'VALID' && normalizedStatus !== 'VALIDATED') {
    await markTransactionStatus(tranId, 'failed', failedReason || `Gateway status: ${status}`);
    return redirectToMarketplace(request, 'failed');
  }

  const transaction = await prisma.marketplaceTransaction.findUnique({ where: { externalTxnId: tranId } });
  if (!transaction) {
    return redirectToMarketplace(request, 'not_found');
  }

  if (transaction.status === 'completed') {
    return redirectToMarketplace(request, 'success');
  }

  if (!valId) {
    await markTransactionStatus(tranId, 'failed', 'Missing SSLCommerz val_id in success callback');
    return redirectToMarketplace(request, 'failed');
  }

  try {
    const validation = await validateSSLCommerzSandboxPayment(valId);
    const validationStatus = String(validation.status ?? '').toUpperCase();

    if (validationStatus !== 'VALID' && validationStatus !== 'VALIDATED') {
      await markTransactionStatus(tranId, 'failed', `Validation failed: ${validationStatus || 'unknown status'}`);
      return redirectToMarketplace(request, 'failed');
    }

    const validatedAmount = Number(validation.amount);
    if (Number.isFinite(validatedAmount) && Math.abs(validatedAmount - transaction.amount) > 0.01) {
      await markTransactionStatus(tranId, 'failed', 'Validated amount does not match listing amount');
      return redirectToMarketplace(request, 'failed');
    }

    const completed = await completeMarketplaceTransaction(tranId, valId);
    if (!completed.ok) {
      return redirectToMarketplace(request, completed.reason);
    }

    revalidatePath('/marketplace');
    revalidatePath('/garage');
    return redirectToMarketplace(request, 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment validation failed';
    await markTransactionStatus(tranId, 'failed', message);
    return redirectToMarketplace(request, 'failed');
  }
}

export async function GET(request: Request) {
  return handleCallback(request);
}

export async function POST(request: Request) {
  return handleCallback(request);
}
