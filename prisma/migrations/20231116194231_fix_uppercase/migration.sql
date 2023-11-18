/*
  Warnings:

  - You are about to drop the column `phoneNUmbers` on the `Therapist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Therapist" DROP COLUMN "phoneNUmbers",
ADD COLUMN     "phoneNumbers" TEXT[];
