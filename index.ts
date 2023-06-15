import axios from "axios";
import { JSDOM } from "jsdom";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { writeFile, readFile } from "fs/promises";
import querystring from "querystring";

const url = "https://asiointi.kela.fi/palvelutuottajarekisteri/alku/haku.faces";
const allUrl =
  "https://asiointi.kela.fi/palvelutuottajarekisteri/ePTK/hakutulos.faces";

enum Kunta {
  AKAA = "020",
  ALAJÄRVI = "005",
  ALAVIESKA = "009",
  ALAVUS = "010",
  ASIKKALA = "016",
  ASKOLA = "018",
  AURA = "019",
  BRÄNDÖ = "035",
  ECKERÖ = "043",
  ENONKOSKI = "046",
  ENONTEKIÖ = "047",
  ESPOO = "049",
  EURA = "050",
  EURAJOKI = "051",
  EVIJÄRVI = "052",
  FINSTRÖM = "060",
  FORSSA = "061",
  FÖGLÖ = "062",
  GETA = "065",
  HAAPAJÄRVI = "069",
  HAAPAVESI = "071",
  HAILUOTO = "072",
  HALSUA = "074",
  HAMINA = "075",
  HAMMARLAND = "076",
  HANKASALMI = "077",
  HANKO = "078",
  HARJAVALTA = "079",
  HARTOLA = "081",
  HATTULA = "082",
  HAUSJÄRVI = "086",
  HEINOLA = "111",
  HEINÄVESI = "090",
  HELSINKI = "091",
  HIRVENSALMI = "097",
  HOLLOLA = "098",
  HUITTINEN = "102",
  HUMPPILA = "103",
  HYRYNSALMI = "105",
  HYVINKÄÄ = "106",
  HÄMEENKYRÖ = "108",
  HÄMEENLINNA = "109",
  II = "139",
  IISALMI = "140",
  IITTI = "142",
  IKAALINEN = "143",
  ILMAJOKI = "145",
  ILOMANTSI = "146",
  IMATRA = "153",
  INARI = "148",
  INKOO = "149",
  ISOJOKI = "151",
  ISOKYRÖ = "152",
  JANAKKALA = "165",
  JOENSUU = "167",
  JOKIOINEN = "169",
  JOMALA = "170",
  JOROINEN = "171",
  JOUTSA = "172",
  JUUKA = "176",
  JUUPAJOKI = "177",
  JUVA = "178",
  JYVÄSKYLÄ = "179",
  JÄMIJÄRVI = "181",
  JÄMSÄ = "182",
  JÄRVENPÄÄ = "186",
  KAARINA = "202",
  KAAVI = "204",
  KAJAANI = "205",
  KALAJOKI = "208",
  KANGASALA = "211",
  KANGASNIEMI = "213",
  KANKAANPÄÄ = "214",
  KANNONKOSKI = "216",
  KANNUS = "217",
  KARIJOKI = "218",
  KARKKILA = "224",
  KARSTULA = "226",
  KARVIA = "230",
  KASKINEN = "231",
  KAUHAJOKI = "232",
  KAUHAVA = "233",
  KAUNIAINEN = "235",
  KAUSTINEN = "236",
  KEITELE = "239",
  KEMI = "240",
  KEMIJÄRVI = "320",
  KEMINMAA = "241",
  KEMIÖNSAARI = "322",
  KEMPELE = "244",
  KERAVA = "245",
  KEURUU = "249",
  KIHNIÖ = "250",
  KINNULA = "256",
  KIRKKONUMMI = "257",
  KITEE = "260",
  KITTILÄ = "261",
  KIURUVESI = "263",
  KIVIJÄRVI = "265",
  KOKEMÄKI = "271",
  KOKKOLA = "272",
  KOLARI = "273",
  KONNEVESI = "275",
  KONTIOLAHTI = "276",
  KORSNÄS = "280",
  KOSKI_TL = "284",
  KOTKA = "285",
  KOUVOLA = "286",
  KRISTIINANKAUPUNKI = "287",
  KRUUNUPYY = "288",
  KUHMO = "290",
  KUHMOINEN = "291",
  KUMLINGE = "295",
  KUOPIO = "297",
  KUORTANE = "300",
  KURIKKA = "301",
  KUSTAVI = "304",
  KUUSAMO = "305",
  KYYJÄRVI = "312",
  KÄRKÖLÄ = "316",
  KÄRSÄMÄKI = "317",
  KÖKAR = "318",
  LAHTI = "398",
  LAIHIA = "399",
  LAITILA = "400",
  LAPINJÄRVI = "407",
  LAPINLAHTI = "402",
  LAPPAJÄRVI = "403",
  LAPPEENRANTA = "405",
  LAPUA = "408",
  LAUKAA = "410",
  LEMI = "416",
  LEMLAND = "417",
  LEMPÄÄLÄ = "418",
  LEPPÄVIRTA = "420",
  LESTIJÄRVI = "421",
  LIEKSA = "422",
  LIETO = "423",
  LIMINKA = "425",
  LIPERI = "426",
  LOHJA = "444",
  LOIMAA = "430",
  LOPPI = "433",
  LOVIISA = "434",
  LUHANKA = "435",
  LUMIJOKI = "436",
  LUMPARLAND = "438",
  LUOTO = "440",
  LUUMÄKI = "441",
  MAALAHTI = "475",
  MAARIANHAMINA = "478",
  MARTTILA = "480",
  MASKU = "481",
  MERIJÄRVI = "483",
  MERIKARVIA = "484",
  MIEHIKKÄLÄ = "489",
  MIKKELI = "491",
  MUHOS = "494",
  MULTIA = "495",
  MUONIO = "498",
  MUSTASAARI = "499",
  MUURAME = "500",
  MYNÄMÄKI = "503",
  MYRSKYLÄ = "504",
  MÄNTSÄLÄ = "505",
  MÄNTTÄ_VILPPULA = "508",
  MÄNTYHARJU = "507",
  NAANTALI = "529",
  NAKKILA = "531",
  NIVALA = "535",
  NOKIA = "536",
  NOUSIAINEN = "538",
  NURMES = "541",
  NURMIJÄRVI = "543",
  NÄRPIÖ = "545",
  ORIMATTILA = "560",
  ORIPÄÄ = "561",
  ORIVESI = "562",
  OULAINEN = "563",
  OULU = "564",
  OUTOKUMPU = "309",
  PADASJOKI = "576",
  PAIMIO = "577",
  PALTAMO = "578",
  PARAINEN = "445",
  PARIKKALA = "580",
  PARKANO = "581",
  PEDERSÖRE = "599",
  PELKOSENNIEMI = "583",
  PELLO = "854",
  PERHO = "584",
  PERTUNMAA = "588",
  PETÄJÄVESI = "592",
  PIEKSÄMÄKI = "593",
  PIELAVESI = "595",
  PIETARSAARI = "598",
  PIHTIPUDAS = "601",
  PIRKKALA = "604",
  POLVIJÄRVI = "607",
  POMARKKU = "608",
  PORI = "609",
  PORNAINEN = "611",
  PORVOO = "638",
  POSIO = "614",
  PUDASJÄRVI = "615",
  PUKKILA = "616",
  PUNKALAIDUN = "619",
  PUOLANKA = "620",
  PUUMALA = "623",
  PYHTÄÄ = "624",
  PYHÄJOKI = "625",
  PYHÄJÄRVI = "626",
  PYHÄNTÄ = "630",
  PYHÄRANTA = "631",
  PÄLKÄNE = "635",
  PÖYTYÄ = "636",
  RAAHE = "678",
  RAASEPORI = "710",
  RAISIO = "680",
  RANTASALMI = "681",
  RANUA = "683",
  RAUMA = "684",
  RAUTALAMPI = "686",
  RAUTAVAARA = "687",
  RAUTJÄRVI = "689",
  REISJÄRVI = "691",
  RIIHIMÄKI = "694",
  RISTIJÄRVI = "697",
  ROVANIEMI = "698",
  RUOKOLAHTI = "700",
  RUOVESI = "702",
  RUSKO = "704",
  RÄÄKKYLÄ = "707",
  SAARIJÄRVI = "729",
  SALLA = "732",
  SALO = "734",
  SALTVIK = "736",
  SASTAMALA = "790",
  SAUVO = "738",
  SAVITAIPALE = "739",
  SAVONLINNA = "740",
  SAVUKOSKI = "742",
  SEINÄJOKI = "743",
  SIEVI = "746",
  SIIKAINEN = "747",
  SIIKAJOKI = "748",
  SIIKALATVA = "791",
  SIILINJÄRVI = "749",
  SIMO = "751",
  SIPOO = "753",
  SIUNTIO = "755",
  SODANKYLÄ = "758",
  SOINI = "759",
  SOMERO = "761",
  SONKAJÄRVI = "762",
  SOTKAMO = "765",
  SOTTUNGA = "766",
  SULKAVA = "768",
  SUND = "771",
  SUOMUSSALMI = "777",
  SUONENJOKI = "778",
  SYSMÄ = "781",
  SÄKYLÄ = "783",
  TAIPALSAARI = "831",
  TAIVALKOSKI = "832",
  TAIVASSALO = "833",
  TAMMELA = "834",
  TAMPERE = "837",
  TERVO = "844",
  TERVOLA = "845",
  TEUVA = "846",
  TOHMAJÄRVI = "848",
  TOHOLAMPI = "849",
  TOIVAKKA = "850",
  TORNIO = "851",
  TURKU = "853",
  TUUSNIEMI = "857",
  TUUSULA = "858",
  TYRNÄVÄ = "859",
  ULVILA = "886",
  URJALA = "887",
  UTAJÄRVI = "889",
  UTSJOKI = "890",
  UURAINEN = "892",
  UUSIKAARLEPYY = "893",
  UUSIKAUPUNKI = "895",
  VAALA = "785",
  VAASA = "905",
  VALKEAKOSKI = "908",
  VANTAA = "092",
  VARKAUS = "915",
  VEHMAA = "918",
  VESANTO = "921",
  VESILAHTI = "922",
  VETELI = "924",
  VIEREMÄ = "925",
  VIHTI = "927",
  VIITASAARI = "931",
  VIMPELI = "934",
  VIROLAHTI = "935",
  VIRRAT = "936",
  VÅRDÖ = "941",
  VÖYRI = "946",
  YLITORNIO = "976",
  YLIVIESKA = "977",
  YLÖJÄRVI = "980",
  YPÄJÄ = "981",
  ÄHTÄRI = "989",
  ÄÄNEKOSKI = "992",
}

enum Lakiperuste {
  VAATIVA = "3",
  KUNTOUTUSPSYKOTERAPIA = "K",
  HARKINNANVARAINEN = "4",
  AMMATILLINEN = "2",
}

enum Toimenpide {
  AIKUISTEN = "Aikuisten psykoterapia",
  KUVATAIDE = "Kuvataidepsykoterapia",
  MUSIIKKI = "Nuorten musiikkiterapia",
  NUORTEN = "Nuorten psykoterapia",
}

enum Kieli {
  ENGLANTI = "englanti",
  VIRO = "viro",
  SUOMI = "suomi",
  RANSKA = "ranska",
  VENÄJÄ = "venäjä",
  SOMALI = "somali",
  ESPANJA = "espanja",
  RUOTSI = "ruotsi",
  GRAAFISET_MERKIT = "graafiset merkit",
  TUKIVIITTOMAT = "tukiviittomat",
  VIITTOMAKIELI = "viittomakieli",
}

class KelaParser {
  public currentViewState!: string;
  private jar = new CookieJar();
  private client = wrapper(
    axios.create({ jar: this.jar, withCredentials: true })
  );

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
    toimenpide: Toimenpide,
    kieli: Kieli
  ) {
    const response = await this.client.post(
      url,
      querystring.stringify({
        "form1:radioLakiperuste": lakiperuste,
        "form1:inputTextNimihaku": "",
        "form1:selectOneMenuKunta": kunta,
        "form1:selectOneMenuToimenpide": toimenpide,
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
    toimenpide: Toimenpide,
    kieli: Kieli
  ) {
    const response = await this.client.post(
      url,
      querystring.stringify({
        "form1:radioLakiperuste": lakiperuste,
        "form1:inputTextNimihaku": "",
        "form1:selectOneMenuKunta": kunta,
        "form1:selectOneMenuToimenpide": toimenpide,
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

  async getTherapistsWithParams(
    lakiperuste: Lakiperuste,
    kunta: Kunta,
    toimenpide: Toimenpide,
    kieli: Kieli
  ) {
    await this.jar.removeAllCookies();
    await this.getInitialViewState();
    await this.setLakiperuste(lakiperuste);
    await this.initTherapists(lakiperuste, kunta, toimenpide, kieli);
    await this.getTherapists(
      Lakiperuste.KUNTOUTUSPSYKOTERAPIA,
      kunta,
      toimenpide,
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

  parseRow(row: HTMLTableRowElement) {
    const cells = row.querySelectorAll("td");
    const name = cells[0].textContent;
    const location = cells[1].textContent;
    const phoneNumbers = cells[2].textContent
      ?.split(",")
      .map((p) => p.replace(/\s/g, ""));
    const links = Array.from(cells[3].querySelectorAll("a")).map((n) => n.href);
    return {
      name,
      location,
      phoneNumbers,
      links,
    };
  }
}

const entries = Object.entries(Kunta).slice(0, 10);
const parser = new KelaParser();

async function iterate() {
  for (const [key, value] of entries) {
    console.log(`${key}: ${value}`);
    const therapists = await parser.getTherapistsWithParams(
      Lakiperuste.KUNTOUTUSPSYKOTERAPIA,
      value,
      Toimenpide.AIKUISTEN,
      Kieli.SUOMI
    );
    await writeFile(`./${key}_${value}.html`, therapists);
  }
}

readFile("./AKAA_020.html", "utf-8").then((html) => {
  const therapists = parser.parseTable(html);
  console.log(therapists);
});

// iterate();
