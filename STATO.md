# STATO DEL LAVORO — leggi questo prima di toccare qualsiasi cosa

Aggiornato al **2026-08-16**, dopo il completamento dei dodici capitoli.

Questo file esiste per una ragione sola: **evitarti di riscoprire l'acqua calda.**
Il motore di questo lab è finito e misurato, e ci sono dentro una decina di guasti già
pagati a caro prezzo che da fuori sembrano scelte arbitrarie. Sotto trovi quali sono,
perché il codice è fatto così, e cosa manca davvero.

**Il lavoro didattico e' completo.** La coda esterna e la consegna sono in
[`BACKLOG.md`](BACKLOG.md) sotto «Fuori dai capitoli».

---

## 1. Cos'è

**EDU-SSH · SSH Lab** — si impara SSH con **due macchine Linux vere affiancate nella
stessa pagina del browser**. Non una simulazione: kernel Linux reale via
[v86](https://github.com/copy/v86) (WASM), OpenSSH vero dei due lati, xterm.js.

Sito statico, bilingue IT/EN, **zero dipendenze a runtime, zero build del sito**,
destinato a GitHub Pages. Fa parte della collana EDU-\* di manzolo e nasce da
**LinuxLab** (stesso motore, copiato al commit `a8dee38` e poi divergente).

Stato: **motore, infrastruttura e 12 capitoli su 12 completi e verificati.**

---

## 2. Verifica in cinque minuti che tutto gira (fallo per primo)

L'immagine del guest **non è nel repo** (`images/` è in `.gitignore`): va costruita.

```bash
npm run image     # ~4 min. Serve: Docker, zstd, python con il modulo zstandard
npm run serve     # http://localhost:8802  (i moduli ES non si caricano da file://)

npm test          # ~1 s   — struttura, bilinguismo, opzioni VM. Attesi: 60/60
npm run e2e       # ~1 min — Chrome headless sul sito servito. Atteso: tutto verde
npm run test:labs # ~15 min — infrastruttura vera + ogni esercizio su tre semi
npm run test:regressione # ~3 min — consegna, CWD, identita' e tastiera dal terminale
```

Il capitolo 1 va rifatto a mano quando cambia il contenuto o l'esperienza utente, non
dopo ogni modifica all'infrastruttura. Consegna, cambio esercizio, identita' dei due
terminali e coda della tastiera hanno ora regressioni che digitano come una persona;
la lettura manuale resta insostituibile prima di accettare un capitolo o una modifica UI.

Al 2026-08-16 sono verdi: `npm test` 60/60 · `e2e` ·
`test:labs` 177/177 · `test:consegna` 5/5 · `test:cwd` 5/5 ·
`test:identita` 4/4 · `test:tastiera` 3/3.

---

## 3. L'architettura, e le tre decisioni che la reggono

Sono state prese misurando, non per gusto. **Non ridiscuterle senza rimisurare.**

### 3.1 · Due host, UNA VM

Non due macchine virtuali: **un kernel solo con due _network namespace_** collegati da
una coppia `veth`.

```
┌──────────────── una sola VM v86 (128 MB) ─────────────────┐
│  netns default                     netns "server"         │
│  ┌───────────────┐  veth-pc ── veth-srv ┌──────────────┐  │
│  │ pc  10.10.0.1 │──────────────────────│ srv 10.10.0.2│  │
│  │ manzolo       │                      │ deploy, sshd │  │
│  └──────┬────────┘                      └──────┬───────┘  │
│      ttyS0                                  ttyS2         │
│         └────────── ttyS1 = verifica ──────────┘          │
└───────────────────────────────────────────────────────────┘
```

Costa **una** CPU emulata invece di due, **uno** snapshot invece di due (16,6 MB), e la
verifica può guardare dentro l'altro host **senza un secondo canale** — che sarebbe poi
proprio quello che l'esercizio potrebbe rompere.

Quello che si perde è la finzione che siano due computer. **Si dice apertamente** nel
blocco PRO del capitolo 1: stesso kernel, stesso disco, due pile di rete e due utenti.
È quello che è un container, ed è contenuto — non una scusa.

**Gli utenti sono due (`manzolo` sul pc, `deploy` sul server) e non è cosmetico:**
siccome il disco è condiviso, è l'unico modo perché `~/.ssh` sia davvero un altro file
sull'altra macchina. Senza, «copiare la chiave sul server» non vorrebbe dire niente.

### 3.2 · Tre seriali, e quale sta dove non è casuale

- `ttyS0` = terminale del **pc** (agetty autologin `manzolo`)
- `ttyS1` = **canale di verifica** (`labagentd`) — nessun getty, nessuno schermo davanti
- `ttyS2` = terminale del **server** (`lab-tty-server` → agetty autologin `deploy`
  dentro i namespace del server)

In v86 `ttyS0` e `ttyS2` condividono l'IRQ 4, `ttyS1` e `ttyS3` stanno sull'altra linea.
**Il canale fragile è isolato apposta**: è quello con richiesta/risposta e timeout,
mentre su un terminale una battuta persa la ripara la battuta dopo.

### 3.3 · Il mondo nasce DENTRO lo snapshot

`lab-hosts-up` gira da `::sysinit:` e costruisce host, cavo, utenti, `sshd` e host key
**prima** che lo stato venga salvato; `lab-scalda-ssh` fa passare una connessione a
vuoto. Chi apre il lab trova tutto in piedi in mezzo secondo.

---

## 4. Dove sta cosa

| file | cosa fa | cosa NON devi fare |
|---|---|---|
| `js/lab/machine.js` | la VM | cambiare un'opzione senza cambiarla **negli altri otto file** che la dichiarano: v86 ripristina uno stato solo con le stesse opzioni del costruttore. Le confronta `tests/opzioni.test.js` |
| `js/lab/terminal.js` | i due xterm, uno per seriale | mandare byte senza passare dalla coda (vedi §5.1) |
| `js/lab/agent.js` | canale di verifica, righe JSON su ttyS1 | —  |
| `js/lab/runner.js` | seed / check / solve di un esercizio | — |
| `js/main.js` | cablaggio, navigazione, il banco a due | — |
| `js/ui/exercises.js` | esercizi, blocco «come si fa», verdetto | — |
| `content/index.js` | `CAPITOLI` + `IN_ARRIVO` | dimenticare di spostare la voce: il piede, la barra e il sommario leggono **tutti e due** |
| `content/chNN/chapter.js` | il capitolo, a blocchi tipizzati bilingui | — |
| `content/chNN/eN/{seed,check,solution,cheat}.sh` | l'esercizio | ometterne uno |
| `lab/Dockerfile.v86` | l'immagine del guest | vedi §5.4 e §5.5 |
| `lab/overlay/opt/lab/bin/lab-hosts-up` | costruisce i due host, crea `/run/lab/entra-server` | vedi §5.3 |
| `lab/overlay/opt/lab/bin/lab-sshd-riavvia` | riavvia sshd dentro rete e UTS del server | non sostituirlo con il solo `ip netns exec` |
| `lab/overlay/opt/lab/lib/labcheck.sh` | la libreria dei check | — |
| `lab/build-state.mjs` | costruisce lo snapshot | — |

---

## 5. I tredici guasti già pagati — NON ripercorrerli

Sono tutti reali, tutti costati tempo, e **tutti hanno lasciato un commento nel codice**
nel punto in cui potresti disfarli senza accorgertene. Se una riga ti sembra
sovra-ingegnerizzata, è probabile che sia qui sotto.

### 5.1 · La FIFO della UART: quello che scrivi non è quello che arriva

La UART emulata ha **16 byte di FIFO e nessun controllo di flusso**. Quello che trabocca
si perde, e se a spezzarsi è un carattere UTF-8 (due byte) diventa **un'altra lettera**.

È successo: a schermo l'eco diceva `ssh deploy@10.10.0.2` e a `ssh` arrivava
`ßer10.10.0.2`. È il modo peggiore di sbagliare, perché chi lo vede incolpa sé stesso.

→ I byte della tastiera passano da una **coda**: 8 byte ogni 4 ms (`js/lab/terminal.js`).
→ Lo copre `npm run test:tastiera`, che parla al terminale **passando dalla stessa coda**.

### 5.2 · L'escaping JSON dell'agente deve togliere anche il `\r`

In `labagentd`, `tr -d '\000-\010\013-\037'`. L'intervallo saltava il `\015`.
Un `\r` grezzo rende **illegale** la stringa JSON: `JSON.parse` fallisce, la risposta
viene scartata, e il sintomo è **«la verifica non ha risposto» su un comando finito da
un pezzo**.

Non è un caso di scuola: `ssh` stampa `Warning: Permanently added … \r\n` al primo
incontro con un host, quindi **il primo `ssh` di ogni sessione era invisibile**.

LinuxLab lo elimina gia' con un filtro ancora piu' stretto: `_esc` conserva soltanto
TAB, newline e ASCII stampabile (`c30bc48`). Il `\r` quindi non raggiunge il JSON.

### 5.3 · L'hostname non sta nel netns: sta nell'UTS

`ip netns exec server` porta dentro la **sola** pila di rete. Un processo avviato così
ha l'indirizzo del server e **il nome del pc** — e si vedeva nel punto peggiore: entrando
con `ssh deploy@10.10.0.2` il prompt diceva **`deploy@pc`**. Cioè il lab dichiarava di
averti portato sull'altra macchina e poi ti mostrava il nome di quella di partenza, e il
prompt è l'unica cosa che, dopo un `ssh`, dice davvero dove sei.

→ Il namespace UTS è persistito con `unshare --uts=FILE`, e **si entra nel server in un
modo solo**: `/run/lab/entra-server`, che entra in `--net` **e** `--uts`. Averne due è
già costato questo bug.
→ Lo copre `npm run test:identita`.

### 5.4 · `adduser -D` lascia l'account BLOCCATO

E per OpenSSH un account bloccato è **un utente che non esiste** — anche entrando con la
chiave, dove la password non c'entra niente. Lato client si legge solo
`Permission denied (publickey)`, identico a una chiave sbagliata; la causa vera sta solo
nel registro del server.

→ Serve `chpasswd` (che scrive un hash e con questo sblocca). `passwd -u` da solo
fallisce su un account che non ha ancora una password.
→ Il `Dockerfile.v86` **verifica** che lo shadow cominci con `$` e fa fallire la build.

### 5.5 · Le altre trappole dell'immagine

- **`ssh-keygen -A` genera anche una RSA**, che su CPU emulata costa minuti. Solo ed25519.
  Le RSA che serviranno ai capitoli vanno generate a build time, su CPU vera.
- **Il primo `ssh` a freddo costava oltre tre minuti** (letture dal 9p, non crittografia):
  per questo esiste `lab-scalda-ssh`, che gira prima dello snapshot. È l'eccezione
  dichiarata alla regola «niente warm-up» ereditata dal lab fratello — le regole
  ereditate si rimisurano, non si applicano a scatola chiusa. Dopo: ~8 s.
- **Il servizio hostname di Alpine legge `/etc/conf.d/hostname`**, non `/etc/hostname`.
- **`/etc/hosts` non si riscrive durante `docker build`**: lo gestisce il motore.
- **`ssh` senza `-n` non torna**: si mette in ascolto sullo stdin, e lo stdin del canale
  di verifica non si chiude mai. Il comando remoto finisce e `ssh` resta lì.

### 5.6 · Le trappole del front-end

- **Un ResizeObserver sugli schermi si autoalimenta**: ridimensionare xterm cambia lo
  schermo, che rimette in moto l'osservatore, e **ogni giro spara uno `stty` sul canale
  di verifica**. Con due terminali il canale finiva sommerso e le richieste vere
  scadevano in coda: di nuovo «la verifica non ha risposto». → Si osservano i **riquadri
  esterni** (`.host`), mai gli schermi, e `adatta()` ha due guardie.
- **In una griglia CSS la traccia implicita è `auto`** e cresce fino al contenuto più
  largo: xterm chiedeva le sue 80 colonne e la pagina finiva larga 2841px su 1500.
- **Tre aree che scorrono per conto loro spezzano la lettura.** Scorre la pagina, e basta.
  (`html,body{height:auto}`, `#impaginato{display:block}`.)
- **v86 cattura la rotellina**: le opzioni `disable_mouse` / `disable_keyboard` /
  `disable_speaker` non sono un'ottimizzazione, senza di loro non si scorre la pagina.
- **`localStorage` deve avere il prefisso `sshlab.`**: su `manzolo.github.io` tutti i lab
  della collana stanno sulla **stessa origine**. Con il prefisso del lab fratello i due si
  scambiavano progressi, semi e lingua.
- **Il selettore della navigazione da tastiera è `.host`, non `.terminale`**: sbagliarlo
  significa che la freccia destra premuta dentro `vi` cambia capitolo.

### 5.7 · `ssh-keygen -lf privata` puo' leggere la pubblica sbagliata

Se accanto a `privata` esiste `privata.pub`, `ssh-keygen -lf privata` preferisce la
pubblica senza verificare che i due file siano una coppia. È successo nel primo banco del
capitolo 2: una privata e una pubblica diverse risultavano avere la stessa impronta, perche'
le due letture finivano entrambe sul file `.pub`.

→ `lab_fp` passa il contenuto richiesto da `/dev/stdin`, dove non esiste un sidecar da
preferire. `tests/infrastruttura.sh` lo prova affiancando apposta due chiavi discordanti.

### 5.8 · Cercare `Accepted publickey` puo' trovare il comando di ricerca

Sul terminale del server, `sudo grep 'Accepted publickey' /var/log/messages` scrive nello
stesso registro una riga `sudo` che contiene il comando appena eseguito. Con `tail -1`, il
risultato piu' recente diventa quella riga e non l'accesso SSH. Anche
`lab_sshd_dice 'Accepted publickey'` aveva lo stesso difetto.

→ Il comando didattico filtra il campo del processo con `awk`. `lab_sshd_dice` accetta
soltanto righe marcate `sshd[...]` o `sshd-session[...]`; il banco infrastrutturale aggiunge
apposta una falsa riga sudo dopo un login riuscito.

### 5.9 · La rete variabile di un esercizio non deve trapelare nel successivo

Il capitolo 1 cambia apposta gli indirizzi in `10.10.X.1/2`, ma i capitoli successivi
insegnano comandi con la rete base `10.10.0.1/2`. I loro seed preparavano chiavi e file
senza ripristinare gli indirizzi: i check passavano perche' usano `lab_srv_ip`, mentre
chi seguiva il testo otteneva `Network unreachable` dal capitolo 5 in poi.

→ `labagentd` ripristina rete, file di stato e cache ARP prima di ogni `seed` e `reset`;
il seed di ch01 puo' poi sostituirli con il proprio mondo variabile.
→ `tests/labs.mjs` semina ch01 e subito dopo ch05, e pretende il ritorno esatto alla
rete dichiarata nei comandi didattici.

---

## 6. Le regole del contenuto, che valgono più del codice

1. **Asserire l'invariante, mai la forma del comando.** Se un `check.sh` contiene un
   `grep` sul comando dell'utente, quasi certamente è scritto male.
2. **`BatchMode=yes` è il perno del corso.** È l'unico modo di asserire un'*assenza*: se
   servisse una password, `ssh` fallisce invece di chiederla. Sta dentro
   `lab_login_prova` / `lab_login_riuscito`.
3. **Le chiavi si confrontano per IMPRONTA** (`lab_fp`), mai per nome di file.
   `id_ed25519` e `lavoro` sono la stessa chiave se l'impronta combacia.
4. **Il testimone è il registro del server** (`lab_sshd_dice`), non la history del pc:
   `sshd` scrive metodo **e impronta** di quello che ha accettato davvero. È la differenza
   fra sorvegliare e misurare.
5. **Tutto ciò che varia passa da `edu_rand_*`.** Se il numero non lo puoi sapere, non lo
   puoi cablare. Il seme è ignoto a chi studia: è tutto l'anti-trucco.
6. **Ogni stringa esiste in `it` e `en`.** I test camminano l'intero oggetto capitolo e
   una coppia con un lato vuoto fa fallire.
7. **Il `cheat.sh` deve fallire.** È la scorciatoia plausibile: se passa, il check è
   scritto male, non il cheat.
8. **Onestà sui limiti.** Il capitolo 1 dice che le due macchine non sono due computer;
   si dichiara che `lab answer` esiste solo qui dentro; si dichiara che una RSA-4096 non
   si genera perché costerebbe minuti. I limiti si dicono, non si nascondono.

---

## 7. Il protocollo, in breve

**Canale di verifica** (`ttyS1`), asimmetrico apposta:
```
host  -> guest   "<id> <op> [arg ...]"      token separati da spazio
guest -> host    una riga JSON              {"id":N,"ok":bool,"code":N,"out":"…"}
```
Operazioni: `ping` · `write` · `seed` · `check` · `solve` · `reset` · `sh`.

**Verdetti** emessi da `check.sh` in formato neutro rispetto alla lingua (i messaggi
bilingui vivono nel `chapter.js`, non negli script):
```
EDU CHECK <id> PASS
EDU CHECK <id> FAIL got=… want=… at=…
EDU FACT <chiave> <valore>       ← alimenta "cosa ha visto la macchina"
EDU RESULT <passati>/<totale>    ← lab_done, in fondo a OGNI check.sh
```
Gli `id` dichiarati nei `checks` del `chapter.js` e quelli emessi da `check.sh` si
corrispondono uno a uno: lo verifica `npm test`.

**Helper già disponibili** in `labcheck.sh`: `edu_rand_int/word/pick/log` ·
`lab_check` `lab_eq` `lab_fact` `lab_done` · `lab_answer_read` `lab_answer_eq` ·
`lab_srv_ip` `lab_pc_ip` `lab_srv_user` `lab_pc_user` · **`lab_srv`** (esegue sul server)
· `lab_come` (esegue come utente; `su -c`, **non** `su -`, o `SSH_AUTH_SOCK` sparirebbe) ·
`lab_fp` `lab_fp_tutte` · `lab_login_prova` `lab_login_riuscito` · `lab_sshd_dice`
`lab_log_azzera`.

Gli otto helper aggiunti per i capitoli 5-11 sono elencati in `BACKLOG.md` §I3 e
provati nella VM vera da `tests/infrastruttura.sh`.

---

## 8. Cosa c'è già, e cosa manca

### Fatto e verificato

- Motore a due host, snapshot, i due terminali, il canale di verifica.
- **Capitoli 1-12** completi IT/EN: dai due host alla rotazione additiva, con 25
  esercizi. Ogni stato iniziale fallisce, ogni soluzione passa su tre semi e ogni
  scorciatoia dichiarata viene respinta.
- Guida «Basi» che si apre alla prima visita, sommario, profondità BASE/PRO, IT/EN.
- Otto banchi di prova, fra cui quattro che **fanno il giro come lo fa una persona**
  (`test:consegna`, `test:cwd`, `test:identita`, `test:tastiera`) — esistono perché tutti i difetti
  trovati usando il lab erano invisibili agli altri test.
- Pool a build time: 8 host key ed25519, 16 chiavi utente ed25519 e 2 RSA-4096.
- Gli otto helper per login fallito, host identity, agent, offerte, modi e integrita'
  del config; la baseline di `sshd_config` viene registrata dopo ogni seed.
- Immagine ripulita dai manuali generici e dal repository APK del lab fratello;
  `mandoc` e `openssh-doc` restano per consultare la documentazione SSH: 64 MB e
  3.751 file contro 77 MB e 5.444 file; snapshot invariato a 16,6 MB.
- CI: `.github/workflows/test.yml` e `pages.yml`; l'immagine si ricostruisce solo quando
  cambia l'hash dei file di build (`lab/packages.lock`).
- README IT + EN, screenshot in `screenshots/`.

### Manca

- La prova su un telefono reale; il viewport stretto automatizzato non verifica tastiera,
  touch e memoria del dispositivo.

### Materia prima per i capitoli

`~/Workspaces/GemelloDigitaleManzolo/30_Note/chiavi-ssh.md` — 618 righe di esperienza
vera, non di tutorial: la rotazione additiva in cinque passi, `IdentitiesOnly` per
collaudare la chiave nuova, ed25519 rifiutato dal NAS del 2006, **la passphrase che non
cambia la chiave pubblica** (quindi ogni copia già fatta apre ancora tutto), il censimento
delle 14 chiavi fantasma su 5 macchine, e la sottigliezza dell'agent: `ssh` lo trova da
`IdentityAgent`, **`ssh-add` no**. Più la regola imparata: *«cancellata dai posti che
conosco» non è «cancellata»*.

Sono esercizi che nessun tutorial ha, perché nascono da guasti veri. **Usali.**

---

## 9. Definizione di fatto, per ogni capitolo

1. `npm test` verde: struttura, bilinguismo completo, id dei check corrispondenti.
2. `npm run test:labs` verde: per **ogni** esercizio — lo stato iniziale non passa già ·
   la soluzione passa **su tre semi** · il `cheat.sh` fallisce.
3. Il capitolo è stato fatto **a mano, dall'inizio, senza guardare la soluzione**.
4. La voce è passata da `IN_ARRIVO` a `CAPITOLI` in `content/index.js`.
5. Un commit solo, il cui messaggio dice **cosa si impara**, non quali file sono cambiati.
