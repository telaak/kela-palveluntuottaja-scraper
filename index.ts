import axios from "axios";
import { KelaParser } from "./parser";
import { Kunta, Lakiperuste, Kuntoutusmuoto, Kieli } from "./types/enums";
import { writeFile } from "fs/promises";
import { CronJob } from "cron";

/**
 * Gets either all the Kunta (Kinte) or the list from env variable
 */

const kunnat = process.env.KUNNAT
  ? process.env.KUNNAT.split(",")
  : Object.values(Kunta);

/**
 * Sets the list to be parsed, checks either the enum's number or name
 * See {@link Kunta}
 */

const toBeParsed = Object.entries(Kunta).filter(([kuntaName, kuntaNumber]) => {
  return kunnat.includes(kuntaNumber) || kunnat.includes(kuntaName);
});

/**
 * Self explanatory I hope
 */

if (process.env.PARSE_ON_BOOT === "true") {
  try {
    iterate();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Sets a cronjob to run the parser
 * See the documentation for cron for more info
 */

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

/**
 * Iterates through every Kunta {@link Kunta}
 * First gets therapists from said Kunta
 * Then loops through the table while avoiding duplicates (and oh boy are there many)
 * There are some extra precautions not to overload the system
 */

async function iterate() {
  const nameSet: Set<string> = new Set();
  for (const [kuntaName, kuntaNumber] of toBeParsed) {
    const parser = new KelaParser();
    console.log(`${kuntaName}: ${kuntaNumber}`);
    const therapists = await parser.getTherapistsWithParams(
      Lakiperuste.KUNTOUTUSPSYKOTERAPIA,
      kuntaNumber,
      Kuntoutusmuoto.AIKUISTEN,
      Kieli.SUOMI
    );
    /**
     * Loops through the table indices
     * Names are assumed to be unique, so to avoid duplicates they're added to a set
     */
    for (let i = 0; i < therapists.length; i++) {
      const therapistName = therapists[i].name;
      try {
        if (nameSet.has(therapistName)) {
          console.log(`duplicate: ${therapists[i].name}`);
          continue;
        }

        /**
         * After every fifth (barring duplicates) page fetch, navigate back to the main table
         * Experiments showed that it can sometimes work as high as 20 before having to navigate back
         * Iterating through everything is slow but since it's done so sparingly, 5 is enough
         */

        const therapist = await parser.getTherapistInfo(i, i % 5 === 0);
        nameSet.add(therapist.name);
        console.log(therapist);

        /**
         * Save the parsed therapists to "./out/" if env variable is set
         */

        if (process.env.SAVE_JSON === "true") {
          writeFile(
            `./out/${kuntaName}-${therapist.name}.json`,
            JSON.stringify(therapist, null, 2)
          ).catch(console.error);
        }

        /**
         * Sends the therapist's JSON in a HTTP POST request to the URL specified in env variable
         */

        if (process.env.API_URL) {
          axios.post(process.env.API_URL, therapist).catch(console.error);
        }
      } catch (error) {
        console.log(`error with ${therapistName}`);
      }
    }
  }

  /**
   * If no cronjob set, exit the process after it's done
   */

  if (!process.env.CRON) {
    process.exit();
  }
}
