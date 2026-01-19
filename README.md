# Synchro Webapp

Una webapp front-end per la raccolta e visualizzazione di timeline e attività, con integrazione Google Sheets e Apps Script per la gestione dei dati.

**URL di produzione:** [troni.it/zerohourday](https://troni.it/zerohourday/?id=00000001)

---

## Tecnologie

| Area | Stack |
|------|-------|
| Frontend | HTML, CSS, JavaScript (vanilla/moduli) |
| Backend | Google Sheets + Google Apps Script |
| Deploy | FTP via FileZilla |

---

## Quickstart

### Prerequisiti

- Node.js 18.x LTS o superiore
- npm (incluso con Node.js)
- Accesso al Google Sheet e allo Script di progetto
- Credenziali FTP per il deploy

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

### Avvio

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
│   └── vote-close/
│       └── timeout-data.js # Gestione timeout votazioni
├── css/                    # Fogli di stile
└── assets/                 # Immagini e risorse statiche
```

---

## Architettura

L'applicazione segue un pattern front-end statico con backend serverless:

1. **Frontend** — File HTML/CSS/JS serviti staticamente
2. **API Layer** — Google Apps Script espone endpoint REST-like
3. **Database** — Google Sheets come fonte dati strutturata

```
┌──────────┐     HTTP      ┌─────────────────┐     API      ┌──────────────┐
│ Frontend │ ───────────▶  │ Apps Script     │ ──────────▶  │ Google Sheet │
│ (HTML/JS)│               │ (Web App)       │              │ (Database)   │
└──────────┘               └─────────────────┘              └──────────────┘
```

---

## Configurazione ID

Gli ID di Google Apps Script e Google Sheet sono attualmente hardcoded nei seguenti file:

| File | Variabili |
|------|-----------|
| [`scripts/zhd-data.js`](https://github.com/emma-troni/synchro-webapp/blob/main/scripts/zhd-data.js) | `SHEET_ID`, `APP_SCRIPT_ID` |
| [`scripts/vote-close/timeout-data.js`](https://github.com/emma-troni/synchro-webapp/blob/main/scripts/vote-close/timeout-data.js) | `SHEET_ID`, `APP_SCRIPT_ID` |

Per aggiornare, sostituisci i valori esistenti con i tuoi ID personali.

> **Ricerca nel codice:** [Trova tutte le occorrenze](https://github.com/emma-troni/synchro-webapp/search?q=APP_SCRIPT_ID+OR+SHEET_ID&type=code)

---

## Deploy

Il deploy avviene via FTP utilizzando FileZilla:

1. Connettiti al server con le credenziali FTP
2. Carica i file aggiornati nella directory di produzione
3. Verifica che le modifiche siano visibili sul sito

---

## Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| I dati non si caricano | Verifica che `APP_SCRIPT_ID` e `SHEET_ID` siano corretti e che lo script abbia i permessi adeguati |
| Errori CORS | Assicurati che lo script Google sia pubblicato come "Esegui come me" con accesso "Chiunque" |
| Deploy non aggiornato | Controlla che tutti i file siano stati caricati correttamente via FTP e svuota la cache del browser |

---

## Roadmap

- [ ] Aggiungere gestione variabili d'ambiente con script di build
- [ ] Configurare ESLint e Prettier per code quality
- [ ] Implementare test automatici (Jest)
- [ ] Setup CI/CD con GitHub Actions
- [ ] Documentare API (Swagger/Postman)

---

## Contributing

1. Fai un fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/nome-feature`)
3. Committa le modifiche (`git commit -m 'Aggiunge nuova feature'`)
4. Pusha il branch (`git push origin feature/nome-feature`)
5. Apri una Pull Request

---

## License

Questo progetto è distribuito sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.
