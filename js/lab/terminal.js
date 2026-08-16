// terminal.js — xterm.js attaccato a ttyS0. Nient'altro: il canale di verifica
// vive altrove (agent.js), e questo terminale e' solo dell'utente.

import { macchina, risveglia } from "./machine.js";
import { shell } from "./agent.js";

let term = null;

export function creaTerminale(contenitore) {
    if (term) { term.open(contenitore); adatta(contenitore); return term; }

    term = new window.Terminal({
        convertEol: true,
        cursorBlink: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
        fontSize: 13,
        scrollback: 4000,
        theme: {
            background: "#06141a", foreground: "#cdd9e5", cursor: "#5ad7e6",
            selectionBackground: "#1d4d5c",
            black: "#22303a", red: "#f47067", green: "#57e389", yellow: "#e3b341",
            blue: "#6cb6ff", magenta: "#c9a0dc", cyan: "#5ad7e6", white: "#cdd9e5",
        },
    });
    term.open(contenitore);
    term.onData(d => macchina()?.serial0_send(d));
    macchina().add_listener("serial0-output-byte", b => term.write(String.fromCharCode(b)));
    adatta(contenitore);
    return term;
}

/** Adattamento a mano: l'addon fit e' una dipendenza in piu' per una formula di due righe. */
export function adatta(contenitore) {
    if (!term || !contenitore?.clientWidth) return;
    const p = term._core?._renderService?.dimensions?.css?.cell;
    if (!p?.width || !p?.height) return;
    const cols = Math.max(40, Math.floor(contenitore.clientWidth / p.width));
    const rows = Math.max(10, Math.floor(contenitore.clientHeight / p.height));
    if (cols !== term.cols || rows !== term.rows) {
        term.resize(cols, rows);
        // La macchina non sa che la finestra e' cambiata. Glielo diciamo dal CANALE
        // DI SERVIZIO, non digitandolo nel terminale dell'utente: un `stty` scritto
        // su ttyS0 comparirebbe a schermo (e se l'utente sta scrivendo, si mescola
        // ai suoi caratteri). E' la stessa ragione per cui esiste ttyS1.
        shell(`stty -F /dev/ttyS0 rows ${rows} cols ${cols}`).catch(() => {});
    }
}

export const terminale = () => term;

/** Svuota lo schermo e lo scrollback. Serve al "Reimposta la macchina": senza,
 *  lo stato torna indietro ma a schermo resta tutto com'era, e sembra non sia
 *  successo niente. */
export function pulisciTerminale() { term?.reset(); }

/** Una riga che si vede. Le azioni dei pulsanti agiscono sul filesystem, quindi
 *  senza un segno a schermo sembrano non fare nulla finche' non digiti `ls`. */
export function scriviNota(testo, colore = 179) {
    if (!term) return;
    const larghezza = Math.max(20, (term.cols || 80) - 2);
    const riga = ` ${testo} `.padEnd(larghezza, "─");
    term.write(`\r\n\x1b[38;5;${colore}m${"─".repeat(2)}${riga}\x1b[0m\r\n`);
}
/** Scrive un blocco informativo nel terminale, smorzato, senza toccare la riga
 *  che l'utente sta scrivendo. */
export function scriviBlocco(testo) {
    if (!term || !testo) return;
    for (const r of String(testo).split("\n")) term.write(`\x1b[38;5;245m  ${r}\x1b[0m\r\n`);
}

export const svegliaTerminale = () => risveglia();
