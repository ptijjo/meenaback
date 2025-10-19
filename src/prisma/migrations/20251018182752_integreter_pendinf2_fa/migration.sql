/*
  Warnings:

  - You are about to drop the column `twoFaSmsService` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "twoFaSmsService",
ALTER COLUMN "twoFaMethod" SET DEFAULT 'totp';

-- CreateTable
CREATE TABLE "Pending2FA" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pending2FA_pkey" PRIMARY KEY ("id")
);
