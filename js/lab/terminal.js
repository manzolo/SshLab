// terminal.js — i terminali visibili. Due, uno per macchina.
//
// ttyS0 e' il pc, ttyS2 e' il server. ttyS1 non compare qui: e' il canale di
// verifica (agent.js), e non deve mai avere uno schermo davanti.
//
// Perche' due seriali e non due macchine virtuali: v86 dichiara quattro UART, e
// una shell attaccata a ttyS2 dentro il network namespace del server e' un
// secondo host a tutti gli effetti, senza pagare una seconda CPU emulata.
//
// NB sulle interruzioni: in v86 ttyS0 e ttyS2 stanno sulla stessa linea (IRQ 4),
// ttyS1 e ttyS3 sull'altra (IRQ 3). Il canale di verifica sta apposta sulla linea
// dove non c'e' nessun terminale umano: e' quello fragile — richiesta, risposta e
// timeout — mentre una battuta persa su un terminale la ripara la battuta dopo.
// Misurato: 40 righe alternate sui due terminali, nessuna persa da nessuna parte.

import { macchina, risveglia } from "./machine.js";
import { shell } from "./agent.js";

// La chiave e' il numero della seriale, che e' anche l'identita' della macchina.
const terminali = new Map();
let inputAbilitato = true;

export const UART = { pc: 0, server: 2 };

// ---------------------------------------------------------------- la coda di invio
//
// La FIFO della UART emulata e' di sedici byte. Si manda meno di quella, con una
// pausa in mezzo, e non trabocca mai. I numeri sono prudenti apposta: 8 byte ogni
// 4 ms sono 2000 byte al secondo, cioe' molto piu' veloce di chiunque digiti e
// abbastanza per un incolla (una chiave pubblica da 80 caratteri: 40 ms).
const BLOCCO = 8;
const RITMO = 4;
const code = new Map();

function accoda(uart, byte) {
    const coda = code.get(uart) || { byte: [], attivo: false };
    coda.byte.push(...byte);
    code.set(uart, coda);
    if (!coda.attivo) svuota(uart);
}

function svuota(uart) {
    const coda = code.get(uart);
    if (!coda || !coda.byte.length) { if (coda) coda.attivo = false; return; }
    coda.attivo = true;
    macchina()?.serial_send_bytes(uart, Uint8Array.from(coda.byte.splice(0, BLOCCO)));
    setTimeout(() => svuota(uart), RITMO);
}

/** Crea (una volta) il terminale di una macchina e lo attacca al contenitore. */
export function creaTerminale(contenitore, uart) {
    const gia = terminali.get(uart);
    if (gia) { gia.term.open(contenitore); adatta(contenitore, uart); return gia.term; }

    const term = new window.Terminal({
        convertEol: true,
        cursorBlink: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        disableStdin: !inputAbilitato,
        fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
        fontSize: 13,
        // Lo scrollback costa memoria e qui i terminali sono due. 2500 righe
        // bastano a tenere un `ssh -vvv` intero, che e' la cosa piu' lunga che
        // qualcuno vorra' riguardare.
        scrollback: 2500,
        theme: temaDi(uart),
    });
    term.open(contenitore);

    // I byte si mandano IN CODA, a piccoli blocchi, non tutti insieme.
    //
    // Dall'altra parte c'e' una UART emulata: sedici byte di FIFO e nessun controllo
    // di flusso. Quello che trabocca non torna indietro — si perde, e se a spezzarsi
    // e' un carattere UTF-8 (che sono due byte) resta a mezzo e diventa un'altra
    // lettera. Cosi' `server` e' arrivato come `ßer`: a schermo l'eco diceva una
    // cosa e a `ssh` ne e' arrivata un'altra, che e' il modo peggiore di sbagliare
    // perche' incolpi te stesso.
    //
    // Digitando a mano il rischio e' remoto; incollando una riga — o battendo mentre
    // l'altra macchina sta stampando, visto che le due seriali condividono la linea
    // di interruzione — smette di esserlo. La coda costa qualche millisecondo su un
    // incolla lungo e toglie di mezzo l'intera classe di guasti.
    term.onData(d => {
        if (inputAbilitato) accoda(uart, new TextEncoder().encode(d));
    });
    macchina().add_listener(`serial${uart}-output-byte`, b => {
        term.write(String.fromCharCode(b));
        const t = terminali.get(uart);
        if (t) t.ascoltatoriOutput.forEach(f => f());
    });

    terminali.set(uart, { term, contenitore, ascoltatoriOutput: [] });
    adatta(contenitore, uart);
    return term;
}

/** Durante seed e reset il mondo sta cambiando: accettare caratteri in quella
 *  finestra crea comandi eseguiti a meta' o cancellati subito dopo. `disableStdin`
 *  ferma xterm; la guardia in onData e' la seconda cintura. */
export function abilitaInputTerminali(v) {
    inputAbilitato = !!v;
    if (!inputAbilitato) {
        // Un incolla lungo puo' avere ancora byte nella coda ritmata della UART:
        // non devono scivolare nel seed appena iniziato.
        for (const coda of code.values()) coda.byte.length = 0;
    }
    for (const { term } of terminali.values()) term.options.disableStdin = !inputAbilitato;
}

// Esposto soprattutto al banco e2e: la sola classe CSS non dimostra che i byte
// siano davvero fermati prima della UART.
export const inputTerminaliSonoAbilitati = () => inputAbilitato;

/** Il colore e' l'identita' della macchina: ciano il pc, ambra il server. */
function temaDi(uart) {
    const comune = {
        background: "#06141a", foreground: "#cdd9e5",
        selectionBackground: "#1d4d5c",
        black: "#22303a", red: "#f47067", green: "#57e389", yellow: "#e3b341",
        blue: "#6cb6ff", magenta: "#c9a0dc", cyan: "#5ad7e6", white: "#cdd9e5",
    };
    return uart === UART.server
        ? { ...comune, background: "#0d1117", cursor: "#e3b341" }
        : { ...comune, cursor: "#5ad7e6" };
}

/** Avvisa quando su quella seriale compare dell'output: serve al pallino della
 *  scheda nascosta, su schermo stretto. Uno dei tre bug di agosto era proprio
 *  questo — roba che succede senza che si veda. */
export function suOutput(uart, fn) {
    const t = terminali.get(uart);
    if (t) t.ascoltatoriOutput.push(fn);
}

/** Adattamento a mano: l'addon fit e' una dipendenza in piu' per due righe.
 *
 *  Attenzione al giro vizioso, che e' costato una serata: ridimensionare xterm
 *  cambia il contenuto del contenitore (per esempio fa comparire la barra di
 *  scorrimento), il contenitore cambia larghezza, un osservatore chiama di nuovo
 *  questa funzione, che ridimensiona di nuovo... e intanto ogni giro spara uno
 *  `stty` sul canale di verifica. Con due terminali il canale finiva sommerso da
 *  decine di comandi al secondo, e le richieste vere — `Verifica`, il seed —
 *  scadevano in coda dietro di loro. Il sintomo era «la verifica non ha risposto»,
 *  cioe' di nuovo un guasto che non esisteva.
 *
 *  Due guardie: non si rimanda mai la stessa misura, e comunque non piu' di una
 *  volta al secondo per terminale. */
export function adatta(contenitore, uart) {
    const t = terminali.get(uart);
    if (!t || !contenitore?.clientWidth) return;
    const p = t.term._core?._renderService?.dimensions?.css?.cell;
    if (!p?.width || !p?.height) return;

    const cols = Math.max(40, Math.floor(contenitore.clientWidth / p.width));
    const rows = Math.max(8, Math.floor(contenitore.clientHeight / p.height));
    if (cols === t.term.cols && rows === t.term.rows) return;

    t.term.resize(cols, rows);

    const misura = `${cols}x${rows}`;
    const ora = Date.now();
    if (misura === t.ultimaMisura || ora - (t.ultimoStty || 0) < 1000) return;
    t.ultimaMisura = misura;
    t.ultimoStty = ora;

    // La macchina non sa che la finestra e' cambiata. Glielo diciamo dal CANALE DI
    // SERVIZIO, non digitandolo nel terminale dell'utente: uno `stty` scritto su
    // ttyS0 comparirebbe a schermo e, se l'utente sta scrivendo, si mescolerebbe ai
    // suoi caratteri. E' la stessa ragione per cui esiste ttyS1.
    shell(`stty -F /dev/ttyS${uart} rows ${rows} cols ${cols}`).catch(() => {});
}

export const terminale = uart => terminali.get(uart)?.term;
export const contenitoreDi = uart => terminali.get(uart)?.contenitore;
export const uartAperte = () => [...terminali.keys()];

/** Svuota schermo e scrollback. Senza, dopo un ripristino lo stato torna indietro
 *  ma a schermo resta tutto com'era, e sembra non sia successo niente. */
export function pulisciTerminale(uart) {
    if (uart === undefined) terminali.forEach(t => t.term.reset());
    else terminali.get(uart)?.term.reset();
}

/** Una riga che si vede. Le azioni dei pulsanti agiscono sul filesystem, quindi
 *  senza un segno a schermo sembrano non fare nulla finche' non digiti `ls`. */
export function scriviNota(uart, testo, colore = 179) {
    const t = terminali.get(uart);
    if (!t) return;
    const larghezza = Math.max(20, (t.term.cols || 80) - 2);
    const riga = ` ${testo} `.padEnd(larghezza, "─");
    t.term.write(`\r\n\x1b[38;5;${colore}m${"─".repeat(2)}${riga}\x1b[0m\r\n`);
}

/** Un blocco informativo, smorzato, senza toccare la riga che si sta scrivendo. */
export function scriviBlocco(uart, testo) {
    const t = terminali.get(uart);
    if (!t || !testo) return;
    for (const r of String(testo).split("\n")) t.term.write(`\x1b[38;5;245m  ${r}\x1b[0m\r\n`);
}

export const svegliaTerminali = () => risveglia();
