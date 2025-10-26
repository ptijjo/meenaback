/*
  Warnings:

  - You are about to drop the column `name` on the `UserSecret` table. All the data in the column will be lost.
  - Added the required column `avatarSecret` to the `UserSecret` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameSecret` to the `UserSecret` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserSecret" DROP COLUMN "name",
ADD COLUMN     "avatarSecret" TEXT NOT NULL,
ADD COLUMN     "nameSecret" TEXT NOT NULL;
