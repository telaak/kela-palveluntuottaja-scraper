-- CreateEnum
CREATE TYPE "Suuntaus" AS ENUM ('PSYKOANALYYTTINEN', 'gestalt-terapia', 'INTEGROIVA', 'kognitiivis-analyyttinen', 'KOGNITIIVINEN', 'kriisi- ja traumaterapia', 'musiikkiterapia', 'neuropsykologiset häiriöt', 'paripsykoterapia', 'perheterapia', 'PSYKODYNAAMINEN', 'RATKAISUKESKEINEN');

-- CreateTable
CREATE TABLE "TherapistSnippet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "phoneNumbers" TEXT[],
    "links" TEXT[],

    CONSTRAINT "TherapistSnippet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Therapist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "homepage" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Therapist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phone" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "therapistId" INTEGER,

    CONSTRAINT "Phone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" SERIAL NOT NULL,
    "fiFI" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orientation" (
    "id" SERIAL NOT NULL,
    "fiFI" TEXT NOT NULL,

    CONSTRAINT "Orientation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Therapy" (
    "id" SERIAL NOT NULL,
    "muoto" TEXT NOT NULL,
    "lajit" TEXT[],
    "therapistId" INTEGER,

    CONSTRAINT "Therapy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LocationToTherapist" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_LanguageToTherapist" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_OrientationToTherapist" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TherapistSnippet_name_location_key" ON "TherapistSnippet"("name", "location");

-- CreateIndex
CREATE UNIQUE INDEX "Therapist_name_key" ON "Therapist"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_fiFI_key" ON "Language"("fiFI");

-- CreateIndex
CREATE UNIQUE INDEX "Orientation_fiFI_key" ON "Orientation"("fiFI");

-- CreateIndex
CREATE UNIQUE INDEX "_LocationToTherapist_AB_unique" ON "_LocationToTherapist"("A", "B");

-- CreateIndex
CREATE INDEX "_LocationToTherapist_B_index" ON "_LocationToTherapist"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LanguageToTherapist_AB_unique" ON "_LanguageToTherapist"("A", "B");

-- CreateIndex
CREATE INDEX "_LanguageToTherapist_B_index" ON "_LanguageToTherapist"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OrientationToTherapist_AB_unique" ON "_OrientationToTherapist"("A", "B");

-- CreateIndex
CREATE INDEX "_OrientationToTherapist_B_index" ON "_OrientationToTherapist"("B");

-- AddForeignKey
ALTER TABLE "Phone" ADD CONSTRAINT "Phone_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Therapy" ADD CONSTRAINT "Therapy_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationToTherapist" ADD CONSTRAINT "_LocationToTherapist_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationToTherapist" ADD CONSTRAINT "_LocationToTherapist_B_fkey" FOREIGN KEY ("B") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToTherapist" ADD CONSTRAINT "_LanguageToTherapist_A_fkey" FOREIGN KEY ("A") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LanguageToTherapist" ADD CONSTRAINT "_LanguageToTherapist_B_fkey" FOREIGN KEY ("B") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrientationToTherapist" ADD CONSTRAINT "_OrientationToTherapist_A_fkey" FOREIGN KEY ("A") REFERENCES "Orientation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrientationToTherapist" ADD CONSTRAINT "_OrientationToTherapist_B_fkey" FOREIGN KEY ("B") REFERENCES "Therapist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
