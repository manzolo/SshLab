# EDU-SSH · SSH Lab

**Imparare SSH con due macchine vere, affiancate nella stessa pagina.**
Chiavi pubbliche e private, `ssh-agent`, impronte SHA256 — guardando cosa succede
dai due lati del cavo.

👉 **[Provalo online](https://manzolo.github.io/SshLab/)** — niente da installare, niente account.

[English version](README.en.md)

![Le due macchine al lavoro](screenshots/banco.png)

---

## Perché due macchine

Quasi tutti i tutorial su SSH ti fanno guardare **una** macchina. Ma ogni singola cosa
che devi capire è una relazione **fra due**: la chiave privata sta di qua e la pubblica
di là, l'impronta la mostra il server e la ricorda il client, l'agent risponde di qua a
una sfida che nasce di là.

Con una macchina sola impari la sintassi. Con due impari il modello.

Qui a sinistra c'è `manzolo@pc`, a destra `deploy@server`. Hanno due indirizzi, due
`~/.ssh` diversi, e fra loro una rete. Puoi scrivere in tutti e due.

## Il primo incontro, visto dai due lati

Questa è la schermata che riassume l'intero corso:

![L'impronta del server, letta da tutti e due i lati](screenshots/handshake.png)

A destra il server dichiara la propria identità con `ssh-keygen -lf`. A sinistra `ssh`,
al primo incontro, mostra **la stessa impronta** e chiede se ti fidi. Sono lo stesso
numero letto da due parti che non si erano mai parlate: è tutto quello che c'è dietro
`known_hosts`, ed è molto più facile da capire vedendolo che leggendolo.

## Non è un simulatore

È **OpenSSH vero** su **Linux vero**, dentro la scheda del browser: il kernel gira
emulato con [v86](https://github.com/copy/v86), i terminali sono
[xterm.js](https://xtermjs.org/). Le chiavi sono chiavi, le impronte sono quelle che ti
darebbe la tua macchina, e una riga di `authorized_keys` copiata da qui funziona anche
fuori di qui.

Puoi anche rompere tutto: c'è un bottone che rimette le macchine a nuovo in mezzo secondo.

### Come fanno a essere due

Non sono due computer, e il capitolo 1 lo dice apertamente: sono **un kernel solo con due
network namespace**, collegati da una coppia di interfacce virtuali. Le pile di rete sono
due davvero — due indirizzi, due tabelle di routing, un cavo in mezzo — mentre il disco è
condiviso.

È esattamente quello che è un container. Ed è anche il motivo per cui gli utenti sono due
(`manzolo` e `deploy`): siccome il disco è lo stesso, HOME diverse sono l'unico modo
perché `~/.ssh` sia davvero un altro file sull'altra macchina.

Il vantaggio pratico è grosso: **una CPU emulata invece di due**, uno snapshot invece di
due, e una verifica che può guardare dentro entrambi gli host senza aprire un secondo
canale — cioè senza dipendere da qualcosa che l'esercizio stesso potrebbe rompere.

## Come si verifica un esercizio

Non guardando cosa hai digitato: guardando **cosa è successo alle macchine**.

Per «entra sul server senza password» il controllo apre una connessione vera con
`BatchMode=yes` — che fallisce invece di chiedere la password, e quindi trasforma
un'assenza in una proprietà misurabile — e legge il **registro di `sshd`**, che sa metodo
e impronta di quello che ha accettato davvero.

L'anti-trucco viene dal mondo, non dalla sorveglianza: **indirizzi, nomi e chiavi cambiano
a ogni esercizio**, generati da un seme che non conosci. La risposta scritta in un capitolo
non è copiabile, perché nel tuo mondo quel numero è un altro.

E quando un controllo fallisce non ti dice «no»: ti dà il fatto che ha misurato, il perché
in una frase, e **un comando per guardare il problema**.

## Su schermo stretto

Sotto i 1200px i due terminali si impilano invece di stringersi — le colonne servono, e
un'impronta è lunga 74 caratteri. Sotto i 760px diventano due schede, con un pallino su
quella nascosta quando l'altra macchina stampa qualcosa:

<img src="screenshots/stretto.png" width="420" alt="Le due macchine come schede, su schermo stretto">

## Il programma

| | Capitolo | |
|---|---|---|
| 01 | Due macchine e un cavo | ✅ |
| 02 | La coppia di chiavi | in arrivo |
| 03 | L'impronta | in arrivo |
| 04 | `authorized_keys`: entrare senza password | in arrivo |
| 05 | Chi firma cosa | in arrivo |
| 06 | `known_hosts` e la prima volta | in arrivo |
| 07 | «L'impronta è cambiata» | in arrivo |
| 08 | Permessi: cosa pretende `sshd` | in arrivo |
| 09 | La passphrase | in arrivo |
| 10 | `ssh-agent` | in arrivo |
| 11 | Troppe chiavi: `IdentitiesOnly` | in arrivo |
| 12 | Ruotare una chiave senza chiudersi fuori | in arrivo |

I capitoli non ancora scritti compaiono lo stesso nel sommario, con il loro obiettivo:
un vuoto dichiarato toglie l'ansia meglio di un vuoto nascosto.

## Farlo girare in locale

```bash
npm run image     # rootfs + snapshot (serve Docker, zstd, python zstandard) — ~4 min
npm run serve     # http://localhost:8802
```

I capitoli si leggono anche senza immagine: senza, mancano solo le macchine.

## Test

| comando | cosa fa |
|---|---|
| `npm test` | struttura dei capitoli, bilinguismo, coerenza delle opzioni della macchina |
| `npm run test:labs` | avvia la **vera** macchina ed esegue ogni esercizio su tre semi |
| `npm run test:consegna` | il giro della consegna **digitando nel terminale**, come una persona |
| `npm run test:identita` | dopo un `ssh`, il prompt dice davvero `deploy@server` |
| `npm run test:tastiera` | quello che scrivi (o incolli) e' quello che arriva alla macchina |
| `npm run spike` | la prova dell'architettura, con i tempi |
| `npm run e2e` | smoke test su Chrome headless (serve `npm run serve` attivo) |
| `npm run screenshot` | rigenera le immagini di questo README |

Per ogni esercizio valgono le cinque asserzioni della collana: lo stato iniziale **non**
passa già · la soluzione di riferimento passa **su tre semi diversi** · il tentativo di
barare, scritto apposta, **fallisce**.

## I limiti, dichiarati

- **Non sono due computer**: un kernel, due namespace di rete, disco condiviso (vedi sopra).
- Su una CPU emulata la crittografia costa: una chiave ed25519 si genera in ~2 s, un login
  ne vuole ~8. Una RSA-4096 sarebbe questione di minuti, e infatti il lab non te la fa
  generare — te la fa **guardare**, ed è il motivo per cui oggi si usa ed25519.
- Da telefono si legge tutto, ma per esercitarsi serve una tastiera vera.
- `lab answer` è l'unico comando che esiste solo qui dentro: serve dove l'esercizio chiede
  di *leggere* qualcosa, perché leggere non lascia tracce. Dove compare, è dichiarato.

## Parenti

Fa parte della collana **EDU-\*** di [manzolo](https://github.com/manzolo):

- [EDU-LINUX · Linux Lab](https://github.com/manzolo/LinuxLab) — la shell, 22 capitoli con un kernel vero
- [EDU-CRYPTO · Cryptography Playground](https://github.com/manzolo/CryptoSimulator) — la matematica sotto le chiavi: RSA, Diffie-Hellman, hash
- [EDU-NET · Network Simulator](https://github.com/manzolo/NetworkSimulator) — cosa succede sul cavo, pacchetto per pacchetto

EDU-CRYPTO spiega *perché* una chiave pubblica funziona; qui si vede *come* si usa.

## Licenza

MIT © Andrea Manzi (manzolo).
[v86](https://github.com/copy/v86) BSD-2-Clause, [xterm.js](https://xtermjs.org/) MIT —
vedi [THIRD-PARTY.md](THIRD-PARTY.md).
