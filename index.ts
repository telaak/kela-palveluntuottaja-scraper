import axios from "axios";
import { JSDOM } from "jsdom";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { writeFile, readFile } from "fs/promises";
import querystring from "querystring";
import { PrismaClient } from "@prisma/client";
import {
  Lakiperuste,
  Kunta,
  Kieli,
  Suuntaus,
  Kuntoutusmuoto,
  Laji,
} from "./types/enums";
import { Kuntoutus, TherapistSnippet, Therapist } from "./types/types";

const prisma = new PrismaClient();

const url = "https://asiointi.kela.fi/palvelutuottajarekisteri/alku/haku.faces";
const allUrl =
  "https://asiointi.kela.fi/palvelutuottajarekisteri/ePTK/hakutulos.faces";

class KelaParser {
  public currentViewState!: string;
  private jar = new CookieJar();
  private client = wrapper(
    axios.create({ jar: this.jar, withCredentials: true })
  );

  public phoneNumberSet: Set<string> = new Set();

  getViewStateFromHTML(html: string) {
    const { document } = new JSDOM(html).window;
    const viewState = document.getElementById(
      "javax.faces.ViewState"
    ) as HTMLInputElement;
    this.currentViewState = viewState.value;
  }

  async getInitialViewState() {
    const response = await this.client.get(url);
    this.getViewStateFromHTML(response.data);
  }

  async setLakiperuste(lakiperuste: Lakiperuste) {
    const response = await this.client.post(
      url,
      querystring.stringify({
        "form1:radioLakiperuste": lakiperuste,
        "form1:inputTextNimihaku": "",
        "form1:button1": "Submit",
        form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
      })
    );
    this.getViewStateFromHTML(response.data);
  }

  async initTherapists(
    lakiperuste: Lakiperuste,
    kunta: Kunta,
    Kuntoutusmuoto: Kuntoutusmuoto,
    kieli: Kieli
  ) {
    const response = await this.client.post(
      url,
      querystring.stringify({
        "form1:radioLakiperuste": lakiperuste,
        "form1:inputTextNimihaku": "",
        "form1:selectOneMenuKunta": kunta,
        "form1:selectOneMenuKuntoutusmuoto": Kuntoutusmuoto,
        "form1:button2": "Submit",
        "form1:selectOneMenuKommunikaatio": kieli,
        form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
      })
    );
    this.getViewStateFromHTML(response.data);
  }

  async getTherapists(
    lakiperuste: Lakiperuste,
    kunta: Kunta,
    Kuntoutusmuoto: Kuntoutusmuoto,
    kieli: Kieli
  ) {
    const response = await this.client.post(
      url,
      querystring.stringify({
        "form1:radioLakiperuste": lakiperuste,
        "form1:inputTextNimihaku": "",
        "form1:selectOneMenuKunta": kunta,
        "form1:selectOneMenuKuntoutusmuoto": Kuntoutusmuoto,
        "form1:selectoneMenuTarkentava1": "",
        "form1:selectoneMenuTarkentava2": "Kaikki",
        "form1:selectOneMenuKommunikaatio": kieli,
        "form1:haeButton": "Hae",
        form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
      })
    );
    this.getViewStateFromHTML(response.data);
  }

  async getAllTherapists() {
    const response = await this.client.post(
      allUrl,
      querystring.stringify({
        hakutulos_form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
        "hakutulos_form1:_idcl": "hakutulos_form1:naytaKaikkiCommandLink",
      })
    );
    this.getViewStateFromHTML(response.data);
    return response.data;
  }

  async getTherapistInfo(tableIndex: number) {
    const response = await this.client.post(
      allUrl,
      querystring.stringify({
        hakutulos_form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
        "hakutulos_form1:_idcl": `hakutulos_form1:tableExPalveluntuottajat:${tableIndex}:palveluntuottajaCommandLink`,
      })
    );
    // this.getViewStateFromHTML(response.data);
    return response.data;
  }

  async navigateBack() {}

  async getTherapistsWithParams(
    lakiperuste: Lakiperuste,
    kunta: Kunta,
    Kuntoutusmuoto: Kuntoutusmuoto,
    kieli: Kieli
  ): Promise<string> {
    await this.jar.removeAllCookies();
    await this.getInitialViewState();
    await this.setLakiperuste(lakiperuste);
    await this.initTherapists(lakiperuste, kunta, Kuntoutusmuoto, kieli);
    await this.getTherapists(
      Lakiperuste.KUNTOUTUSPSYKOTERAPIA,
      kunta,
      Kuntoutusmuoto,
      kieli
    );
    const therapists = await this.getAllTherapists();
    return therapists;
  }

  parseTable(html: string) {
    const { document } = new JSDOM(html).window;
    const table = document.getElementById(
      "hakutulos_form1:tableExPalveluntuottajat:tbody_element"
    ) as HTMLTableElement;
    const rows = table.querySelectorAll("tr");
    const therapistObjects = Array.from(rows).map((r) => this.parseRow(r));
    return therapistObjects;
  }

  parseLocations(document: Document) {
    const locationTitleNode = document.getElementById(
      "form1:SijaintiText"
    ) as HTMLElement;
    const locationCells =
      locationTitleNode.parentElement!.nextElementSibling!.querySelectorAll(
        "span"
      );
    const primaryLocation = locationCells[0]?.textContent;
    const secondaryLocations = locationCells[1]
      ? (locationCells[1].textContent
          ?.replace(/[^A-ZÄÖÅ,]/g, "")
          .split(",") as string[])
      : [];

    const locations = [primaryLocation, ...secondaryLocations] as string[];
    return locations;
  }

  parseName(document: Document) {
    const nameTitleNode = document.getElementById(
      "form1:NimiText"
    ) as HTMLElement;
    const name =
      nameTitleNode.parentElement?.nextElementSibling?.textContent?.trim() as string;
    return name;
  }

  parsePhoneNumbers(document: Document) {
    const phoneNumberTitleNode = document.getElementById(
      "form1:PuhelinText"
    ) as HTMLElement;
    const phoneNumberString =
      phoneNumberTitleNode.parentElement?.nextElementSibling?.textContent?.trim() as string;
    const phoneNumbers = phoneNumberString
      .split(",")
      .map((n) => n.replace(/[^0-9+]/g, ""));
    return phoneNumbers;
  }

  parseEmailAddress(document: Document) {
    const emailTitleNode = document.getElementById("form1:MailText");
    if (emailTitleNode) {
      const emailAddress =
        emailTitleNode.parentElement?.nextElementSibling?.textContent?.trim() as string;
      return emailAddress;
    }
    return null;
  }

  parseLanguages(document: Document) {
    const languageTitleNode = document.getElementById(
      "form1:KieliText"
    ) as HTMLElement;
    const languageString = languageTitleNode.parentElement?.nextElementSibling
      ?.textContent as string;
    const languages = languageString.split(",").map((n) => n.trim());
    return languages;
  }

  parseOrientations(document: Document) {
    const orientationTable = document.getElementById(
      "form1:terapiansuuntauksetPanelGrid"
    );
    const orientationNodes = orientationTable?.querySelectorAll(
      ".palveluntuottajanTiedotOikeaSarake"
    ) as NodeListOf<HTMLTableCellElement>;
    const orientations = Array.from(orientationNodes).map((n) =>
      n.textContent?.trim()
    ) as Suuntaus[];
    return orientations;
  }

  parseTherapyTypes(document: Document): Kuntoutus[] {
    const rootTable = document.getElementById(
      "form1:j_id_jsp_1117862750_45"
    ) as HTMLTableElement;
    const rootCells = rootTable.querySelectorAll(
      ".palveluntuottajanTiedotOikeaSarake"
    ) as NodeListOf<HTMLTableCellElement>;
    const kuntoutukset = Array.from(rootCells).map((n) => {
      const muoto = n.querySelector("a")?.textContent as Kuntoutusmuoto;
      const lajiTable = n.querySelector("table") as HTMLTableElement;
      const lajiNodes = lajiTable.querySelectorAll(
        ".palveluntuottajanTiedotDatatableTarkenneOikeaSarake"
      ) as NodeListOf<HTMLTableCellElement>;
      const lajit = Array.from(lajiNodes).map((n) =>
        n.textContent?.trim()
      ) as Laji[];
      return {
        muoto,
        lajit,
      };
    });
    return kuntoutukset;
  }

  parseTherapist(html: string): Therapist {
    const { document } = new JSDOM(html).window;
    return {
      name: this.parseName(document),
      locations: this.parseLocations(document),
      phoneNumbers: this.parsePhoneNumbers(document),
      email: this.parseEmailAddress(document),
      languages: this.parseLanguages(document),
      orientations: this.parseOrientations(document),
      therapyTypes: this.parseTherapyTypes(document),
    };
  }

  parseRow(row: HTMLTableRowElement): TherapistSnippet {
    const cells = row.querySelectorAll("td");
    const name = cells[0].textContent as string;
    const location = cells[1].textContent as string;
    const phoneNumbers = cells[2].textContent
      ?.split(",")
      .map((p) => p.replace(/\s/g, "")) as string[];
    const links = Array.from(cells[3].querySelectorAll("a")).map((n) => n.href);
    return {
      name,
      location,
      phoneNumbers,
      links,
    };
  }
}

const entries = Object.entries(Kunta).slice(0, 1);
const parser = new KelaParser();

async function iterate() {
  for (const [key, value] of entries) {
    console.log(`${key}: ${value}`);
    const therapistsHtml = await parser.getTherapistsWithParams(
      Lakiperuste.KUNTOUTUSPSYKOTERAPIA,
      value,
      Kuntoutusmuoto.AIKUISTEN,
      Kieli.SUOMI
    );
    const therapists = parser.parseTable(therapistsHtml);
    for (let i = 0; i < 10; i++) {
      const data = await parser.getTherapistInfo(i);
      const therapist = parser.parseTherapist(data);
      await prisma.therapist.create({
        data: {
          name: therapist.name,
          email: therapist.email,
          homepage: therapist.homepage,
          phoneNumbers: {
            create: therapist.phoneNumbers.map((number) => {
              return {
                number: number,
              };
            }),
          },
          languages: {
            connect: therapist.languages.map((language) => {
              return {
                fiFI: language,
              };
            }),
          },
          orientations: {
            connect: therapist.orientations.map((orientation) => {
              return {
                fiFI: orientation,
              };
            }),
          },
          therapies: {
            create: therapist.therapyTypes.map((kuntoutus) => {
              return {
                muoto: kuntoutus.muoto,
                lajit: kuntoutus.lajit,
              };
            }),
          },
        },
      });
      // await writeFile(
      //   `./out/${therapists[i].name}.json`,
      //   JSON.stringify(therapist, null, 2)
      // );
    }
    // await writeFile(
    //   `./out/${key}_${value}.json`,
    //   JSON.stringify(therapists, null, 2)
    // );
  }
}

// readFile("./AKAA_020.html", "utf-8").then((html) => {
//   const therapists = parser.parseTable(html);
//   console.log(therapists);
// });

iterate();
