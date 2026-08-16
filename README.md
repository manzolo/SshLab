# EDU-LINUX · Linux Lab

**Imparare Linux con un terminale che risponde davvero.**
22 capitoli, dalla prima riga di comando fino a mettere in piedi un server.

👉 **[Provalo online](https://manzolo.github.io/LinuxLab/)** — niente da installare, niente account.

[English version](README.en.md)

---

## Cos'è

Apri il link e dopo qualche secondo hai **un kernel Linux vero dentro la scheda del
browser**. Non è una simulazione, non è un finto terminale che risponde solo ai comandi
previsti: è Linux, e puoi digitarci qualunque cosa. Anche romperlo — c'è un bottone che lo
rimette a nuovo in mezzo secondo.

A sinistra si legge, a destra si prova. Ogni capitolo ha esercizi che la macchina
**verifica davvero**, guardando com'è finito il suo filesystem.

## Come funziona l'anti-trucco

Nei fratelli della collana EDU-\* il motore è di carta, quindi la verifica può confrontare
gli output. Qui il motore è un kernel: si può arrivare al risultato in dieci modi, tutti
legittimi. La risposta non è controllare meglio, è **spostare l'indeterminatezza sul mondo**:

> Se lo stato iniziale è generato con un seme che non conosci, la risposta non è cablabile —
> e il metodo non serve controllarlo.

Il log ha un numero di righe `ERROR` diverso a ogni sessione. La cartella nascosta ha un nome
generato. I cinque IP più frequenti non li puoi scrivere a mano perché non li hai visti. Nei
capitoli sugli script la verifica **esegue il tuo script su casi che non hai mai visto**, e
il capstone lo prova su una macchina riportata allo stato iniziale: se hai fatto tutto a
mano, non passa.

E quando sbagli non ti diciamo «no»: ti diamo **un comando per guardare il problema**.
Dopo dieci esercizi hai interiorizzato il riflesso che è il mestiere: prima guardo, poi cambio.

## Il programma

| | Capitolo | Dove |
|---|---|---|
| 01 | Il terminale, cos'è davvero | 🌐 |
| 02 | Muoversi | 🌐 |
| 03 | File e cartelle | 🌐 |
| 04 | Leggere un file | 🌐 |
| 05 | Il filesystem: /etc, /var, /proc | 🌐 |
| 06 | Permessi e proprietà | 🌐 |
| 07 | Utenti, gruppi, sudo | 🌐 |
| 08 | Pipe e redirezione | 🌐 |
| 09 | Cercare: find e grep | 🌐 |
| 10 | Trasformare: sed, awk, sort | 🌐 |
| 11 | Processi e segnali | 🌐 |
| 12 | I pacchetti | 🌐 |
| 13 | Dischi, mount, spazio | 🌐 |
| 14 | Log e cose pianificate | 🌐 |
| 15 | Rete di base | 🌐 |
| 16 | Script bash | 🌐 |
| 17 | systemd | 💻 |
| 18 | Rete avanzata | 💻 |
| 19 | Servizi: nginx e ssh | 💻 |
| 20 | Firewall e sicurezza | 💻 |
| 21 | LVM e RAID | 💻 |
| 22 | Capstone: metti in piedi un server | 💻 |

🌐 = nel browser, senza installare niente · 💻 = nel laboratorio locale (Docker)

L'interruttore **BASE / PRO** regola la profondità: in BASE impari cosa fare, in PRO scopri
come funziona sotto e cosa si rompe. Sono le stesse pagine.

## Perché sei capitoli girano in locale

Perché non si può fingere. Nel browser l'emulatore v86 esegue un Linux vero, ma:

- **systemd vuole essere PID 1 e vuole i cgroup**, e v86 avvia una shell su un kernel che non
  ha né l'uno né gli altri. In più Alpine, il sistema ospite, usa OpenRC e systemd non ce
  l'ha proprio.
- **la rete vera vuole una scheda di rete**, e la macchina del browser non ne ha nessuna.
- **LVM e RAID vogliono più dispositivi a blocchi.**

I capitoli 17-22 hanno la stessa anatomia degli altri, gli stessi `seed.sh` e `check.sh`, e
lo stesso comando `lab check`. Cambia solo chi li esegue. E la spiegazione del *perché* non
funzionerebbero è essa stessa materia del capitolo: chi legge impara cosa serve davvero a
systemd per esistere.

```bash
git clone https://github.com/manzolo/LinuxLab && cd LinuxLab
./lab/local/run.sh 17 1          # prepara il laboratorio e l'esercizio
docker exec -it linuxlab bash    # entra
lab check 17 1                   # verifica
./lab/local/run.sh cleanup       # quando hai finito
```

> ⚠️ I capitoli 21 e 22 usano un container `--privileged`, e i loop device, i volumi LVM e
> gli array RAID **sono globali del tuo computer**: un `lsblk` sull'host li mostra. Per questo
> tutto quello che il laboratorio crea si chiama `lab-*`, e `cleanup` smonta e stacca ogni
> cosa. È scritto anche nel capitolo, perché è una cosa che va saputa e non nascosta.

## Cosa questo lab NON copre

Detto senza girarci intorno: avvio e bootloader (GRUB, initramfs), kernel e moduli,
partizionamento di dischi veri, virtualizzazione, container come argomento a sé,
configurazione di rete permanente della distribuzione. Sono argomenti veri e grossi, e
meritano più di un accenno.

Su mobile il lab è **leggibile ma non praticabile**: il terminale ha bisogno di una tastiera
vera. Il sito lo dice invece di far provare e frustrare.

## Com'è fatto

Sito statico, ES modules, zero dipendenze, zero build. La macchina è
[v86](https://github.com/copy/v86) (BSD-2) con [xterm.js](https://github.com/xtermjs/xterm.js)
(MIT) e un rootfs Alpine costruito da noi. Tutto open source, nessun CDN, nessun backend.

Due decisioni tengono su il resto:

- **Uno snapshot solo per tutti i 22 capitoli.** A freddo, da 9p, il kernel ci mette ~46
  secondi; dallo snapshot il prompt c'è in mezzo secondo. Uno snapshot solo significa una URL
  scaricata al primo capitolo e cache hit per gli altri 21 — e la macchina resta *la stessa*
  passando di capitolo in capitolo.
- **I contenuti non stanno dentro l'immagine.** Vivono in `content/chNN/` e ci entrano a
  runtime. Cambiare un esercizio è un commit di testo, non una ricostruzione da due minuti.

Il canale di verifica passa da una **seconda porta seriale**, non dal terminale visibile: se
fosse il contrario, un comando iniettato mentre sei dentro `vi` ti distruggerebbe il lavoro.
Misurato: durante una verifica completa sul terminale compaiono zero byte.

### Numeri misurati

| | |
|---|---|
| primo caricamento | 13,5 MB |
| snapshot compresso | 10,7 MB |
| dallo snapshot al prompt | 0,6 s in Chrome |
| rootfs completo | 72 MB / 5400 file (scaricati su richiesta, non all'avvio) |

## Farlo girare in locale

```bash
npm run serve          # http://localhost:8801 — legge i capitoli, senza terminale
```

Per avere anche il terminale serve compilare l'immagine una volta (Docker, `zstd`,
`pip install zstandard`):

```bash
make -C lab check-tools
npm run image          # ~4 minuti: rootfs + snapshot
npm run serve
```

Se l'immagine manca, il sito lo dice in chiaro invece di dare un errore di rete.

## Test

```bash
npm test               # struttura dei contenuti: bilingue, id dei check, prerequisiti (secondi)
npm run test:labs      # avvia la VERA macchina ed esegue tutti gli esercizi del browser
npm run test:labs-local # gli esercizi dei capitoli 17-22, nel container Debian
npm run e2e            # smoke test su Chrome headless
```

`test:labs` esegue su ogni esercizio le cinque asserzioni della collana: lo stato iniziale
**non** passa già, la soluzione di riferimento passa **su tre semi diversi**, e il trucco
scritto apposta **fallisce**. Se questi sono verdi, il modello didattico regge.

## Aggiungere un capitolo

```bash
npm run new-chapter -- 23 nome-del-capitolo
```

I capitoli con `draft: true` sono nascosti dal sommario e saltati dai test: si può committare
un capitolo a metà senza rompere niente.

## Licenza

MIT © Andrea Manzi ([manzolo](https://github.com/manzolo)) — vedi
[THIRD-PARTY.md](THIRD-PARTY.md) per le licenze dei componenti e dei pacchetti ridistribuiti.

Fa parte della collana **EDU-\***: [AI Atlas](https://manzolo.github.io/AiAtlas/) ·
[EDU-SQL](https://manzolo.github.io/SqlSimulator/) ·
[EDU-NET](https://manzolo.github.io/NetworkSimulator/) ·
[EDU-GIT](https://manzolo.github.io/GitSimulator/) ·
[EDU-REGEX](https://manzolo.github.io/RegexSimulator/) ·
[EDU-CRYPTO](https://manzolo.github.io/CryptoSimulator/) — e gli altri, con il topic
[`edu-simulator`](https://github.com/topics/edu-simulator).
