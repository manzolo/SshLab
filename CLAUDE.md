# CLAUDE.md

Guida per un agente che lavora in questo repository.

> **Se è la tua prima volta qui, leggi prima [`STATO.md`](STATO.md)**: cos'è fatto, cosa
> manca, e i dieci guasti già pagati che dal codice sembrano scelte arbitrarie. Il lavoro
> che resta è in [`BACKLOG.md`](BACKLOG.md).

## Cos'è

**EDU-SSH · SSH Lab** — imparare SSH con **due macchine vere affiancate**, dentro il browser.
Kernel Linux reale via [v86](https://github.com/copy/v86), OpenSSH vero, terminali xterm.js.
Fa parte della collana EDU-\* di manzolo. Sito statico bilingue IT/EN, **zero dipendenze
runtime, zero build del sito**.

Nasce da LinuxLab (stesso motore, copiato al commit `a8dee38` e poi divergente) e ne eredita
le convenzioni. Quello che cambia sta in una frase: **le macchine sono due.**

## Farlo girare

```bash
npm run image     # ~4 min: rootfs + snapshot (serve Docker + zstd + python zstandard)
npm run serve     # http://localhost:8802
```

Serve un server statico: i moduli ES non si caricano da `file://`. `images/` è in `.gitignore`.

## Architettura

### Le tre decisioni che reggono tutto

1. **Due host, una VM.** Non due macchine virtuali: un kernel solo con due *network
   namespace* collegati da una coppia `veth`. Costa una CPU emulata invece di due, uno
   snapshot invece di due, e la verifica può guardare dentro l'altro host senza un secondo
   canale — che sarebbe poi quello che l'esercizio potrebbe rompere.
2. **Tre seriali.** ttyS0 è il terminale del pc, **ttyS2 quello del server**, ttyS1 il canale
   di verifica. In v86 ttyS0 e ttyS2 condividono l'IRQ 4 e ttyS1 sta sull'altra linea: il
   canale fragile (richiesta/risposta con timeout) è isolato apposta, mentre su un terminale
   una battuta persa la ripara la battuta dopo.
3. **Il mondo nasce dentro lo snapshot.** `lab-hosts-up` gira da `::sysinit:` e costruisce
   host, cavo, utenti e sshd *prima* che lo stato venga salvato; `lab-scalda-ssh` fa passare
   una connessione a vuoto. Chi apre il lab trova tutto in piedi in mezzo secondo.

### I file che contano

- `js/lab/machine.js` — la VM. Le opzioni devono coincidere **esattamente** con
  `lab/build-state.mjs` e con i test: v86 ripristina uno stato solo con le stesse opzioni.
  Le confronta `tests/opzioni.test.js` su tutti e nove i file che le dichiarano.
- `js/lab/terminal.js` — i due xterm, uno per seriale. I byte della tastiera passano da una
  **coda** (8 byte ogni 4 ms): la UART ha 16 byte di FIFO e nessun controllo di flusso.
- `js/lab/agent.js` — il canale di verifica su ttyS1, protocollo a righe JSON.
- `lab/overlay/opt/lab/bin/lab-hosts-up` — costruisce i due host e crea
  **`/run/lab/entra-server`**, l'unico modo di entrare nel server.
- `lab/overlay/opt/lab/bin/lab-sshd-riavvia` — riavvia sshd dentro entrambi i namespace.
- `lab/overlay/opt/lab/lib/labcheck.sh` — helper di verifica, fra cui `lab_srv`,
  `lab_login_riuscito` e `lab_sshd_dice`.
- `content/chNN/chapter.js` + `content/chNN/eN/{seed,check,solution,cheat}.sh`.

## Convenzioni non negoziabili

**Ogni stringa esiste in `it` e `en`.** I test camminano l'intero oggetto capitolo.

**Asserire l'invariante, mai la forma del comando.** Se un `check.sh` contiene un `grep` sul
comando dell'utente, quasi certamente è scritto male. Qui la forma più forte è
`lab_login_riuscito`: apre una connessione vera con `BatchMode=yes` — che fallisce invece di
chiedere la password, e quindi trasforma un'assenza in una proprietà misurabile.

**Le chiavi si confrontano per IMPRONTA, mai per nome di file.** `id_ed25519` e `lavoro` sono
la stessa chiave se l'impronta combacia.

**Tutto ciò che varia passa da `edu_rand_*`.** Indirizzi, nomi utente, quale chiave è già
autorizzata: se il numero non lo puoi sapere, non lo puoi cablare.

**Si entra nel server in UN modo solo**, `/run/lab/entra-server`, che porta dentro sia la rete
sia il nome. Averne due (uno con la sola rete) è già costato un bug: sshd apriva sessioni con
l'indirizzo del server e l'hostname del pc, e il prompt diceva `deploy@pc`.

**localStorage namespacizzato `sshlab.`** — su manzolo.github.io i lab della collana
condividono l'origine, quindi il prefisso è l'unica cosa che tiene separati i progressi.

## Aggiungere un capitolo

**Il lavoro che resta sta in [`BACKLOG.md`](BACKLOG.md)**: i capitoli 2…12 con, per ciascuno,
l'invariante misurabile di ogni esercizio — che è la sola parte difficile. I testi si
riscrivono; un check sbagliato insegna una cosa falsa. I quattro lavori di infrastruttura
che precedevano i capitoli sono completati e provati nella VM vera.

```bash
npm run new-chapter -- 2 chiavi
```

Poi: riga in `content/index.js` (e via la voce corrispondente da `IN_ARRIVO`), riempi i TODO,
`npm test`. Ogni esercizio vuole i quattro script, e il `cheat.sh` **deve fallire**.

`IN_ARRIVO` non è decorativo: il totale del piede («Capitolo 1 di 12»), la barra dei progressi
e la seconda metà del sommario lo leggono. Spostare una voce da `IN_ARRIVO` a `CAPITOLI` è
l'unica cosa che serve perché la navigazione dica il vero.

## Test

| comando | cosa fa | quanto dura |
|---|---|---|
| `npm test` | struttura, bilinguismo, opzioni della macchina coerenti | secondi |
| `npm run test:labs` | prova I1-I4 nella VERA macchina, poi ogni esercizio su tre semi | minuti |
| `npm run test:consegna` | il giro della consegna **digitando nel terminale** | ~1 min |
| `npm run test:cwd` | cambiando esercizio la shell non resta in una cartella cancellata | ~1 min |
| `npm run test:identita` | dopo un `ssh` il prompt dice `deploy@server` | ~2 min |
| `npm run test:tastiera` | quello che scrivi è quello che arriva | ~2 min |
| `npm run test:regressione` | esegue insieme le quattro regressioni precedenti | ~3 min |
| `npm run e2e` | smoke test su Chrome headless | ~1 min |
| `npm run spike` | la prova dell'architettura, con i tempi | ~1 min |

I quattro test di regressione esistono per una ragione sola: **fanno il giro come lo fa una
persona**, digitando nel terminale, invece di passare dal canale di servizio. Tutti i difetti
trovati usando il lab erano invisibili agli altri test, perché gli altri test non leggono, non
scorrono e sanno già la risposta.

## Trappole già scoperte (non ripercorrerle)

- **`adduser -D` lascia l'account BLOCCATO**, e per OpenSSH un account bloccato è un utente
  che non esiste — anche entrando con la chiave, dove la password non c'entra. Lato client si
  legge solo `Permission denied (publickey)`. Serve `chpasswd` (che sblocca), e la build lo
  verifica.
- **`ssh` senza `-n` non torna**: si mette in ascolto sullo stdin, e se lo stdin non si chiude
  mai (il canale di verifica) il comando remoto finisce ma ssh resta lì ad aspettare.
- **L'escaping JSON dell'agente deve togliere anche il `\r`** (`\013-\037`, non
  `\013\014\016-\037`): `ssh` stampa "Warning: Permanently added …\r\n" al primo incontro con
  un host, e un `\r` grezzo rende illegale la stringa JSON. Il sintomo è «la verifica non ha
  risposto» su un comando finito da un pezzo. ⚠️ **Il difetto è ereditato: c'è anche in
  LinuxLab, che è online.**
- **`ssh-keygen -A` genera anche una RSA**, che su CPU emulata costa minuti. Solo ed25519.
- **Il primo `ssh` a freddo costa oltre tre minuti** (sono i binari letti dal 9p, non la
  crittografia): per questo `lab-scalda-ssh` gira prima dello snapshot. È l'eccezione
  dichiarata alla regola "niente warm-up" del lab fratello — le regole ereditate si
  rimisurano, non si applicano a scatola chiusa.
- **Il servizio hostname di Alpine legge `/etc/conf.d/hostname`**, non `/etc/hostname`.
- **`/etc/hosts` non si riscrive durante `docker build`**: lo gestisce il motore.
- **Un ResizeObserver sugli schermi si autoalimenta**: ridimensionare xterm cambia lo schermo,
  che rimette in moto l'osservatore, e ogni giro spara uno `stty` sul canale di verifica. Si
  osservano i riquadri esterni.
- **In una griglia CSS la traccia implicita è `auto`** e cresce fino al contenuto più largo:
  xterm chiedeva le sue 80 colonne e la pagina finiva larga il doppio della finestra.
- **Tre aree che scorrono per conto loro spezzano la lettura.** Vale qui come valeva nel lab
  fratello: scorre la pagina, e basta.

## Onestà

Le due macchine **non sono due computer**, e il capitolo 1 lo dice apertamente: stesso kernel,
stesso disco, due pile di rete e due utenti. È quello che è un container, ed è contenuto —
non una scusa. Allo stesso modo si dichiara che `lab answer` esiste solo qui dentro, e che una
RSA-4096 non si genera perché costerebbe minuti.
