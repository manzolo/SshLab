# BACKLOG — i capitoli 2…12

Stato al 2026-08-16: **il motore e l'infrastruttura I1-I4 sono finiti; il capitolo 1
è in piedi.** Mancano i capitoli 2-12.

Questo file è scritto per essere aperto da un agente e lavorato un capitolo per volta.
Non è un elenco di titoli: per ogni capitolo c'è **l'invariante misurabile**, che è la
sola parte difficile. I testi si riscrivono, un check sbagliato insegna una cosa falsa.

---

## Come si lavora un capitolo

```bash
npm run new-chapter -- 2 chiavi        # scheletro con i blocchi e i TODO
# riempi content/ch02/chapter.js e i quattro script di ogni esercizio
# aggiungi la riga in content/index.js  E  togli la voce da IN_ARRIVO
npm test                                # struttura, bilinguismo, opzioni della VM
npm run test:labs                       # la macchina VERA, ogni esercizio su tre semi
git commit
```

Il piede della pagina e il sommario si aggiornano da soli: `TOTALE` è
`CAPITOLI.length + IN_ARRIVO.length`, quindi spostare una voce dall'una all'altra è
l'unica cosa da fare perché «Capitolo 2 di 12» e il bottone `Successivo →` diventino veri.

### Il contratto di un esercizio

Quattro script in `content/chNN/eN/`, e nessuno dei quattro è facoltativo:

| file | cosa fa | la regola |
|---|---|---|
| `seed.sh` | costruisce il mondo da `$EDU_SEED` | tutto ciò che varia passa da `edu_rand_*`; **azzera sempre il registro** con `lab_log_azzera` se un check guarda `sshd` |
| `check.sh` | misura | asserisce l'**invariante**, mai la forma del comando; emette `lab_fact` con i numeri veri e chiude con `lab_done` |
| `solution.sh` | la soluzione di riferimento | deve passare **su tre semi diversi** |
| `cheat.sh` | la scorciatoia plausibile | **deve fallire**. Se passa, il check è scritto male |

Gli `id` dei `checks` dichiarati nel `chapter.js` e quelli emessi da `check.sh` si
corrispondono uno a uno: lo verifica `npm test`.

### Le tre regole che non si negoziano

1. **`BatchMode=yes` è il perno del corso.** È l'unico modo di asserire un'*assenza*:
   se servisse una password, `ssh` fallisce invece di chiederla. Sta già dentro
   `lab_login_prova` / `lab_login_riuscito`.
2. **Le chiavi si confrontano per impronta** (`lab_fp`), mai per nome di file.
3. **Il testimone è il registro del server** (`lab_sshd_dice`), non la history del pc:
   `sshd` scrive metodo *e impronta* di quello che ha accettato davvero. Si misura
   quello che è successo, non quello che è stato digitato.

---

## Prima dei capitoli: quattro lavori di infrastruttura (completati)

Completati il 2026-08-16 e provati dentro la VM vera da `tests/infrastruttura.sh`,
che `npm run test:labs` esegue prima dei capitoli. Restano qui come contratto dei
capitoli che li usano e per evitare che una build futura li disfaccia.

### I1 · Il pool di host key (completato; serve a ch06 e ch07)

Il capitolo sulle impronte ha bisogno che **l'impronta del server cambi da un mondo
all'altro**, altrimenti la risposta si cabla nel testo. Generarla a runtime costa
tempo su CPU emulata e — peggio — entropia.

- In `lab/Dockerfile.v86`, a build time (CPU vera): **8 coppie ed25519** in
  `/opt/lab/hostkeys/01…08/`.
- `seed.sh` ne sceglie una con `edu_rand_pick`, la installa e riavvia `sshd`.
- Il riavvio di `sshd` **deve entrare in tutti e due i namespace**: si estrae la
  parte finale di `lab-hosts-up` in un `/opt/lab/bin/lab-sshd-riavvia` che passa da
  `/run/lab/entra-server`. Riavviarlo con il solo `ip netns exec` rimette in piedi
  il bug del prompt `deploy@pc`.

### I2 · Il pool di chiavi utente (completato; serve a ch03, ch09, ch11)

`ssh-keygen` a runtime va benissimo quando **è la lezione** (ch02, ch12). Quando
invece servono sei chiavi in un colpo solo per riempire l'agent, o quattro esche fra
cui riconoscere la propria, generarle costa decine di secondi di attesa muta.

- A build time: **16 ed25519** in `/opt/lab/keys/ed25519/NN{,.pub}`, più **2 RSA-4096**
  in `/opt/lab/keys/rsa/` (servono al blocco PRO su «il NAS del 2006 non conosce
  ed25519»: una RSA-4096 su CPU emulata costa minuti, e questo si dice nel testo).
- Peso: ~40 file da poche centinaia di byte. Sotto la soglia dei 25 MB dello snapshot
  (`lab/build-state.mjs`) non si sposta niente, ma **va rimisurato dopo I4**.

### I3 · Gli helper nuovi in `labcheck.sh` (completato)

Da aggiungere una volta sola, con lo stesso stile documentato di quelli che ci sono:

| helper | serve a | nota |
|---|---|---|
| `lab_login_fallito UTENTE [opz]` | ch05, ch12 | l'assenza dichiarata: 0 se il login **non** entra. Non è `! lab_login_riuscito`: deve distinguere «rifiutato» da «non ho potuto provare» |
| `lab_hostkey_fp` | ch06, ch07 | impronta di `/etc/ssh/ssh_host_ed25519_key.pub` |
| `lab_known_hosts_fp UTENTE` | ch06, ch07 | impronte dentro `~UTENTE/.ssh/known_hosts` (`ssh-keygen -lf`, che le legge anche se sono hashate) |
| `lab_agent_socket UTENTE` | ch10, ch11 | il socket dell'agent di **quell'utente**: il check gira come root, in un altro processo, e `SSH_AUTH_SOCK` non lo eredita. Si cerca su disco, per proprietario |
| `lab_agent_impronte UTENTE` | ch10, ch11 | `SSH_AUTH_SOCK=… ssh-add -l`, ridotto alle sole impronte |
| `lab_offerte UTENTE` | ch11 | quante `Failed publickey` il server ha registrato **prima** dell'ultima `Accepted`. È la misura del capitolo, e non guarda le opzioni usate |
| `lab_modo FILE` | ch08 | `stat -c %a`, con un fatto leggibile |
| `lab_sshd_config_intatto` | ch08 | impronta del file di configurazione: senza, il modo più comodo di superare il capitolo dei permessi è spegnere `StrictModes` |

### I4 · Dimagrire l'immagine (completato)

`lab/Dockerfile.v86` porta ancora roba che serviva a LinuxLab e qui non serve a
nessuno. Toglierla fa spazio ai due pool e accorcia la build:

- il magazzino `apk` offline (`/opt/repo`, `htop ncdu figlet`) — era il capitolo 12 *di là*;
- `makewhatis`, i manuali generici e i relativi pacchetti `-doc` — erano il
  capitolo 1 *di là*. Restano intenzionalmente `mandoc` e `openssh-doc`: in un
  corso SSH, `man ssh_config` e `man sshd_config` sono strumenti didattici;
- l'intestazione del file, che diceva ancora «EDU-LINUX · Linux Lab».

Misura prima/dopo: rootfs piatto da **77 MB / 5.444 file / 153 pacchetti** a
**64 MB / 3.751 file / 143 pacchetti**, compresi i manuali OpenSSH. Lo snapshot
resta **16,6 MB**, sotto il tetto di 25 MB.

---

## I capitoli

Ordine di scrittura: **02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12.**
Non è alfabetico ed è vincolante: dal 4 in poi ogni capitolo dà per scontato lo stato
mentale del precedente, e il 12 è il capstone che li usa tutti.

---

### ch02 · La coppia di chiavi — *due file, uno resta a casa*

**La cosa che si impara:** la privata non esce mai; la pubblica si può pubblicare. E
la pubblica si **ricava** dalla privata in ogni momento — quindi perderla non è un
problema, perdere la privata sì.

- **e1 · genera** (`stato`) — `ssh-keygen -t ed25519 -C "manzolo@pc"` in `~/.ssh/id_ed25519`.
  **Invariante:** la privata esiste con modo `600`, la pubblica esiste, e
  `lab_fp` delle due **combacia**. `lab_fact` con l'impronta.
  **cheat:** copiare una chiave del pool nella `.pub` lasciando un'altra privata → le
  impronte non combaciano.
- **e2 · la pubblica si ricalcola** (`risposta`) — il seed lascia in `~/lab/chiavi/`
  una privata e **quattro** pubbliche (dal pool, scelte da `edu_rand_pick`): quale
  appartiene alla privata? Si risolve con `ssh-keygen -y -f <privata>` oppure
  `ssh-keygen -lf` su tutte e cinque. `lab answer <nome-file>`.
  **Invariante:** `lab_answer_eq` sul nome — ma il check confronta le **impronte**, e il
  nome è solo il modo di consegnare.

**Trappola da mettere nel testo:** `ssh-keygen` senza `-f` sovrascrive `~/.ssh/id_rsa`
e chiede conferma una volta sola. E `-C` non è un dettaglio estetico: è l'unica cosa
che, dentro un `authorized_keys` di dodici righe, dice **di chi** è quella riga.

**Blocco PRO:** perché ed25519 e non RSA — 68 byte contro 800, e nessuna scelta di
lunghezza da sbagliare. Con l'eccezione onesta: i server vecchi non la conoscono
(vedi `30_Note/chiavi-ssh.md`, il NAS del 2006).

---

### ch03 · L'impronta — *il nome del file non vuol dire niente*

**La cosa che si impara:** l'identità di una chiave è la sua impronta. `id_ed25519` e
`lavoro` sono **la stessa chiave** se l'impronta combacia; due file identici di nome
non sono niente l'uno per l'altro.

- **e1 · leggila** (`risposta`) — il seed installa nel `~/.ssh` del pc una chiave
  scelta dal pool con `edu_rand_pick`: consegna la sua impronta con `lab answer`.
  Non è copiabile da nessun testo, cambia a ogni mondo.
  **Invariante:** `lab_answer_eq` contro `lab_fp`.
- **e2 · le due gemelle** (`risposta`) — sei file in `~/lab/chiavi/` con nomi
  sorteggiati (`edu_rand_word`), fra cui **due** che sono la stessa chiave con nomi
  diversi. Consegna i due nomi.
  **Invariante:** le due impronte consegnate sono uguali fra loro e presenti nella
  cartella. Non l'ordine, non i nomi esatti.

**Blocco PRO:** cos'è quel `SHA256:` — l'hash della chiave in base64, non della riga:
il commento può cambiare e l'impronta no. E `-E md5`, il formato con i due punti che
si vede ancora sui sistemi vecchi.

---

### ch04 · `authorized_keys` — *entrare senza password*

**La cosa che si impara:** l'autorizzazione **vive sul server**, in un file di testo,
una riga per chiave. Non c'è nessun registro centrale e nessuna magia.

- **e1 · portala di là** (`stato`) — copiare la pubblica del pc in
  `/home/deploy/.ssh/authorized_keys` sul server, a mano o con `ssh-copy-id`.
  **Invariante, e sono due:**
  1. l'impronta di una delle righe di `authorized_keys` **è** quella della chiave del pc;
  2. **`lab_login_riuscito manzolo`** — cioè un login vero, con `BatchMode=yes`, entra
     senza chiedere niente. Questo è ciò che conta; il file è solo il come.
- **e2 · chi ha aperto la porta** (`risposta`) — dopo essere entrato, consegna
  l'impronta che **il server dice** di aver accettato (`grep 'Accepted publickey' /var/log/messages`).
  Insegna a leggere il registro dal lato giusto, che è la competenza che serve quando
  non funziona.
  **Invariante:** `lab_sshd_dice 'Accepted publickey'` contiene l'impronta consegnata.

**cheat da far fallire:** mettere la pubblica in `~/.ssh/authorized_keys` **del pc**.
Siccome il disco è condiviso il file compare davvero, ed è esattamente per questo che
il check deve guardare `/home/deploy` e non `~`.

**Trappola nel testo:** `ssh-copy-id` non è magia — apre una sessione con la password e
appende una riga. Se non funziona, si fa a mano, e sapere cosa fa è la differenza fra
riprovare e capire.

---

### ch05 · Chi firma cosa — *autorizzata non vuol dire firmabile*

**La cosa che si impara:** il server non «riconosce» te: verifica una firma. Se la
privata non c'è, la riga in `authorized_keys` non serve a niente — e viceversa.

- **e1 · togli la privata** (`stato`) — spostare `~/.ssh/id_ed25519` altrove **senza
  toccare il server**, e constatare che non si entra più.
  **Invariante:** `lab_login_fallito manzolo` **e** la riga in `authorized_keys` è
  ancora lì con la stessa impronta. Le due insieme, o l'esercizio non dice niente.
  Testimone: `lab_sshd_dice 'Failed publickey|Connection closed by authenticating user'`.
- **e2 · ritrovala** (`stato`) — rientrare con `ssh -i <dove-l'hai-messa>`, senza
  rimettere il file al suo posto.
  **Invariante:** login riuscito **e** `~/.ssh/id_ed25519` continua a non esistere.

**Blocco PRO:** cosa passa davvero sul cavo — il client manda la **pubblica** per
chiedere «questa ti va bene?», e solo se il server dice sì firma la sessione. Il
segreto non attraversa mai il filo, nemmeno cifrato.

---

### ch06 · `known_hosts` e la prima volta (TOFU)

**La cosa che si impara:** finora abbiamo verificato **te**. Adesso verifichiamo
**lui**. La prima volta non c'è modo di sapere se è il server giusto: si fida e si
annota. È il TOFU, *trust on first use*, ed è il punto debole dichiarato di SSH.

Serve **I1** (pool di host key): l'impronta del server dev'essere diversa a ogni mondo.

- **e1 · la prima volta** (`stato` + `risposta`) — connettersi, **leggere l'impronta
  che ssh mostra**, confrontarla con quella che il server dichiara (dal terminale di
  destra: `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`), e accettare.
  **Invariante:** `lab_known_hosts_fp manzolo` contiene `lab_hostkey_fp`.
  Consegna l'impronta con `lab answer`: obbliga a leggerla invece di battere `yes`.
- **e2 · la seconda volta non chiede niente** (`stato`) —
  **Invariante:** un login con `-o StrictHostKeyChecking=yes -o BatchMode=yes` **riesce**.
  Con l'host sconosciuto fallirebbe: è la prova pulita che la voce c'è ed è quella giusta.

**cheat da far fallire:** `-o StrictHostKeyChecking=no` per saltare la domanda —
`known_hosts` resta senza la voce e l'e2 non passa. Nel testo si dice che quell'opzione
esiste, cosa fa e perché sui sistemi veri è come togliere la serratura.

---

### ch07 · «L'impronta è cambiata» — *il capitolo che si può sbagliare*

**La cosa che si impara:** quel muro giallo con
`WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED` è una domanda, non un ostacolo. Il
gesto giusto **dipende da una cosa che il computer non sa**: se il server è stato
reinstallato o se è qualcun altro.

Il seed installa una host key **diversa** da quella già in `known_hosts` e, con
`edu_rand_pick`, decide in quale dei due mondi si è finiti — lasciando l'indizio dove
lo si troverebbe davvero (un `~/lab/manutenzione.txt` con la data della reinstallazione
e **l'impronta nuova annunciata**, oppure niente del tutto).

- **e1 · leggi il muro** (`risposta`) — provoca l'errore e consegna l'impronta **nuova**
  che `ssh` mostra. Misurabile, e costringe a leggere il messaggio invece di cercare su
  internet come farlo sparire.
  **Invariante:** l'impronta consegnata è `lab_hostkey_fp`.
- **e2 · decidi** (`stato`, biforcuto sul seme):
  - mondo *legittimo* (l'annuncio c'è **e** l'impronta annunciata combacia): rimuovi la
    voce vecchia con `ssh-keygen -R`, riaccetta, entra.
    **Invariante:** `known_hosts` contiene la nuova impronta e il login `Strict+Batch` riesce.
  - mondo *sospetto* (nessun annuncio): **non ci si connette**.
    **Invariante:** `known_hosts` è rimasto **identico** a com'era e nel registro del
    server non c'è nessun `Accepted`. Più `lab answer no`.

**cheat da far fallire:** `ssh-keygen -R` a occhi chiusi in tutti e due i mondi — nel
mondo sospetto il check vede che la voce è cambiata e boccia. **È l'unico esercizio del
corso in cui la risposta giusta è non fare niente**, e va detto nel testo dopo.

---

### ch08 · Permessi — *cosa pretende `sshd`, e perché*

**La cosa che si impara:** `sshd` rifiuta le chiavi che chiunque altro potrebbe aver
scritto. Lato client, `ssh` rifiuta di usare una privata leggibile da altri. Sono due
controlli diversi, su due macchine, con due messaggi diversi — e nessuno dei due dice
«permessi sbagliati» in modo chiaro al primo colpo.

Il seed rompe **una** cosa, scelta da `edu_rand_pick`, fra: `~/.ssh` a `777`,
`authorized_keys` a `666`, la home del server a `777`, la privata sul pc a `644`.

- **e1 · rimetti a posto** (`stato`) —
  **Invariante:** `lab_login_riuscito manzolo` **e** i modi finali sono corretti
  (`700` sulla cartella, `600` su `authorized_keys` e sulla privata) **e**
  `lab_sshd_config_intatto`.
  Testimone del guasto, da citare nel nudge: `Authentication refused: bad ownership or
  modes for directory /home/deploy/.ssh`, che si vede **solo nel registro del server**.
- **e2 · trova il colpevole** (`risposta`) — con un mondo rotto diversamente, consegna
  quale file è il problema, letto dal registro.

**cheat da far fallire:** `StrictModes no` in `sshd_config` — il login riuscirebbe, e
`lab_sshd_config_intatto` lo prende. È la scorciatoia che si trova su internet ed è il
motivo per cui l'helper esiste.

**Blocco PRO:** perché il controllo arriva fino alla **home**: se la cartella è
scrivibile da altri, chi può rinominare `.ssh` può metterci il proprio.

---

### ch09 · La passphrase — *e le tre cose che non risolve*

**La cosa che si impara:** la passphrase cifra la chiave **sul disco**. Non cambia la
chiave, non cambia la pubblica, non ritira niente. È il capitolo con il materiale
migliore: `30_Note/chiavi-ssh.md` §«Quello che la passphrase NON risolve».

- **e1 · proteggila** (`stato`) — `ssh-keygen -p -f ~/.ssh/id_ed25519`.
  **Invariante, e sono le due metà dello stesso fatto:**
  1. `ssh-keygen -y -P "" -f <chiave>` **fallisce** (cioè è davvero protetta);
  2. **l'impronta della pubblica è identica a prima** — il seed la registra prima di
     consegnare il mondo, e il check la riconfronta. È il punto del capitolo.
- **e2 · la copia che gira ancora** (`stato`/`risposta`) — il seed ha lasciato una copia
  della privata **non protetta** in un vecchio backup (`~/lab/backup-2019/`). Dimostra
  che con quella si entra ancora, e consegna l'impronta che il server ha accettato.
  **Invariante:** `lab_sshd_dice 'Accepted publickey'` con l'impronta della copia.
  **La morale, che è la regola di Andrea:** *«cancellata dai posti che conosco» non è
  «cancellata»*. Per ritirare una chiave si toglie dal server — ed è il ch12.

**Da misurare prima di scrivere l'esercizio:** `-a 100` (i giri di derivazione della
passphrase) su CPU emulata. Se costa più di ~10 s, nel lab si usa il valore di
default e **si dice nel testo** che sulla macchina vera si mette `-a 100`. Non si
falsifica il tempo: si dichiara.

---

### ch10 · `ssh-agent` — *la passphrase una volta sola*

**La cosa che si impara:** l'agent tiene la chiave **sbloccata in memoria** e firma per
conto tuo. Non è un portachiavi di password: è un processo che sa firmare e non
consegna mai la chiave a nessuno.

Senza I3 (`lab_agent_socket`) non si scrive: il check gira come root, in un processo
suo, e `SSH_AUTH_SOCK` dell'utente non lo eredita. Il socket si trova su disco, per
proprietario.

- **e1 · avvialo e caricaci la chiave** (`stato`) — `eval $(ssh-agent)` e `ssh-add`.
  **Invariante:** il processo esiste, il socket è vivo, `lab_agent_impronte manzolo`
  contiene l'impronta della chiave **e** `lab_login_riuscito manzolo` passa
  **pur essendo la chiave protetta da passphrase** (dal ch09). Quest'ultima è la prova
  pulita: con `BatchMode=yes` e senza agent, una chiave protetta non entra.
- **e2 · cosa c'è dentro** (`risposta`) — `ssh-add -l` (impronte) contro `ssh-add -L`
  (le righe intere, quelle da incollare in `authorized_keys`), `-d` per togliere una
  chiave, `-D` per svuotare.

**Blocco PRO — la sottigliezza vera**, dalla nota di Andrea: `ssh` trova l'agent anche
da `IdentityAgent` nel config; **`ssh-add` no, legge solo `SSH_AUTH_SOCK`**. Il sintomo
è un `ssh-add -l` che dice «Could not open a connection» mentre `ssh` funziona
benissimo — e si perde mezz'ora a cercare un guasto che non c'è.

**Da NON promettere:** l'agent forwarding (`-A`). È un capitolo a sé, ed è pericoloso:
va nel «se avanza».

---

### ch11 · Troppe chiavi — *`IdentitiesOnly`, e il conto delle offerte*

**La cosa che si impara:** il client **offre le chiavi una per una**, e il server ne
accetta solo un certo numero di tentativi (`MaxAuthTries`, di default 6). Con sei chiavi
in agent, quella buona può non arrivare mai al suo turno: si viene buttati fuori con
`Too many authentication failures` **anche avendo la chiave giusta**.

Serve **I2** (pool): sei chiavi si caricano, non si generano.

Il seed: carica nell'agent **6 chiavi** dal pool (ordine deciso dal seme), autorizza sul
server **solo una** — quella che sta in fondo — e mette `MaxAuthTries 3` nella
configurazione di `sshd`.

- **e1 · entra** (`stato`) —
  **Invariante, ed è il cuore del capitolo:** il login riesce **e**
  `lab_offerte manzolo` ≤ 2. Si misura **quante chiavi il server si è visto offrire**,
  non quale opzione è stata usata. Ci si arriva con `-o IdentitiesOnly=yes -i <chiave>`,
  o con un blocco `Host` in `~/.ssh/config`, o svuotando l'agent: **tutte e tre giuste**.
- **e2 · scrivilo nel config** (`stato`) — un blocco `Host lab` in `~/.ssh/config` con
  `HostName`, `User`, `IdentityFile` e `IdentitiesOnly yes`.
  **Invariante:** `ssh lab` (nome corto, niente altro) entra, e le offerte restano ≤ 2.

**cheat da far fallire:** alzare `MaxAuthTries` sul server → `lab_sshd_config_intatto`.
Nel testo: sul server di qualcun altro quel numero non lo alzi tu.

---

### ch12 · Ruotare una chiave senza chiudersi fuori — *capstone*

**La cosa che si impara:** la sequenza in cinque passi che sta in
`30_Note/chiavi-ssh.md` §«Da fare (in ordine, sempre additivo)». È **additiva**:
in nessun istante `authorized_keys` resta senza una chiave valida. La regola che la
riassume: *si aggiunge, si prova, e solo dopo si toglie.*

Tre esercizi in sequenza, e l'ordine **è** la lezione. Ognuno ha uno stato finale
misurabile, così non serve un guardiano che osservi gli istanti intermedi.

- **e1 · aggiungi** (`stato`) — genera la chiave nuova e **appendila** ad
  `authorized_keys` senza togliere la vecchia.
  **Invariante:** `authorized_keys` contiene **due** impronte distinte, ed **entrambe**
  entrano (`lab_login_riuscito` con `-i vecchia` e con `-i nuova`).
- **e2 · prova la nuova, da sola** (`stato`) — entra con
  `-o IdentitiesOnly=yes -i ~/.ssh/id_nuova`, prima di toccare qualsiasi cosa.
  **Invariante:** `lab_sshd_dice 'Accepted publickey'` porta l'impronta **nuova**,
  **e** `authorized_keys` contiene **ancora tutte e due**. Chi ha già cancellato la
  vecchia fallisce qui — ed è esattamente il gesto che nella vita vera ti chiude fuori.
- **e3 · solo adesso ritira la vecchia** (`stato`) — commentare, non cancellare
  (`# ` davanti alla riga, così il ritiro è annullabile e resta scritto chi c'era).
  **Invariante:** la vecchia **non entra più** (`lab_login_fallito`), la nuova sì, e
  `authorized_keys` **non è mai vuota**.

**Il blocco che chiude il corso**, ed è la riga più preziosa di tutta la nota: *toccare
solo il config locale non ritira niente — la chiave resta valida sul server.* Con il
numero che la rende vera: 14 chiavi fantasma trovate su 5 macchine, 7 delle quali di
computer che non esistono più, e con accesso root.

---

## Se avanza tempo (capitoli 13+, non promessi in `IN_ARRIVO`)

- **`ProxyJump` e il terzo host.** Con i namespace, aggiungere un `db` raggiungibile
  **solo** dal server costa tre comandi in `lab-hosts-up`. È il modo giusto di
  raccontare `-J`, e soprattutto **l'agent forwarding e i suoi rischi**: chi è root
  sul salto può usare il tuo agent finché sei connesso.
- **`authorized_keys` con le restrizioni** (`command=`, `from=`, `restrict`): una chiave
  che può fare **una** cosa sola. È il modo in cui si fanno i backup automatici senza
  regalare una shell.
- **Le chiavi firmate da una CA** (`TrustedUserCAKeys`): come si esce dal problema di
  `authorized_keys` quando i server diventano quindici. È dove finisce il corso e
  comincia l'infrastruttura.

---

## Fuori dai capitoli — la coda aperta

- [ ] **Portare la correzione del `\r` su LinuxLab, che è ONLINE.** Un carattere in
      `lab/overlay/opt/lab/bin/labagentd`: `tr -d '\000-\010\013-\037'`. Senza,
      qualunque output con un `\r` dentro fa fallire una verifica con un ingannevole
      «la verifica non ha risposto». Il difetto è ereditato da lì.
- [ ] **Consegna:** `gh repo create manzolo/SshLab`, Pages, topic `edu-simulator`,
      riga nel profilo `~/Workspaces/github/manzolo`.
- [ ] **Screenshot del README** rigenerati quando i capitoli saranno più di uno
      (`npm run screenshot`).
- [ ] **Gemello:** scheda in `20_Progetti/ssh-lab.md` e una riga nel `Diario/2026-08.md`
      sul *perché* — l'unica parte non ricostruibile dai commit.

---

## Definizione di fatto, per ogni capitolo

1. `npm test` verde (struttura, bilinguismo IT/EN completo, id dei check corrispondenti).
2. `npm run test:labs` verde: per **ogni** esercizio, lo stato iniziale non passa già,
   la soluzione passa **su tre semi**, il `cheat.sh` **fallisce**.
3. Il capitolo è stato fatto **a mano, dall'inizio, senza guardare la soluzione** — è
   l'unico modo in cui sono venuti fuori tutti i difetti veri di questo lab: la
   rotellina, il prompt `deploy@pc`, gli indirizzi che cambiavano da soli, il verdetto
   che nascondeva l'errore. Gli altri test non leggono, non scorrono e sanno già la
   risposta.
4. La riga è passata da `IN_ARRIVO` a `CAPITOLI` in `content/index.js`.
5. Un commit solo, con il messaggio che dice **cosa si impara**, non quali file sono
   cambiati.
