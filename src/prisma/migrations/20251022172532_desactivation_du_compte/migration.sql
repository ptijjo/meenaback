/*
  Warnings:

  - You are about to drop the column `invitId` on the `UserSecret` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ID]` on the table `UserSecret` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ID` to the `UserSecret` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."UserSecret_invitId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "desactivateAccountDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserSecret" DROP COLUMN "invitId",
ADD COLUMN     "ID" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserSecret_ID_key" ON "UserSecret"("ID");
