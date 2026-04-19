-- DropIndex
DROP INDEX "Notification_userId_auctionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_kind_auctionId_key" ON "Notification"("userId", "kind", "auctionId");
