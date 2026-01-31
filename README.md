# Zero Hour Day - Webapp

Una webapp front-end per la raccolta e visualizzazione di timeline e attività nell'ambito del progetto Zero Hour Day, con integrazione Google Sheets e Apps Script per la gestione dei dati.

**URL di produzione:** [zerohourday.org](https://zerohourday.org/?id=00000001)  
**URL alternativo:** [troni.it/zerohourday](https://troni.it/zerohourday/?id=00000001)

---

## Tecnologie

| Area      | Stack                                  |
| --------- | -------------------------------------- |
| Frontend  | HTML, CSS, JavaScript (vanilla/moduli) |
| Backend   | Google Sheets + Google Apps Script     |
| Proxy/CDN | Cloudflare Workers                     |
| Hosting   | Server FTP                             |
| Deploy    | FileZilla (FTP)                        |

---

## Architettura

L'applicazione utilizza un'architettura distribuita con proxy Cloudflare:

```
┌──────────────┐     HTTPS      ┌──────────────────┐     Proxy      ┌─────────────────┐
│   Browser    │ ─────────────▶ │ Cloudflare       │ ────────────▶  │ troni.it        │
│ (User)       │                │ Workers          │                │ /zerohourday/   │
└──────────────┘                │ (zerohourday.org)│                └─────────────────┘
                                 └──────────────────┘                         │
                                                                               │
                                                                               ▼
                                                                    ┌─────────────────┐
                                                                    │ Google Apps     │
                                                                    │ Script API      │
                                                                    └─────────────────┘
                                                                               │
                                                                               ▼
                                                                    ┌─────────────────┐
                                                                    │ Google Sheets   │
                                                                    │ (Database)      │
                                                                    └─────────────────┘
```

### Flusso dei dati:

1. **Frontend** — File HTML/CSS/JS serviti tramite Cloudflare Workers
2. **Proxy Layer** — Cloudflare Workers intercetta le richieste a `zerohourday.org` e le proxа a `troni.it/zerohourday`
3. **API Layer** — Google Apps Script espone endpoint REST-like
4. **Database** — Google Sheets come fonte dati strutturata

---

## Quickstart

### Prerequisiti

- Node.js 18.x LTS o superiore
- npm (incluso con Node.js)
- Accesso al Google Sheet e allo Script di progetto
- Credenziali FTP per il deploy
- Account Cloudflare (per gestione dominio e Workers)

### Installazione

```bash
git clone https://github.com/emma-troni/synchro-webapp.git
cd synchro-webapp
npm install
```

### Configurazione

Crea un file `.env` nella root del progetto:

```env
# ID del Google Apps Script che espone l'API
APP_SCRIPT_ID=your_app_script_id_here

# ID del Google Sheet contenente i dati
SHEET_ID=your_sheet_id_here

# Opzionali
NODE_ENV=development
PORT=3000
```

> **Nota:** Attualmente gli ID sono hardcoded in alcuni file. Vedi la sezione [Configurazione ID](#configurazione-id) per i dettagli.

### Avvio in locale

```bash
npm run dev
```

In alternativa, per progetti statici senza server di sviluppo:

```bash
npx live-server
```

---

## Struttura del progetto

```
synchro-webapp/
├── index.html              # Pagina principale
├── timeout.html            # Pagina di chiusura/votazione
├── scripts/
│   ├── zhd-data.js         # Integrazione dati principale
│   ├── timeout-data.js     # Gestione timeout votazioni
│   └── [altri script...]
├── style/                  # Fogli di stile CSS
├── public/                 # Icone, SVG e risorse statiche
└── README.md
```

---

## Configurazione ID

Gli ID di Google Apps Script e Google Sheet sono attualmente hardcoded nei seguenti file:

| File                       | Variabili                   |
| -------------------------- | --------------------------- |
| `scripts/zhd-data.js`      | `SHEET_ID`, `APP_SCRIPT_ID` |
| `scripts/timeout-data.js`  | `SHEET_ID`, `APP_SCRIPT_ID` |
| `scripts/timeout-no-id.js` | `SHEET_ID`                  |

### Valori correnti:

```javascript
const ZHD_CONFIG = {
  SHEET_ID: "19eSx-gfbzfAWqs1OYJLPqaqqev62wfokldr9JP6Uezk",
  APP_SCRIPT_ID:
    "AKfycbxGIbrSOwjRy1m6yFiXLyYIinESWHXrvR_F0QJGffDaQXBW3JtV56vI_MI3MBfJ-78",
};
```

Per aggiornare, sostituisci i valori esistenti con i tuoi ID personali.

---

## Cloudflare Workers Setup

### Configurazione del proxy

Il dominio `zerohourday.org` utilizza Cloudflare Workers per proxare le richieste a `troni.it/zerohourday`.

#### Worker Code (`zerohourday-proxy`):

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Costruisci l'URL di destinazione verso troni.it
    const targetUrl = `https://troni.it/zerohourday${url.pathname}${url.search}${url.hash}`;

    // Fai la richiesta a troni.it
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    // Crea una nuova response
    const newResponse = new Response(response.body, response);

    // Modifica header se necessario
    newResponse.headers.delete("content-security-policy");
    newResponse.headers.set("Access-Control-Allow-Origin", "*");

    return newResponse;
  },
};
```

#### Routes configurate:

- `zerohourday.org/*` → `zerohourday-proxy`
- `www.zerohourday.org/*` → `zerohourday-proxy`

#### DNS Records:

| Type  | Name | Content         | Proxy Status |
| ----- | ---- | --------------- | ------------ |
| A     | @    | 192.0.2.1       | Proxied 🟠   |
| CNAME | www  | zerohourday.org | Proxied 🟠   |

---

## URL Structure

### Pagina principale con ID utente:

```
https://zerohourday.org/?id=12345678
```

Dove `12345678` è l'ID univoco a 8 cifre generato dal dispositivo Chronodex.

### Pagina timeout (risultati finali):

```
https://zerohourday.org/timeout.html?id=12345678
```

### Estrazione ID dall'URL:

Il JavaScript utilizza la funzione `getUserIdFromUrl()` presente sia in `zhd-data.js` che in `timeout-data.js`:

```javascript
function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}
```

---

## Deploy

### 1. Deploy su troni.it (FTP)

Il deploy avviene via FTP utilizzando FileZilla:

1. Connettiti al server con le credenziali FTP
2. Naviga alla directory `/zerohourday/`
3. Carica i file aggiornati (HTML, CSS, JS, assets)
4. Verifica che le modifiche siano visibili su `troni.it/zerohourday`

### 2. Verifica Cloudflare Workers

Dopo il deploy FTP, verifica che il Worker funzioni correttamente:

1. Vai su Cloudflare Dashboard → Workers & Pages
2. Seleziona `zerohourday-proxy`
3. Testa con il preview o visita direttamente `zerohourday.org`

### 3. Test finale

- ✅ `zerohourday.org` → Deve mostrare il sito senza redirect
- ✅ `zerohourday.org/?id=00000001` → Deve caricare i dati dell'utente
- ✅ `www.zerohourday.org` → Deve funzionare come il dominio principale
- ✅ L'URL deve rimanere `zerohourday.org` (non `troni.it`)

---

## Troubleshooting

| Problema                     | Soluzione                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| I dati non si caricano       | Verifica che `APP_SCRIPT_ID` e `SHEET_ID` siano corretti e che lo script abbia i permessi adeguati  |
| Errori CORS                  | Assicurati che lo script Google sia pubblicato come "Esegui come me" con accesso "Chiunque"         |
| Deploy non aggiornato        | Controlla che tutti i file siano stati caricati correttamente via FTP e svuota la cache del browser |
| URL mostra ancora `troni.it` | Verifica che il Cloudflare Worker sia attivo e che le route siano configurate correttamente         |
| Worker restituisce errori    | Controlla i logs in Cloudflare Dashboard → Workers & Pages → zerohourday-proxy → Logs               |
| Dominio non raggiungibile    | Verifica che i DNS records siano configurati con Proxy Status = Proxied (arancione)                 |

---

## Gestione Cloudflare

### Accesso al Worker:

1. Login su [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vai su **Workers & Pages**
3. Seleziona `zerohourday-proxy`
4. Puoi modificare il codice cliccando su **Edit Code**

### Monitoraggio:

- **Metrics**: Visualizza richieste, errori, durata
- **Logs**: Console logs e errori in tempo reale
- **Settings**: Configurazione dominio, variabili d'ambiente

### Modifica DNS:

1. Seleziona il dominio `zerohourday.org`
2. Vai su **DNS** → **Records**
3. Modifica i record esistenti se necessario

---

## Integrazione con Chronodex

Il dispositivo Chronodex genera un QR code che contiene l'URL personalizzato:

```
https://zerohourday.org/?id=[ID_UNIVOCO_8_CIFRE]
```

L'utente scansiona il QR code e accede direttamente alla propria pagina personale con i dati sincronizzati.

---

## Roadmap

- [x] Setup dominio `zerohourday.org` con Cloudflare
- [x] Configurazione Cloudflare Workers per proxy trasparente
- [ ] Aggiungere gestione variabili d'ambiente con script di build
- [ ] Configurare ESLint e Prettier per code quality
- [ ] Implementare test automatici (Jest)
- [ ] Setup CI/CD con GitHub Actions per auto-deploy
- [ ] Documentare API Google Apps Script (Swagger/Postman)
- [ ] Ottimizzazione performance e caching
- [ ] Analytics e monitoring (Cloudflare Web Analytics)

---

## Contributing

1. Fai un fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/nome-feature`)
3. Committa le modifiche (`git commit -m 'Aggiunge nuova feature'`)
4. Pusha il branch (`git push origin feature/nome-feature`)
5. Apri una Pull Request

---

## License

Questo progetto è parte del progetto accademico **Zero Hour Day**.  
Tutti i diritti riservati.

---

## Contatti

Per domande o supporto:

- **Repository**: [github.com/emma-troni/synchro-webapp](https://github.com/emma-troni/synchro-webapp)
- **Sito**: [zerohourday.org](https://zerohourday.org)
