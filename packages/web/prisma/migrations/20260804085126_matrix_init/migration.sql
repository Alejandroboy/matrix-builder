-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('created', 'paid', 'canceled');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('personal', 'compatibility');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'created',
    "productType" "ProductType" NOT NULL,
    "input" JSONB NOT NULL,
    "amount" INTEGER NOT NULL,
    "yookassaPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "input" JSONB NOT NULL,
    "missingArcana" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_yookassaPaymentId_key" ON "Order"("yookassaPaymentId");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_notifiedAt_createdAt_idx" ON "Lead"("notifiedAt", "createdAt");
