-- CreateTable
CREATE TABLE "MarketplaceTransaction" (
    "id" TEXT NOT NULL,
    "externalTxnId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "amount" DOUBLE PRECISION NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "shippingAddress" TEXT,
    "shippingCity" TEXT,
    "shippingPostcode" TEXT,
    "gatewayUrl" TEXT,
    "gatewayPayload" JSONB,
    "sslValidationId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceTransaction_externalTxnId_key" ON "MarketplaceTransaction"("externalTxnId");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_buyerId_createdAt_idx" ON "MarketplaceTransaction"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_sellerId_createdAt_idx" ON "MarketplaceTransaction"("sellerId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_status_createdAt_idx" ON "MarketplaceTransaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceTransaction_itemType_itemId_idx" ON "MarketplaceTransaction"("itemType", "itemId");
