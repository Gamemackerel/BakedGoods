/*
  Warnings:

  - You are about to drop the column `fingerprint` on the `Comparison` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comparison" DROP COLUMN "fingerprint",
ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'legacy_user';
