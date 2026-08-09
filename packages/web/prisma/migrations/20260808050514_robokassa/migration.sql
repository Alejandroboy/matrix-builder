/*
  Warnings:

  - You are about to drop the column `yookassaPaymentId` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerPaymentId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Order_yookassaPaymentId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "yookassaPaymentId",
ADD COLUMN     "invId" SERIAL NOT NULL,
ADD COLUMN     "providerPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_invId_key" ON "Order"("invId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_providerPaymentId_key" ON "Order"("providerPaymentId");
