#!/usr/bin/env node
// L'intestazione, sul telefono.
//
// La barra in cima e' `flex-wrap: wrap` con il marchio a `flex: 1; min-width: 0`.
// Quel `min-width: 0` serve — senza, il marchio non si stringe e i pulsanti
// finiscono fuori schermo — ma ha un effetto che non si vede sul portatile: il
// marchio si stringe SOTTO la larghezza del suo testo, e il testo che avanza non
// sparisce, esce dal riquadro. Su un telefono da 390px si leggeva "SSH Lab"
// per meta' dietro il pulsante "Capitoli", e la sigla si spezzava sul trattino,
// "EDU-" sopra e "SSH" sotto, dentro il rettangolo azzurro.
//
// Un guasto cosi' non lo vede nessun test che legga il DOM: gli elementi ci sono
// tutti, hanno il testo giusto, rispondono al clic. Si vede solo misurando DOVE
// sono finiti. Qui si misura questo, alle larghezze vere dei telefoni e in tutte
// e due le lingue — l'inglese e' il caso peggiore, "Chapters" e "Basics" sono
// piu' larghi di "Capitoli" e "Basi".
//
// Uso:  npm run serve   (in un'altra finestra)
//       node tests/regressione-intestazione.mjs [url]

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_BASE = process.argv[2] || "http://127.0.0.1:8802/";
const PORTA = 9557;
const BIN = process.env.CHROME || "google-chrome";
// Da 300 (il piu' stretto che si incontri davvero) fino oltre il punto di rottura,
// a passi piccoli: il guasto viveva in una fascia di ottanta pixel, e a saltare di
// centoventi non si sarebbe visto.
const LARGHEZZE = [];
for (let w = 300; w <= 900; w += 20) LARGHEZZE.push(w);
// E in mezzo le larghezze vere dei telefoni in circolazione, che il passo di venti
// salta: il 390 dell'iPhone e il 412 degli Android e' proprio dove si vedeva.
for (const w of [360, 375, 390, 393, 412, 414, 430]) if (!LARGHEZZE.includes(w)) LARGHEZZE.push(w);
LARGHEZZE.sort((a, b) => a - b);

const profilo = mkdtempSync(join(tmpdir(), "sshlab-testa-"));
const chrome = spawn(BIN, [
    "--headless=new", "--disable-gpu", "--no-sandbox",
    `--user-data-dir=${profilo}`, `--remote-debugging-port=${PORTA}`,
    "--hide-scrollbars", "about:blank",
], { stdio: "ignore" });
process.on("exit", () => {
    try { chrome.kill(); } catch {}
    try { rmSync(profilo, { recursive: true, force: true }); } catch {}
});

const pausa = ms => new Promise(r => setTimeout(r, ms));

let vivo = false;
for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORTA}/json/version`); if (r.ok) { vivo = true; break; } } catch {}
    await pausa(500);
}
if (!vivo) { console.error("Chrome non risponde sul DevTools Protocol"); process.exit(1); }

const scheda = await (await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(scheda.webSocketDebuggerUrl);
let id = 0; const attesa = new Map();
ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && attesa.has(m.id)) { attesa.get(m.id)(m.result); attesa.delete(m.id); }
};
const cmd = (metodo, params = {}) => new Promise(res => {
    const i = ++id; attesa.set(i, res);
    ws.send(JSON.stringify({ id: i, method: metodo, params }));
});
await new Promise(r => ws.onopen = r);
await cmd("Runtime.enable"); await cmd("Page.enable");
const val = async e => (await cmd("Runtime.evaluate",
    { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;

// Tre misure, tutte e tre su dove finiscono i pixel e non su cosa dice il DOM.
const MISURA = `(() => {
    const barra   = document.querySelector('.barra');
    const marchio = document.querySelector('.marchio');
    const azioni  = document.querySelector('.azioni');
    const sigla   = document.querySelector('.sigla');
    const b  = barra.getBoundingClientRect();
    const rA = azioni.getBoundingClientRect();
    const visibili = [...marchio.children].filter(e => getComputedStyle(e).display !== 'none');
    const sopra = visibili.filter(e => {
        const r = e.getBoundingClientRect();
        return r.right > rA.left + 1 && r.bottom > rA.top + 1 && r.top < rA.bottom - 1;
    }).map(e => e.className);
    const fuori = [...barra.querySelectorAll('*')].filter(e =>
        e.getBoundingClientRect().right > b.right + 1).map(e => e.className || e.tagName);
    // Quante righe di testo ha la sigla. Non si guarda il rettangolo dell'elemento:
    // e' un figlio di un flex, quindi e' un blocco e resta UN rettangolo solo anche
    // quando il testo dentro va a capo (misurato: alto 30px invece di 19, ma sempre
    // uno). Si misura il testo, con un Range, che di rettangoli ne da' uno per riga:
    // e' cosi' che si vede "EDU-" sopra e "SSH" sotto senza guardare l'immagine.
    const riga = document.createRange(); riga.selectNodeContents(sigla);
    const siglaSpezzata = riga.getClientRects().length > 1;
    return JSON.stringify({ sopra, fuori, siglaSpezzata, altezza: Math.round(b.height) });
})()`;

const guai = [];
const ok = m => console.log(`  OK   ${m}`);
const ko = m => { console.log(`  KO   ${m}`); guai.push(m); };

console.log(`intestazione da ${URL_BASE}`);

for (const lang of ["it", "en"]) {
    await cmd("Page.navigate", { url: `${URL_BASE}?lang=${lang}` });
    await pausa(2500);

    const sovrapposte = [], traboccate = [], spezzate = [];
    for (const w of LARGHEZZE) {
        await cmd("Emulation.setDeviceMetricsOverride",
            { width: w, height: 760, deviceScaleFactor: 1, mobile: true });
        await pausa(120);
        const m = JSON.parse(await val(MISURA));
        if (m.sopra.length) sovrapposte.push(`${w}px (${m.sopra.join(", ")})`);
        if (m.fuori.length) traboccate.push(`${w}px (${m.fuori.join(", ")})`);
        if (m.siglaSpezzata) spezzate.push(`${w}px`);
    }

    const q = LARGHEZZE.length;
    if (!sovrapposte.length) ok(`${lang}: il marchio non finisce mai sotto i pulsanti (${q} larghezze)`);
    else ko(`${lang}: marchio sotto i pulsanti a ${sovrapposte.join(", ")}`);

    if (!traboccate.length) ok(`${lang}: niente esce dalla barra (${q} larghezze)`);
    else ko(`${lang}: fuori dalla barra a ${traboccate.join(", ")}`);

    if (!spezzate.length) ok(`${lang}: la sigla EDU-SSH resta su una riga (${q} larghezze)`);
    else ko(`${lang}: sigla spezzata a ${spezzate.join(", ")}`);
}

console.log(guai.length ? `\n${guai.length} guai.` : "\nTutto verde.");
process.exit(guai.length ? 1 : 0);
