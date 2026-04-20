import prisma from '@/lib/prisma';

type ItemType = 'car' | 'diorama';

type MarketplaceTx = {
  car: typeof prisma.car;
  diorama: typeof prisma.diorama;
  marketplaceTransaction: typeof prisma.marketplaceTransaction;
};

export async function getSaleItem(itemType: ItemType, itemId: string) {
  if (itemType === 'car') {
    const car = await prisma.car.findFirst({
      where: { id: itemId, forSale: true },
      select: {
        id: true,
        userId: true,
        sellingPrice: true,
        brand: true,
        carModel: true,
      },
    });

    if (!car) return null;

    return {
      itemId: car.id,
      itemType,
      sellerId: car.userId,
      amount: car.sellingPrice,
      title: `${car.brand} ${car.carModel}`,
      category: 'car',
    };
  }

  const diorama = await prisma.diorama.findFirst({
    where: { id: itemId, forSale: true },
    select: {
      id: true,
      userId: true,
      sellingPrice: true,
      description: true,
    },
  });

  if (!diorama) return null;

  return {
    itemId: diorama.id,
    itemType,
    sellerId: diorama.userId,
    amount: diorama.sellingPrice,
    title: diorama.description,
    category: 'diorama',
  };
}

export async function transferSaleItemToBuyer(
  tx: MarketplaceTx,
  itemType: ItemType,
  itemId: string,
  sellerId: string,
  buyerId: string,
) {
  if (itemType === 'car') {
    const result = await tx.car.updateMany({
      where: { id: itemId, userId: sellerId, forSale: true },
      data: {
        userId: buyerId,
        forSale: false,
        sellingPrice: 0,
        forTrade: false,
        forAuction: false,
      },
    });

    return result.count > 0;
  }

  const result = await tx.diorama.updateMany({
    where: { id: itemId, userId: sellerId, forSale: true },
    data: {
      userId: buyerId,
      forSale: false,
      sellingPrice: 0,
      forTrade: false,
    },
  });

  return result.count > 0;
}

export async function markTransactionStatus(
  externalTxnId: string,
  status: 'failed' | 'cancelled',
  errorMessage?: string,
) {
  await prisma.marketplaceTransaction.updateMany({
    where: {
      externalTxnId,
      status: { in: ['initiated', 'pending_gateway', 'processing'] },
    },
    data: {
      status,
      errorMessage: errorMessage ?? null,
    },
  });
}

export async function completeMarketplaceTransaction(
  externalTxnId: string,
  sslValidationId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.marketplaceTransaction.findUnique({
      where: { externalTxnId },
    });

    if (!transaction) {
      return { ok: false as const, reason: 'not_found' as const };
    }

    if (transaction.status === 'completed') {
      return { ok: true as const, reason: 'already_completed' as const };
    }

    if (transaction.status === 'failed' || transaction.status === 'cancelled') {
      return { ok: false as const, reason: 'not_processable' as const };
    }

    const transferred = await transferSaleItemToBuyer(
      tx,
      transaction.itemType as ItemType,
      transaction.itemId,
      transaction.sellerId,
      transaction.buyerId,
    );

    if (!transferred) {
      await tx.marketplaceTransaction.update({
        where: { externalTxnId },
        data: {
          status: 'failed',
          errorMessage: 'Item is no longer available for sale',
          sslValidationId: sslValidationId ?? null,
        },
      });

      return { ok: false as const, reason: 'item_unavailable' as const };
    }

    await tx.marketplaceTransaction.update({
      where: { externalTxnId },
      data: {
        status: 'completed',
        sslValidationId: sslValidationId ?? null,
      },
    });

    return { ok: true as const, reason: 'completed' as const };
  });
}
