/*
  Warnings:

  - You are about to drop the column `actorId` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `newValue` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `oldValue` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ActivityLog` table. All the data in the column will be lost.
  - Added the required column `action` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_actorId_fkey";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "actorId",
DROP COLUMN "newValue",
DROP COLUMN "oldValue",
DROP COLUMN "type",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ActivityLogType";

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
