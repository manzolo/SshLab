# AGENTS.md

Istruzioni per un agente che lavora in questo repository.

## Leggi questi due file prima di scrivere una riga

1. **[`STATO.md`](STATO.md)** — cos'è fatto, cosa manca, l'architettura e **i dodici guasti
   già pagati**. Diversi pezzi di codice sembrano sovra-ingegnerizzati e non lo sono: sono
   la cicatrice di un bug reale. Disfarli li fa tornare.
2. **[`BACKLOG.md`](BACKLOG.md)** — il lavoro che resta: i capitoli 5…12, con per ciascuno
   **l'invariante misurabile** di ogni esercizio, e i quattro lavori di infrastruttura che
   vengono prima.

`CLAUDE.md` è la stessa cosa in forma breve.

## Cos'è, in due righe

**EDU-SSH · SSH Lab** — si impara SSH con **due macchine Linux vere affiancate** nel
browser: kernel reale via v86 (WASM), OpenSSH vero dei due lati, xterm.js. Sito statico
bilingue IT/EN, zero dipendenze a runtime, zero build del sito.

Stato: **motore e infrastruttura finiti e misurati, 4 capitoli su 12 scritti.**

## Prima di cominciare

```bash
npm run image     # ~4 min. images/ NON è nel repo. Serve Docker + zstd + python zstandard
npm run serve     # http://localhost:8802 — i moduli ES non si caricano da file://
npm test          # attesi 2 file / 16 controlli
npm run e2e       # Chrome headless, atteso tutto verde
npm run test:labs # infrastruttura vera + ogni esercizio su tre semi
npm run test:regressione # consegna, CWD, identita' e tastiera dal terminale
```

## Regole non negoziabili

- **Tutto in italiano** nei commenti, nei messaggi di commit e nei testi rivolti
  all'utente. I contenuti dei capitoli esistono **in `it` e in `en`**, sempre entrambi: i
  test camminano l'intero oggetto capitolo e una coppia con un lato vuoto fa fallire.
- **Asserire l'invariante, mai la forma del comando.** Un `check.sh` che fa `grep` sul
  comando digitato dall'utente è quasi certamente sbagliato. Si misura cosa è **successo
  alle macchine**, non cosa è stato battuto.
- **`BatchMode=yes` è il perno del corso**: è l'unico modo di asserire un'*assenza* (se
  servisse una password, `ssh` fallisce invece di chiederla).
- **Le chiavi si confrontano per impronta**, mai per nome di file.
- **Il testimone è il registro del server**, non la history del pc.
- **Tutto ciò che varia passa da `edu_rand_*`**, derivato da `$EDU_SEED`: se il numero non
  lo puoi sapere, non lo puoi cablare. È tutto l'anti-trucco.
- **Ogni esercizio ha quattro script** — `seed.sh`, `check.sh`, `solution.sh`, `cheat.sh` —
  e **il `cheat.sh` deve fallire**. Se passa, è il check a essere scritto male.
- **Onestà sui limiti**: si dichiarano nel testo, non si nascondono. Le due macchine non
  sono due computer, e il capitolo 1 lo dice.
- **Le opzioni della VM sono duplicate in nove file** e v86 ripristina uno stato solo
  con le stesse opzioni del costruttore: si cambiano tutte insieme. Le confronta
  `tests/opzioni.test.js`.
- **Zero dipendenze nuove.** Niente npm a runtime, niente CDN, niente build step.

## Definizione di fatto, per ogni capitolo

1. `npm test` verde (struttura, bilinguismo, id dei check corrispondenti).
2. `npm run test:labs` verde: per ogni esercizio, lo stato iniziale non passa già · la
   soluzione passa **su tre semi** · il `cheat.sh` fallisce.
3. Il capitolo è stato fatto **a mano, dall'inizio, senza guardare la soluzione**. È così
   che sono venuti fuori tutti i difetti veri di questo lab: gli altri test non leggono,
   non scorrono e sanno già la risposta.
4. La voce è passata da `IN_ARRIVO` a `CAPITOLI` in `content/index.js`.
5. Un commit per capitolo, il cui messaggio dice **cosa si impara**, non quali file sono
   cambiati.
