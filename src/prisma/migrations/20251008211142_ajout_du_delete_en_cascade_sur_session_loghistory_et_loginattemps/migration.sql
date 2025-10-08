-- DropForeignKey
ALTER TABLE "public"."LoginAttempts" DROP CONSTRAINT "LoginAttempts_emailName_fkey";

-- DropForeignKey
ALTER TABLE "public"."LoginHistory" DROP CONSTRAINT "LoginHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempts" ADD CONSTRAINT "LoginAttempts_emailName_fkey" FOREIGN KEY ("emailName") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;
