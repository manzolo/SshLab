# CLAUDE.md

Guida per Claude Code (claude.ai/code) quando lavora in questo repository.

## Cos'è

**EDU-LINUX · Linux Lab** — 22 capitoli per imparare Linux, con un **kernel Linux vero** che
gira nel browser via [v86](https://github.com/copy/v86). Fa parte della collana EDU-\* di
manzolo. Sito statico bilingue IT/EN, **zero dipendenze runtime, zero build del sito**.

Non è un simulatore: è Linux. Questa distinzione governa quasi ogni decisione qui dentro.

## Farlo girare

```bash
npm run serve          # http://localhost:8801 (i capitoli si leggono anche senza immagine)
npm run image          # ~4 min: costruisce rootfs + snapshot in images/ (serve Docker + zstd + python zstandard)
```

Serve un server statico: i moduli ES non si caricano da `file://`. Non c'è nessun passo di
build per il sito; le modifiche sono vive al refresh. `images/` è in `.gitignore`: la
costruisce la CI.

## Architettura

### Le due decisioni che reggono tutto

1. **Uno snapshot solo per tutti i 22 capitoli** (`images/state.bin.zst`, ~11 MB). A freddo il
   boot da 9p dura ~46 s; dallo snapshot il prompt c'è in 0,6 s. Uno solo significa una URL
   in cache per 21 capitoli, e la macchina che resta *la stessa* fra un capitolo e l'altro.
2. **I contenuti NON stanno nell'immagine.** Vivono in `content/chNN/` ed entrano a runtime
   via `create_file`. Cambiare un esercizio è un commit di testo, non una ricostruzione da
   due minuti. (È anche obbligato: l'albero 9p è congelato dentro lo snapshot.)

### I file che contano

- `js/lab/machine.js` — la VM, **una sola per sessione**. Le opzioni del costruttore devono
  coincidere ESATTAMENTE con `lab/build-state.mjs`: v86 ripristina uno stato solo con le
  stesse opzioni. Se `uart1` manca da una delle due parti, il canale di verifica sparisce.
- `js/lab/agent.js` — il canale di verifica su **ttyS1**, non sul terminale visibile.
- `js/lab/runner.js` — inietta gli `.sh` dell'esercizio e raccoglie il verdetto.
- `js/ui/exercises.js` — il verdetto: fatto → perché → **comando di diagnosi**.
- `lab/overlay/opt/lab/lib/labcheck.sh` — generatori deterministici e helper del verdetto.
- `lab/overlay/opt/lab/bin/labagentd` — l'agente seriale nel guest (~90 righe di `ash`).

## Convenzioni non negoziabili

**Ogni stringa esiste in `it` e `en`.** I test lo verificano camminando l'intero oggetto
capitolo: una coppia `{it, en}` con un lato vuoto fa fallire `npm test`.

**Gli `.sh` sono neutri rispetto alla lingua.** Emettono codici (`EDU CHECK id PASS/FAIL`);
i messaggi bilingui (`why`, `nudge`, `hints`) stanno nel `chapter.js`. Stessa regola dei
fratelli della collana: gli eventi del motore sono codici, la UI li traduce a render.

**Gli id dei check nel `chapter.js` devono combaciare con quelli emessi da `check.sh`.**
Il test lo verifica in entrambe le direzioni: un check dichiarato e non emesso, o emesso e
non spiegato, fa fallire la build.

**Asserire l'invariante, mai la forma del comando.** `chmod 644` e `chmod u=rw,go=r` sono lo
stesso fatto: il check guarda i bit. Il cron delle 3:30 si verifica sui campi minuto/ora, non
sulla stringa. La regola pratica: *se un `check.sh` contiene un `grep` sul comando
dell'utente, quasi certamente è scritto male.*

**Tutto ciò che varia passa da `edu_rand_*`.** È lì che vive l'anti-trucco: se il numero non
lo puoi sapere, non lo puoi cablare. E dove possibile l'atteso si **misura** invece di
assumerlo (vedi `content/ch13/e1/seed.sh`, che calcola il vincitore con lo stesso `du` che
userà chi studia).

**localStorage sempre namespacizzato `linuxlab.` e sempre in try/catch** (`js/storage.js`),
con fallback in memoria: in navigazione privata `localStorage` lancia.

**README.md (IT) e README.en.md sono documenti paralleli**: le modifiche visibili all'utente
vanno in entrambi.

## Aggiungere un capitolo

```bash
npm run new-chapter -- 23 nome [--esercizi 3] [--local]
```

Poi: riga in `content/index.js`, riempi i TODO, togli `draft: true`, e `npm test`.
I capitoli `draft: true` sono nascosti dal sommario e saltati dai test: **si può committare
un capitolo a metà senza rompere niente.**

## Test

| comando | cosa fa | quanto dura |
|---|---|---|
| `npm test` | struttura, bilinguismo, id dei check, prerequisiti | secondi |
| `npm run test:labs` | avvia la VERA macchina, esegue ogni esercizio del browser | ~6 min |
| `npm run test:labs-local` | i capitoli 17-22 nel container Debian+systemd | ~2 min |
| `npm run e2e` | smoke test su Chrome headless (serve `npm run serve` attivo) | ~1 min |

`test:labs` esegue le cinque asserzioni della collana su ogni esercizio: lo stato iniziale
non passa già · la soluzione passa su **tre semi diversi** · il `cheat.sh` **fallisce**.

## Trappole già scoperte (non ripercorrerle)

- **`--cgroupns=private` sì, bind mount di `/sys/fs/cgroup` NO.** Con cgroup v2 Docker prepara
  già un `/sys/fs/cgroup` scrivibile; montarci sopra quello dell'host lo rende read-only e
  systemd esce con 255 **senza stampare una parola**.
- **Dopo `restore_state` la macchina non emette nulla** finché non la solleciti: il prompt era
  già stato stampato prima dello snapshot. `machine.js` manda un `\n` su ttyS0 apposta.
- **`labagentd` non eredita `HOME`.** È impostato esplicitamente a `/root`: senza, uno script
  che scrive in `~/lab` finisce in `/lab` e fallisce solo durante la verifica.
- **L'agente azzera `$LAB` e `$STATE` PRIMA del seed.** Un seed non può quindi leggere valori
  salvati dal seed precedente (ci sono cascato con `ch11`: la pulizia va fatta per pattern).
- **`grep -c` stampa già `0` ed esce con 1**: un `|| echo 0` raddoppia lo zero.
- **Niente `srand()`/`rand()` di awk per i generatori.** Con semi vicini i primi valori sono
  correlati e due salt consecutivi producono lo stesso nome di file. `labcheck.sh` ha un LCG
  scritto a mano con venti giri a vuoto.
- **systemd 257 risolve anche un `ExecStart` non assoluto.** Non è più l'errore che era: il
  guasto didattico di `ch17.e2` è il permesso di esecuzione mancante (`203/EXEC`).
- **Senza udev, LVM non crea i nodi dei volumi.** Servono `lvcreate -Zn`, `vgscan --mknodes` e
  l'helper `lab-loop`, che fa `mknod` dei loop device.
- **I loop device e i volumi LVM sono globali dell'host**, anche da dentro un container: nel
  guest si vedono pure gli snap di sistema. Da qui il prefisso `lab-*` e `run.sh cleanup`.
- **Niente warm-up nello snapshot.** Misurato: non riduce le letture 9p e senza `drop_caches`
  gonfia lo stato del 40%.

## Sicurezza e onestà

Il laboratorio locale dei capitoli 21-22 gira `--privileged`. È dichiarato nel README, nel
capitolo e in un riquadro a video prima dell'avvio. **Non toglierlo per fare pulizia:** chi
studia deve sapere che quei volumi finiscono nel suo `lsblk`.

Allo stesso modo, i limiti del browser (niente systemd, niente rete vera, niente più
dispositivi a blocchi) sono **contenuto**, non scuse: spiegano cosa serve davvero a systemd
per esistere. Se un giorno diventano superabili, si aggiornano; finché non lo sono, si
dicono.
