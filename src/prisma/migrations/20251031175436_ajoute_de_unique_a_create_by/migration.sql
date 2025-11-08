/*
  Warnings:

  - A unique constraint covering the columns `[createdById]` on the table `Group` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Group_createdById_key" ON "Group"("createdById");
