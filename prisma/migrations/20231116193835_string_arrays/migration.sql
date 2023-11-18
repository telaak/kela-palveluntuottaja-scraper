/*
  Warnings:

  - You are about to drop the `Language` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Orientation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Phone` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Therapy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_LanguageToTherapist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_LocationToTherapist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_OrientationToTherapist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Phone" DROP CONSTRAINT "Phone_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "Therapy" DROP CONSTRAINT "Therapy_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "_LanguageToTherapist" DROP CONSTRAINT "_LanguageToTherapist_A_fkey";

-- DropForeignKey
ALTER TABLE "_LanguageToTherapist" DROP CONSTRAINT "_LanguageToTherapist_B_fkey";

-- DropForeignKey
ALTER TABLE "_LocationToTherapist" DROP CONSTRAINT "_LocationToTherapist_A_fkey";

-- DropForeignKey
ALTER TABLE "_LocationToTherapist" DROP CONSTRAINT "_LocationToTherapist_B_fkey";

-- DropForeignKey
ALTER TABLE "_OrientationToTherapist" DROP CONSTRAINT "_OrientationToTherapist_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrientationToTherapist" DROP CONSTRAINT "_OrientationToTherapist_B_fkey";

-- AlterTable
ALTER TABLE "Therapist" ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "locations" TEXT[],
ADD COLUMN     "orientations" TEXT[],
ADD COLUMN     "phoneNUmbers" TEXT[],
ADD COLUMN     "therapist" TEXT[];

-- DropTable
DROP TABLE "Language";

-- DropTable
DROP TABLE "Location";

-- DropTable
DROP TABLE "Orientation";

-- DropTable
DROP TABLE "Phone";

-- DropTable
DROP TABLE "Therapy";

-- DropTable
DROP TABLE "_LanguageToTherapist";

-- DropTable
DROP TABLE "_LocationToTherapist";

-- DropTable
DROP TABLE "_OrientationToTherapist";

-- CreateIndex
CREATE INDEX "Therapist_name_idx" ON "Therapist"("name");
