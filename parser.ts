import axios from "axios";
import { JSDOM } from "jsdom";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import querystring from "querystring";
import {
  Lakiperuste,
  Kunta,
  Kieli,
  Suuntaus,
  Kuntoutusmuoto,
  Laji,
} from "./types/enums";
import { Kuntoutus, TherapistSnippet, Therapist } from "./types/types";
import "dotenv/config";

const url = "https://asiointi.kela.fi/palvelutuottajarekisteri/alku/haku.faces";
const allUrl =
  "https://asiointi.kela.fi/palvelutuottajarekisteri/ePTK/hakutulos.faces";

const returnUrl =
  "https://asiointi.kela.fi/palvelutuottajarekisteri/ePTK/palveluntuottajanTiedot.faces";

/**
 * The main parser class, instances have to keep track of JavaFX's ViewState
 * Navigating from one view to another, unfamiliar with the exact logic
 */

export class KelaParser {
  /**
   * The current JavaFX viewstate, needed for navigation
   */
  private currentViewState: string = "";

  /**
   * Axios with cookie support for http requests
   */

  private jar = new CookieJar();
  private client = wrapper(
    axios.create({ jar: this.jar, withCredentials: true })
  );

  /**
   * Parses the JavaFX ViewState from a page's html
   * The state is hidden in a HTML element on every page
   * @param html The html to parse
   */

  getViewStateFromHTML(html: string) {
    const { document } = new JSDOM(html).window;
    const viewState = document.getElementById(
      "javax.faces.ViewState"
    ) as HTMLInputElement;
    this.currentViewState = viewState.value;
  }

  /**
   * After opening the first page, gets the ViewState from it
   */

  async getInitialViewState() {
    const response = await this.client.get(url);
    this.getViewStateFromHTML(response.data);
  }

  /**
   * Sets the "lakiperuste" on the main form
   * The form refreshes the page after it's chosen
   * @param lakiperuste
   */

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

  /**
   * Inits the main form and search
   * omitting Kuntuoutusmuoto gets every option
   * @param lakiperuste 
   * @param kunta 
   * @param Kuntoutusmuoto for some reason this can be omitted
   * @param kieli 
   */

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

  /**
   * Gets the first set of search results
   * The form gets refreshed after {@link initTherapists}
   * @param lakiperuste 
   * @param kunta 
   * @param kuntoutusmuoto 
   * @param kieli 
   */

  async getTherapists(
    lakiperuste: Lakiperuste,
    kunta: Kunta,
    kuntoutusmuoto: Kuntoutusmuoto,
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

  /**
   * After the first set of results, get all of them without pagination
   * This _should_ return everything from one {@link Kunta}
   * @returns the sorted table's html
   */

  async getAllTherapists(): Promise<string> {
    const response = await this.client.post(
      allUrl,
      querystring.stringify({
        hakutulos_form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
        "hakutulos_form1:_idcl": "hakutulos_form1:naytaKaikkiCommandLink",
      })
    );
    this.getViewStateFromHTML(response.data);
    const sortedTable = await this.sortTable();
    return sortedTable;
  }

  /**
   * Sorts the table so they're all in order
   * Needed to go through them in order
   * Viewstate limitations mean you can't get all results at the same time
   * @returns the sorted table's html
   */

  async sortTable(): Promise<string> {
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

  /**
   * Gets a single therapist's full information from the (hopefully) sorted table
   * You can navigate to somewhere between 5-20 of these from the root ViewState until it breaks
   * You have to navigate back to the main table every now and then for some reason
   * I have no idea how JavaFX's ViewStates are supposed to work
   * @param tableIndex index in the table, looped through
   * @param navigateBackAfter whether the parser should return to the main table after
   * @returns a therapist's JSON
   */

  async getTherapistInfo(tableIndex: number, navigateBackAfter = false) {
    const response = await this.client.post(
      allUrl,
      querystring.stringify({
        hakutulos_form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
        "hakutulos_form1:_idcl": `hakutulos_form1:tableExPalveluntuottajat:${tableIndex}:palveluntuottajaCommandLink`,
      })
    );
    if (navigateBackAfter) {
      this.getViewStateFromHTML(response.data);
      await this.navigateBack();
    }
    const therapist = this.parseTherapist(response.data);
    return therapist;
  }
  
  /**
   * Navigates back from a therapist's info page onto the main (sorted) table
   * @returns html from the table again
   */

  async navigateBack(): Promise<string> {
    const response = await this.client.post(
      returnUrl,
      querystring.stringify({
        form1_SUBMIT: "1",
        "javax.faces.ViewState": this.currentViewState,
        "form1:PalaaHakutulokseenButton": "Palaa hakutulokseen",
      })
    );
    this.getViewStateFromHTML(response.data);
    return response.data;
  }

  /**
   * Main function, gets an array of therapist snippets from the parameters
   * Use said array to iterate through them with {@link getTherapistInfo}
   * ViewStates should be handled through the functions themselves
   * @param lakiperuste 
   * @param kunta 
   * @param kuntoutusmuoto 
   * @param kieli 
   * @returns
   */

  async getTherapistsWithParams(
    lakiperuste: Lakiperuste,
    kunta: Kunta,
    kuntoutusmuoto: Kuntoutusmuoto,
    kieli: Kieli
  ): Promise<TherapistSnippet[]> {
    await this.jar.removeAllCookies();
    await this.getInitialViewState();
    await this.setLakiperuste(lakiperuste);
    await this.initTherapists(lakiperuste, kunta, kuntoutusmuoto, kieli);
    await this.getTherapists(lakiperuste, kunta, kuntoutusmuoto, kieli);
    const therapistsHtml = await this.getAllTherapists();
    const therapists = this.parseTable(therapistsHtml);
    return therapists;
  }

  /**
   * Parses through the main table and returns therapist snippets
   * @param html the table's html
   * @returns 
   */

  parseTable(html: string) {
    const { document } = new JSDOM(html).window;
    const table = document.getElementById(
      "hakutulos_form1:tableExPalveluntuottajat:tbody_element"
    ) as HTMLTableElement;
    const rows = table.querySelectorAll("tr");
    const therapistObjects = Array.from(rows).map((r) => this.parseRow(r));
    return therapistObjects;
  }

  /**
   * Tries to parse the locations from a therapist's info page
   * The website has a very convoluted way of listing information, par the course for Kela
   * Filters through non-alphabetical (finnish) content
   * @param document 
   * @returns 
   */

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

  /**
   * Parses the therapist's name
   * @param document 
   * @returns 
   */

  parseName(document: Document) {
    const nameTitleNode = document.getElementById(
      "form1:NimiText"
    ) as HTMLElement;
    const name =
      nameTitleNode.parentElement?.nextElementSibling?.textContent?.trim() as string;
    return name;
  }

  /**
   * Parses the therapist's phone number(s) if any
   * @param document 
   * @returns 
   */

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
      return phoneNumbers;
    }
    return [];
  }

  /**
   * Parses the therapist's home page if any
   * @param document 
   * @returns 
   */

  parseHomePage(document: Document) {
    const homePageTitleNode = document.getElementById("form1:WwwText");
    if (homePageTitleNode) {
      const homepage =
        homePageTitleNode.parentElement?.nextElementSibling?.textContent?.trim() as string;
      return homepage;
    }
    return null;
  }

  /**
   * Parses the therapist's email address if any
   * @param document 
   * @returns 
   */

  parseEmailAddress(document: Document) {
    const emailTitleNode = document.getElementById("form1:MailText");
    if (emailTitleNode) {
      const emailAddress =
        emailTitleNode.parentElement?.nextElementSibling?.textContent?.trim() as string;
      return emailAddress;
    }
    return null;
  }

  /**
   * Parses the therapist's spoken languages (hopefully at least one)
   * @param document 
   * @returns 
   */

  parseLanguages(document: Document) {
    const languageTitleNode = document.getElementById(
      "form1:KieliText"
    ) as HTMLElement;
    const languageString = languageTitleNode.parentElement?.nextElementSibling
      ?.textContent as string;
    const languages = languageString.split(",").map((n) => n.trim());
    return languages;
  }

  /**
   * Tries to parse through the therapist's orientations {@link Suuntaus}
   * Some of the pages have none listed for some reason
   * @param document 
   * @returns an array of {@link Suuntaus} or an empty array if none were found
   */

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

  /**
   * Parses through the therapist's therapy types and their subcategories
   * Every therapist _should_ have at least some, see the type for {@link Kuntoutus}
   * @param document 
   * @returns 
   */

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

  /**
   * Parses through all of the nodes on a therapist's page
   * Calls every parsing function
   * @param html the therapist's page
   * @returns 
   */

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
      therapies: this.parseTherapyTypes(document),
    };
  }

  /**
   * Parses through a row on the main table
   * Snippets are all we get from the table, so have to open each page one by one
   * @param row 
   * @returns 
   */

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
