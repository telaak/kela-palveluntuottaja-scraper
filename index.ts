import axios from "axios";
import { KelaParser } from "./parser";
import { Kunta, Lakiperuste, Kuntoutusmuoto, Kieli } from "./types/enums";
import { writeFile, readFile } from "fs/promises";

const kunnat = process.env.KUNNAT
  ? process.env.KUNNAT.split(",")
  : Object.values(Kunta);

const toBeParsed = Object.entries(Kunta).filter(([kuntaName, kuntaNumber]) => {
  return kunnat.includes(kuntaNumber) || kunnat.includes(kuntaName);
});

async function iterate() {
  for (const [kuntaName, kuntaNumber] of toBeParsed) {
    const parser = new KelaParser();
    console.log(`${kuntaName}: ${kuntaNumber}`);
    const therapists = await parser.getTherapistsWithParams(
      Lakiperuste.KUNTOUTUSPSYKOTERAPIA,
      kuntaNumber,
      Kuntoutusmuoto.AIKUISTEN,
      Kieli.SUOMI
    );
    for (let i = 0; i < therapists.length; i++) {
      const therapist = await parser.getTherapistInfo(i, i % 20 === 0);
      console.log(therapist);

      if (process.env.SAVE_JSON) {
        await writeFile(
          `./out/${kuntaName}-${therapist.name}.json`,
          JSON.stringify(therapist, null, 2)
        ).catch(console.error);
      }

      if (process.env.API_URL) {
        await axios
          .post(process.env.API_URL, {
            therapist,
          })
          .catch(console.error);
      }
    }
  }
}

if (process.env.PARSE_ON_BOOT) {
  try {
    iterate();
  } catch (error) {
    console.error(error);
  }
}
