/*
  Warnings:

  - A unique constraint covering the columns `[invitId]` on the table `userSecret` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invitId` to the `userSecret` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "userSecret" ADD COLUMN     "invitId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "userSecret_invitId_key" ON "userSecret"("invitId");
