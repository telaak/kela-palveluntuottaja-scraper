import { PrismaClient } from "@prisma/client";
import { Kieli, Kunta, Suuntaus } from "./types/enums";
const prisma = new PrismaClient();

// prisma.language
//   .createMany({
//     data: [
//       { fiFI: "englanti" },
//       { fiFI: "viro" },
//       { fiFI: "suomi" },
//       { fiFI: "ranska" },
//       { fiFI: "venäjä" },
//       { fiFI: "somali" },
//       { fiFI: "espanja" },
//       { fiFI: "ruotsi" },
//       { fiFI: "graafiset merkit" },
//       { fiFI: "tukiiviittomat" },
//       { fiFI: "viittomakieli" },
//     ],
//   })
//   .then(console.log);

// prisma.orientation
//   .createMany({
//     data: [
//       { fiFI: "psykoanalyyttinen" },
//       { fiFI: "gestalt-terapia" },
//       { fiFI: "integroiva" },
//       { fiFI: "kognitiivis-analyyttinen" },
//       { fiFI: "kognitiivinen" },
//       { fiFI: "kriisi- ja traumaterapia" },
//       { fiFI: "musiikkiterapia" },
//       { fiFI: "neuropsykiatriset häiriöt" },
//       { fiFI: "paripsykoterapia" },
//       { fiFI: "perheterapia" },
//       { fiFI: "psykodynaaminen" },
//       { fiFI: "ratkaisukeskeinen" },
//     ],
//   })
//   .then(console.log);

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
