/*
  Warnings:

  - A unique constraint covering the columns `[carId,sellerId]` on the table `Auction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Auction_carId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Auction_carId_sellerId_key" ON "Auction"("carId", "sellerId");
