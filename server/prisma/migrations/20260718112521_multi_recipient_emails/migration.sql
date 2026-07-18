-- AlterTable
ALTER TABLE "EmailReportSettings" DROP COLUMN "recipientEmail",
ADD COLUMN     "recipientEmails" TEXT[];

