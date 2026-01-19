# Synchro Webapp

Informazioni essenziali

- Nome progetto: Synchro Webapp
- Descrizione breve: Webapp front-end per la raccolta e visualizzazione di timeline/attività (integrazione con Google Sheets / Apps Script per dati).
- Link al progetto su Figma: (da aggiungere)

Tecnologie usate

- JavaScript (vanilla / moduli)
- HTML, CSS
- Google Sheets + Google Apps Script (integrazione dati)
- Hosting via FTP (FileZilla)

Setup locale

Prerequisiti

- Node.js (consigliata LTS, es. Node 18.x)
- npm (incluso con Node.js)
- Accesso al Google Sheet e allo Script (per APP_SCRIPT_ID e SHEET_ID)
- FTP credentials per deploy via FileZilla (se necessario)

Installazione

1. Clona il repository:
   - git clone https://github.com/emma-troni/synchro-webapp.git
2. Installa le dipendenze (se presenti):
   - npm install

Variabili d'ambiente

- Le variabili principali utilizzate dall'app:
  - APP_SCRIPT_ID (ID del Google Apps Script che espone l'API)
  - SHEET_ID (ID del Google Sheet contenente i dati)
  - NODE_ENV (opzionale)
  - PORT (opzionale, se si usa server di sviluppo)
- Esempio `.env.example` riportato più sotto.

Avvio in locale

- Avviare il server di sviluppo (se presente nel package.json):
  - npm run dev
- Se l'app è una semplice raccolta di file HTML/JS, aprire `index.html` in un server statico (es. `live-server`, `http-server`) per evitare problemi CORS.

Architettura

Struttura delle directory principali (principale osservata nel repository)

- scripts/ — script JavaScript (es. integrazione dati)
  - scripts/zhd-data.js
  - scripts/vote-close/timeout-data.js
- index.html — pagina principale
- timeout.html — pagina di chiusura/votazione (es.)
- css/ o styles/ — fogli di stile CSS
- assets/ — immagini e risorse statiche

Pattern architetturali usati

- Front-end statico basato su file HTML/CSS/JS.
- Pattern modulare semplice lato JS (file separati per funzionalità).
- Integrazione esterna tramite chiamate a Google Apps Script → Google Sheets (sostituisce un backend tradizionale).

Integrazione con servizi esterni

- Google Sheets (come fonte dati)
- Google Apps Script (API pubblica/exec dello script)
- Hosting via FTP (FileZilla) per il deploy su server di produzione

Development

Test

- Non sono stati trovati test automatici nel repository. Se desideri, posso aiutare ad aggiungere test (es. Jest per funzioni JS).

Linting / formatting

- Non sono stati trovati file di configurazione per ESLint/Prettier. Consiglio di aggiungere:
  - npm install --save-dev eslint prettier
  - Configurare script in `package.json`: `lint`, `format`

Deployment

Dove è hostato

- Deploy via FileZilla (FTP) verso il server di produzione.

URL di produzione

- https://troni.it/zerohourday/?id=00000001

CI/CD

- Non risultano workflow GitHub Actions nel repository. Se vuoi, posso aggiungere un workflow di deploy automatico (per esempio: build → upload via FTP o deploy su hosting statico).

Opzionale ma utile

API documentation

- Al momento non è fornita documentazione Swagger/Postman. La "API" esterna è l'Apps Script che riceve richieste: documentare endpoint, parametri e formato risposta è consigliato.

Troubleshooting comuni

- Problema: pagine non caricano dati → controllare che `APP_SCRIPT_ID` e `SHEET_ID` siano corretti e che lo script abbia permessi pubblici o accesso adeguato.
- Problema: CORS o blocco richieste → verificare che lo script Google sia pubblicato come "esegui come me" / accessibile.
- Problema: deploy non aggiornato → verificare che i file aggiornati siano stati correttamente caricati via FTP.

Come contribuire (se open source)

- Fork del repository → branch di feature → PR con descrizione chiara delle modifiche.
- Aggiungere test e linting per uniformità.
- Aggiornare la documentazione (README + .env.example).

License

- Aggiungere file LICENSE nel repository (es. MIT) se vuoi rendere il progetto open source.

Aggiornare APP_SCRIPT_ID e SHEET_ID

- I valori di `APP_SCRIPT_ID` e `SHEET_ID` sono hard-coded in alcuni file JS. Aggiornare gli ID in questi file:
  - scripts/zhd-data.js
    - Link: https://github.com/emma-troni/synchro-webapp/blob/main/scripts/zhd-data.js
  - scripts/vote-close/timeout-data.js
    - Link: https://github.com/emma-troni/synchro-webapp/blob/main/scripts/vote-close/timeout-data.js

Esempio di sostituzione:

- Sostituire:
  - SHEET_ID: "19eSx-gfbzfAWqs1OYJLPqaqqev62wfokldr9JP6Uezk"
  - APP_SCRIPT_ID: "AKfycbzr8LnsA3ggkqV00PtW7tatUtqykH9pKZ4LpLx9GsqDMnN7XBd0lTRjxyx0rWklrDTj"
- Con i vostri ID (o gestirli tramite un file `.env` e un semplice script di build che li inietta).

Note sulla ricerca codice

- Ho cercato nel repository per trovare le occorrenze di `APP_SCRIPT_ID` e `SHEET_ID` e ho trovato almeno i file elencati sopra. I risultati della ricerca possono essere incompleti; per vedere più risultati usa la ricerca codice di GitHub: https://github.com/emma-troni/synchro-webapp/search?q=APP_SCRIPT_ID+OR+SHEET_ID&type=code
