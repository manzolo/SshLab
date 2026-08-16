// agent.js — il canale di verifica, su ttyS1.
//
// Il terminale dell'utente (ttyS0) non viene mai toccato: niente comandi iniettati
// che finiscono dentro `vi`, niente marker da filtrare, niente history sporcata.
// Misurato: durante una verifica completa, sul terminale compaiono 0 byte.

import { macchina } from "./machine.js";

// Tempi piu' larghi di quelli del lab fratello, per una ragione precisa: la' un
// check guardava dei file, qui APRE UNA CONNESSIONE SSH. Su una CPU emulata un
// handshake completo costa una decina di secondi, e una soluzione che ne fa due di
// fila piu' una generazione di chiave arriva tranquillamente a mezzo minuto.
// Timeout stretti non proteggono da niente: trasformano un'attesa legittima in
// «la verifica non ha risposto», cioe' in un guasto che non esiste.
const TIMEOUT = { ping: 5000, write: 30000, check: 60000, seed: 90000, sh: 90000, reset: 60000, solve: 120000 };

let inizializzato = false;
let buffer = "";
let prossimoId = 1;
const inAttesa = new Map();
let prontoResolve;
const pronto = new Promise(r => prontoResolve = r);

function inizializza() {
    if (inizializzato) return;
    inizializzato = true;
    macchina().add_listener("serial1-output-byte", b => {
        buffer += String.fromCharCode(b);
        let i;
        while ((i = buffer.indexOf("\n")) >= 0) {
            const riga = buffer.slice(0, i).trim();
            buffer = buffer.slice(i + 1);
            if (!riga) continue;
            let msg;
            try { msg = JSON.parse(riga); } catch { continue; }
            if (msg.ev === "ready") { prontoResolve(msg.v); continue; }
            const r = inAttesa.get(msg.id);
            // Le risposte con id diverso da quello atteso si scartano: protegge
            // dalle risposte in ritardo arrivate dopo un timeout.
            if (r) { inAttesa.delete(msg.id); r(msg); }
        }
    });
    // L'agente ha gia' annunciato "ready" PRIMA dello snapshot, quindi quel messaggio
    // non arrivera' mai: un ping conferma che e' vivo nello stato ripristinato.
    chiedi("ping").then(() => prontoResolve(1)).catch(() => {});
}

function chiedi(op, ...arg) {
    inizializza();
    const id = prossimoId++;
    const riga = `${id} ${op}${arg.length ? " " + arg.join(" ") : ""}\n`;
    const ms = TIMEOUT[op] ?? 15000;
    return new Promise((res, rej) => {
        inAttesa.set(id, res);
        macchina().serial_send_bytes(1, new TextEncoder().encode(riga));
        setTimeout(() => {
            if (inAttesa.delete(id)) rej(new Error(`la verifica non ha risposto (${op})`));
        }, ms);
    });
}

const b64 = testo => btoa(String.fromCharCode(...new TextEncoder().encode(testo)));

export const attendiAgente = () => { inizializza(); return pronto; };

export const ping = () => chiedi("ping");

/** Scrive un file nel guest. Fino a ~48 KB per file: oltre, spezzalo. */
export const scrivi = (percorso, contenuto, modo = "644") =>
    chiedi("write", percorso, modo, b64(contenuto));

/** Prepara il mondo dell'esercizio con un seme dato. */
export const semina = (dir, seme) => chiedi("seed", dir, seme);

/** Verifica. Restituisce {ok, code, out} con le righe EDU CHECK/FACT/RESULT. */
export const verifica = dir => chiedi("check", dir);

/** Ricomincia da capo: stesso seme, stesso mondo. */
export const ricomincia = dir => chiedi("reset", dir);

/** Esegue la soluzione di riferimento. Usata solo dai test, mai dalla UI. */
export const risolvi = dir => chiedi("solve", dir);

/** Comando arbitrario nel guest, fuori dal terminale visibile. Per i test. */
export const shell = cmd => chiedi("sh", cmd);

// --- lettura del verdetto ---------------------------------------------------

/** Trasforma l'output neutro di check.sh in qualcosa che la UI sa disegnare. */
export function leggiVerdetto(out) {
    const controlli = [], fatti = [];
    let risultato = null;
    for (const riga of (out || "").split("\n")) {
        let m;
        if ((m = riga.match(/^EDU CHECK (\S+) (PASS|FAIL)(.*)$/))) {
            const extra = {};
            for (const kv of m[3].matchAll(/(\w+)=(\S+)/g)) extra[kv[1]] = kv[2];
            controlli.push({ id: m[1], ok: m[2] === "PASS", ...extra });
        } else if ((m = riga.match(/^EDU FACT (\S+) (.*)$/))) {
            fatti.push({ chiave: m[1], valore: m[2] });
        } else if ((m = riga.match(/^EDU RESULT (\d+)\/(\d+)$/))) {
            risultato = { fatti: +m[1], totale: +m[2] };
        }
    }
    return { controlli, fatti, risultato };
}
