// Le opzioni della macchina devono essere IDENTICHE ovunque.
//
// v86 ripristina uno snapshot solo se il costruttore ha le stesse opzioni di quando
// e' stato salvato. Le opzioni pero' vivono in piu' file — il sito, la build dello
// snapshot, i banchi di prova — e chi ne tocca uno solo produce un guasto che non
// somiglia alla sua causa: la macchina non riparte, oppure riparte senza il canale
// di verifica, e sembra rotta.
//
// E' successo davvero, con `disable_mouse`: senza, v86 registra un listener `wheel`
// non passivo su window e si mangia la rotellina, quindi il capitolo non si scorre
// piu'. La correzione era in un file solo, e questo test esiste perche' non basti
// mai piu' correggerne uno solo.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..");

// Le chiavi che DEVONO combaciare fra tutti i file (il resto — bios, wasm_path,
// filesystem — dipende legittimamente da chi avvia la macchina).
const CHIAVI = [
    "memory_size", "vga_memory_size", "uart1", "uart2",
    "disable_mouse", "disable_keyboard", "disable_speaker",
    "bzimage_initrd_from_filesystem", "cmdline",
];

const FILE = [
    "js/lab/machine.js",
    "lab/build-state.mjs",
    "tests/labs.mjs",
    "tools/spike.mjs",
    "tests/regressione-consegna.mjs",
];

/** Estrae il valore dichiarato per una chiave, come testo normalizzato. */
function valore(sorgente, chiave) {
    // `cmdline` puo' essere spezzato su piu' righe con una concatenazione
    const re = new RegExp(`\\b${chiave}\\s*:\\s*([^,\\n]*(?:\\n\\s*"[^"]*")*)`, "m");
    const m = sorgente.match(re);
    if (!m) return null;
    return m[1]
        .replace(/\/\/.*$/gm, "")     // via i commenti a fine riga
        .replace(/\s+/g, " ")
        .replace(/"\s*\+\s*"/g, "")   // ricompone le stringhe spezzate
        .trim();
}

const sorgenti = Object.fromEntries(
    FILE.map(f => [f, fs.readFileSync(path.join(ROOT, f), "utf8")]));

for (const chiave of CHIAVI) {
    test(`le opzioni della macchina combaciano ovunque: ${chiave}`, () => {
        const trovati = {};
        for (const f of FILE) {
            const v = valore(sorgenti[f], chiave);
            assert.ok(v !== null, `${f}: manca l'opzione ${chiave}`);
            trovati[f] = v;
        }
        const distinti = [...new Set(Object.values(trovati))];
        assert.equal(distinti.length, 1,
            `${chiave} non combacia:\n` +
            Object.entries(trovati).map(([f, v]) => `    ${f}: ${v}`).join("\n"));
    });
}
