-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "email" TEXT,
ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ALTER COLUMN "consentAt" DROP DEFAULT;
