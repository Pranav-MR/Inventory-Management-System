-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('WEEKLY', 'MONTHLY');

-- DropForeignKey
ALTER TABLE "NotificationLog" DROP CONSTRAINT "NotificationLog_itemId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationLog" DROP CONSTRAINT "NotificationLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationPreference" DROP CONSTRAINT "NotificationPreference_userId_fkey";

-- DropTable
DROP TABLE "NotificationLog";

-- DropTable
DROP TABLE "NotificationPreference";

-- DropEnum
DROP TYPE "NotificationChannelType";

-- DropEnum
DROP TYPE "NotificationEventType";

-- CreateTable
CREATE TABLE "EmailReportSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recipientEmail" TEXT NOT NULL,
    "frequency" "ReportFrequency" NOT NULL DEFAULT 'WEEKLY',
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailReportSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailReportSettings_userId_key" ON "EmailReportSettings"("userId");

-- AddForeignKey
ALTER TABLE "EmailReportSettings" ADD CONSTRAINT "EmailReportSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

