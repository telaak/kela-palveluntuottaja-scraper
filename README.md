# Kela Terapeuttihakemiston "raaputin"

Ohjelma, jolla voidaan "raaputtaa" Kelan antiikkisesta terapeuttihakemistosta terapeutit huomattavasti helpommin käsiteltävään JSON-muotoon.

## Kuvaus

Ohjelma hakee Kelan [palvelutuottajarekisteristä](https://asiointi.kela.fi/palvelutuottajarekisteri/) eri hakukriteereillä palveluntarjoajia. Pääkäytteisesti ohjelma hakee vain kuntoutuspsykoterapeutteja, mutta KelaParser-luokkaa voidaan käyttää kaikkien Kelan rekisterissä olevien hakemiseen.

### Dokumentaatio

Suurin osa lähdekoodista on kommentoitu, ja kommenteista luotu TypeDoc löytyy osoitteesta [https://terapeuttihaku.fi/docs/kela-scraper/](https://terapeuttihaku.fi/docs/kela-scraper/)

## Aloittaminen

### Vaatimukset

* Node.js

### Asentaminen

1. `git pull github.com/telaak/kela-palveluntuottaja-scraper.git`
2. Asenna paketit `npm i`
3. Aja TypeScript compiler `npx tsc`
4. Täytä ympäristömuuttujat:
      * API_URL (osoite minne ohjelma lähettää terapeuttien JSON:n HTTP POST:lla)
      * SAVE_JSON (jos "true", tallentaa terapeuttien JSON:n /out/-kansioon)
      * PARSE_ON_BOOT (jos "true", ohjelma aloittaa heti käynnistyessään käydä läpi terapeutteja)
      * CRON (ajastettua toistoa varten, katso cron:n dokumentaatio)
      * KUNNAT (pilkulla eroitettu lista kunnista joita haluat käydä läpi, katso lista [täältä](https://terapeuttihaku.fi/docs/kela-scraper/enums/types_enums.Kunta.html)
5. Käynnistä ohjelma `node ./dist/index.js`

### Docker

## Build

* `docker build -t username/kela-palveluntuottaja-scraper`

## Compose

```
version: '3.8'

services:
    
  frontend:
    image: telaaks/kela-palveluntuottaja-scraper
    restart: unless-stopped
    environment:
      - API_URL=http://
     # - PARSE_ON_BOOT=true
     # - SAVE_JSON=true
     # - CRON=15 20 * * *
     # - KUNNAT=ALAVIESKA,AKAA
    ports:
      - 3000:3000
```

## License

This project is licensed under the MIT License - see the LICENSE.md file for details
