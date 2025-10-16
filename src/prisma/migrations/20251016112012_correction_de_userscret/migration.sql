/*
  Warnings:

  - You are about to drop the `userSecret` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."userSecret" DROP CONSTRAINT "userSecret_userId_fkey";

-- DropTable
DROP TABLE "public"."userSecret";

-- CreateTable
CREATE TABLE "UserSecret" (
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invitId" TEXT NOT NULL,

    CONSTRAINT "UserSecret_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSecret_invitId_key" ON "UserSecret"("invitId");

-- AddForeignKey
ALTER TABLE "UserSecret" ADD CONSTRAINT "UserSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
