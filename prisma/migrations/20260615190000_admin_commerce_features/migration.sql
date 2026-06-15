CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH_ON_DELIVERY');

ALTER TABLE "User"
ADD COLUMN "blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "failedDeliveries" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Coupon"
ADD COLUMN "assignedUserId" TEXT;

ALTER TABLE "Order"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CARD';

CREATE INDEX "Coupon_assignedUserId_idx" ON "Coupon"("assignedUserId");

ALTER TABLE "Coupon"
ADD CONSTRAINT "Coupon_assignedUserId_fkey"
FOREIGN KEY ("assignedUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
