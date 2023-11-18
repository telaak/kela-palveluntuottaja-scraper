import axios from "axios";
import { KelaParser } from "./parser";
import { Kunta, Lakiperuste, Kuntoutusmuoto, Kieli } from "./types/enums";
import { writeFile } from "fs/promises";
import { CronJob } from "cron";

const kunnat = process.env.KUNNAT
  ? process.env.KUNNAT.split(",")
  : Object.values(Kunta);

const toBeParsed = Object.entries(Kunta).filter(([kuntaName, kuntaNumber]) => {
  return kunnat.includes(kuntaNumber) || kunnat.includes(kuntaName);
});

if (process.env.PARSE_ON_BOOT === "true") {
  try {
    iterate();
  } catch (error) {
    console.error(error);
  }
}

if (process.env.CRON) {
  console.log(`cronjob scheduled for ${process.env.CRON}`);
  const job = CronJob.from({
    cronTime: process.env.CRON,
    onTick: function () {
      iterate();
    },
    start: true,
    timeZone: "Europe/Helsinki",
  });
}

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

      if (process.env.SAVE_JSON === "true") {
        writeFile(
          `./out/${kuntaName}-${therapist.name}.json`,
          JSON.stringify(therapist, null, 2)
        ).catch(console.error);
      }

      if (process.env.API_URL) {
        axios.post(process.env.API_URL, therapist).catch(console.error);
      }
    }
  }

  if (!process.env.CRON) {
    process.exit();
  }
}
