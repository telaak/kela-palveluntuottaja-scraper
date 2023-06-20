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

const returnUrl =
  "https://asiointi.kela.fi/palvelutuottajarekisteri/ePTK/palveluntuottajanTiedot.faces";

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
        // "form1:selectOneMenuKuntoutusmuoto": Kuntoutusmuoto,
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
        //  "form1:selectOneMenuKuntoutusmuoto": Kuntoutusmuoto,
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
    const sortedResponse = await this.client.post(
      allUrl,
      querystring.stringify({
        hakutulos_form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
        "hakutulos_form1:_idcl":
          "hakutulos_form1:tableExPalveluntuottajat:j_id_jsp_932386772_22",
      })
    );
    this.getViewStateFromHTML(sortedResponse.data);
    return sortedResponse.data;
  }

  async getTherapistInfo(tableIndex: number, setViewState = false) {
    const response = await this.client.post(
      allUrl,
      querystring.stringify({
        hakutulos_form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
        "hakutulos_form1:_idcl": `hakutulos_form1:tableExPalveluntuottajat:${tableIndex}:palveluntuottajaCommandLink`,
      })
    );
    if (setViewState) {
      this.getViewStateFromHTML(response.data);
      await this.navigateBack();
    }
    return response.data;
  }

  async navigateBack() {
    const response = await this.client.post(
      returnUrl,
      querystring.stringify({
        hakutulos_form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
        "form1:PalaaHakutulokseenButton: ": "Palaa hakutulokseen",
      })
    );
    this.getViewStateFromHTML(response.data);
  }

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
    if (phoneNumberTitleNode) {
      const phoneNumberString =
        phoneNumberTitleNode.parentElement?.nextElementSibling?.textContent?.trim() as string;
      const phoneNumbers = phoneNumberString
        .split(",")
        .map((n) => n.replace(/[^0-9+]/g, "").trim());
      phoneNumbers.forEach((n) => this.phoneNumberSet.add(n));
      return phoneNumbers;
    }
    return [];
  }

  parseHomePage(document: Document) {
    const homePageTitleNode = document.getElementById("form1:WwwText");
    if (homePageTitleNode) {
      const homepage =
        homePageTitleNode.parentElement?.nextElementSibling?.textContent?.trim() as string;
      return homepage;
    }
    return null;
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
    if (orientationNodes) {
      const orientations = Array.from(orientationNodes).map((n) =>
        n.textContent?.trim()
      ) as Suuntaus[];
      return orientations;
    }
    return [];
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
      homepage: this.parseHomePage(document),
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

const entries = Object.entries(Kunta);

async function getTherapists(parser: KelaParser, kunta: Kunta) {
  const therapistsHtml = await parser.getTherapistsWithParams(
    Lakiperuste.KUNTOUTUSPSYKOTERAPIA,
    kunta,
    Kuntoutusmuoto.AIKUISTEN,
    Kieli.SUOMI
  );
  const therapists = parser.parseTable(therapistsHtml);
  return therapists;
}

async function parse(parser: KelaParser, kunta: Kunta) {
  let therapists = await getTherapists(parser, kunta);
  let counter = 0;
  for (let i = 0; i < therapists.length; i++) {
    try {
      const nameCheck = await prisma.therapist.findUnique({
        where: {
          name: therapists[i].name,
        },
      });
      if (nameCheck) continue;

      if (counter % 10 === 0 && counter !== 0) {
        therapists = await getTherapists(parser, kunta);
      }
      const data = await parser.getTherapistInfo(i);
      const therapist = parser.parseTherapist(data);
      const newTherapist = {
        name: therapist.name,
        email: therapist.email,
        homepage: therapist.homepage,
        locations: {
          connectOrCreate: therapist.locations.map((location) => {
            return {
              where: {
                name: location,
              },
              create: {
                name: location,
              },
            };
          }),
        },
        phoneNumbers: {
          create: therapist.phoneNumbers.map((number) => {
            return {
              number: number,
            };
          }),
        },
        languages: {
          connectOrCreate: therapist.languages.map((language) => {
            return {
              where: {
                fiFI: language,
              },
              create: {
                fiFI: language,
              },
            };
          }),
        },
        orientations: {
          connectOrCreate: therapist.orientations.map((orientation) => {
            return {
              where: {
                fiFI: orientation,
              },
              create: {
                fiFI: orientation,
              },
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
      };
      await prisma.therapist.create({
        data: newTherapist,
      });
      counter++;
      console.log(therapist);
    } catch (error) {
      counter++;
      console.error(error);
    }
  }
}

async function iterate() {
  for (const [key, value] of entries) {
    const parser = new KelaParser();
    console.log(`${key}: ${value}`);
    await parse(parser, value);
  }
}

iterate();
