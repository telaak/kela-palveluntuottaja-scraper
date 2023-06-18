import { PrismaClient } from "@prisma/client";
import { Kieli, Kunta, Suuntaus } from "./types/enums";
const prisma = new PrismaClient();

Object.values(Suuntaus).forEach((suuntaus) => {
  prisma.orientation
    .create({
      data: {
        fiFI: suuntaus,
      },
    })
    .then(console.log);
});

Object.values(Kieli).forEach((kieli) => {
  prisma.language
    .create({
      data: {
        fiFI: kieli,
      },
    })
    .then(console.log);
});

Object.keys(Kunta).forEach((kunta) => {
  prisma.location
    .create({
      data: {
        name: kunta,
      },
    })
    .then(console.log);
});
