/*
  Warnings:

  - A unique constraint covering the columns `[twoFaSecret]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFaSmsService" TEXT,
ALTER COLUMN "twoFaMethod" SET DEFAULT 'sms';

-- CreateIndex
CREATE UNIQUE INDEX "User_twoFaSecret_key" ON "User"("twoFaSecret");
