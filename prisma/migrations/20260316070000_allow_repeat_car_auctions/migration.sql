/*
  Allows the same seller to re-auction the same car after previous auctions are no longer active.
*/
-- DropIndex
DROP INDEX "Auction_carId_sellerId_key";

-- CreateIndex
CREATE INDEX "Auction_carId_idx" ON "Auction"("carId");
