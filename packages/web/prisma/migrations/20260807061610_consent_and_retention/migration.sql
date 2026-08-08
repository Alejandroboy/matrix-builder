/*
  Warnings:

  - Added the required column `consentAt` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "consentAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "purgedAt" TIMESTAMP(3),
ALTER COLUMN "input" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "purgedAt" TIMESTAMP(3),
ALTER COLUMN "input" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_purgedAt_paidAt_idx" ON "Order"("purgedAt", "paidAt");
