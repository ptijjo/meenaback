/*
  Warnings:

  - The values [user] on the enum `NotifiableType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `UserSecret` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId]` on the table `UserSecret` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotifiableType_new" AS ENUM ('friendship');
ALTER TABLE "Notification" ALTER COLUMN "targetType" TYPE "NotifiableType_new" USING ("targetType"::text::"NotifiableType_new");
ALTER TYPE "NotifiableType" RENAME TO "NotifiableType_old";
ALTER TYPE "NotifiableType_new" RENAME TO "NotifiableType";
DROP TYPE "public"."NotifiableType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Friendship" DROP CONSTRAINT "Friendship_addresseeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Friendship" DROP CONSTRAINT "Friendship_requesterId_fkey";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "UserSecret" DROP CONSTRAINT "UserSecret_pkey",
ADD CONSTRAINT "UserSecret_pkey" PRIMARY KEY ("ID");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecret_userId_key" ON "UserSecret"("userId");

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "UserSecret"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "UserSecret"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;
