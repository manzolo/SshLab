#!/usr/bin/env node
// Verifica che i pulsanti del laboratorio FACCIANO VEDERE quello che fanno.
//
// Segnalazione di Andrea (2026-08-16): «nuovo mondo e ricomincia l'esercizio mi
// sembrano non fare niente, e reimposta la macchina blocca il browser qualche
// secondo ma non succede niente che faccia sembrare un reset».
//
// Avevano ragione a metà: il lavoro lo facevano (sul filesystem della macchina),
// ma senza un segno a schermo era indistinguibile dal non fare nulla. Questo test
// clicca i pulsanti veri in un browser vero e pretende che il terminale cambi.
//
// Uso:  node tools/e2e-pulsanti.mjs [url]

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_BASE = process.argv[2] || "http://127.0.0.1:8802/";
const PORTA = 9466;
const profilo = mkdtempSync(join(tmpdir(), "linuxlab-btn-"));

const chrome = spawn(process.env.CHROME || "google-chrome", [
    "--headless=new", "--disable-gpu", "--no-sandbox",
    `--user-data-dir=${profilo}`, `--remote-debugging-port=${PORTA}`,
    "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding", "--window-size=1500,950", "about:blank",
], { stdio: "ignore" });
const pulisci = () => { try { chrome.kill(); } catch {} try { rmSync(profilo, { recursive: true, force: true }); } catch {} };
process.on("exit", pulisci);

const dormi = ms => new Promise(r => setTimeout(r, ms));
let guai = 0;
const ok = m => console.log(`  ✓ ${m}`);
const ko = m => { console.log(`  ✗ ${m}`); guai++; };

for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORTA}/json/version`)).ok) break; } catch {}
    await dormi(500);
}
const t = await (await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const att = new Map();
const errori = [];
ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && att.has(m.id)) { att.get(m.id)(m.result); att.delete(m.id); return; }
    if (m.method === "Runtime.exceptionThrown") errori.push(m.params.exceptionDetails.text);
};
const cmd = (metodo, params = {}) => new Promise(r => { const i = ++id; att.set(i, r); ws.send(JSON.stringify({ id: i, method: metodo, params })); });
await new Promise(r => ws.onopen = r);
await cmd("Runtime.enable"); await cmd("Page.enable");
await cmd("Network.enable"); await cmd("Network.setCacheDisabled", { cacheDisabled: true });
const val = async e => (await cmd("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;

console.log(`\npulsanti del laboratorio — ${URL_BASE}\n`);

await cmd("Page.navigate", { url: `${URL_BASE}?lang=it&ch=2` });
await cmd("Page.bringToFront");
await dormi(2000);
// niente overlay dell'introduzione, che coprirebbe i pulsanti
await val(`localStorage.setItem('linuxlab.introSeen','true')`);
await cmd("Page.reload", { ignoreCache: true });

let pronta = false;
for (let i = 0; i < 90; i++) {
    await dormi(1000);
    pronta = await val("!!document.getElementById('labStato')?.classList.contains('pronta')");
    if (pronta) break;
}
pronta ? ok("macchina pronta") : ko("la macchina non è diventata pronta");
if (!pronta) { console.log(`\n${guai} problemi\n`); process.exit(1); }

// I pulsanti devono ACCENDERSI quando il mondo è pronto: finché sono spenti non
// possono ingannare, ed è la correzione del bug segnalato da Andrea.
let attivi = false;
for (let i = 0; i < 60; i++) {
    await dormi(500);
    attivi = await val(`!![...document.querySelectorAll('.es.aperto .es-barra button')].length &&
        [...document.querySelectorAll('.es.aperto .es-barra button')].every(b => !b.disabled)`);
    if (attivi) break;
}
attivi ? ok("i pulsanti si accendono solo quando il mondo è pronto")
       : ko("i pulsanti non si sono mai accesi");

// testo attualmente visibile nel terminale
const testoTerminale = () => val(`(() => {
    const r = document.querySelectorAll('.host-schermo .xterm-rows > div');
    return Array.from(r).map(d => d.textContent).join('\\n').replace(/\\s+$/,'');
})()`);

const clicca = async (sel) => val(`(() => {
    const b = [...document.querySelectorAll('${sel}')].find(x => !x.disabled);
    if (!b) return "(nessun pulsante)"; const t = b.textContent; b.click(); return t;
})()`);

// ---- Nuovo mondo -----------------------------------------------------------
let prima = await testoTerminale();
let fatto = await clicca(".es.aperto .es-barra .btn.mini:nth-child(3)");
fatto === "Nuovo mondo" ? ok("cliccato «Nuovo mondo»") : ko(`cliccato il pulsante sbagliato: ${fatto}`);
for (let i = 1; i <= 50; i++) {
    await dormi(500);
    if ((await val(`globalThis.__note||0`)) > 0) break;
    const t2 = await testoTerminale();
    if (process.env.TRACCIA) console.log(`   t+${i*0.5}s: ${JSON.stringify(t2.slice(-90))}`);
}
let dopo = await testoTerminale();
if (dopo.includes("Nuovo mondo")) ok("«Nuovo mondo» lascia un segno nel terminale");
else ko(`«Nuovo mondo» non ha scritto niente: ${JSON.stringify(dopo.slice(-160))}`);
if (dopo.length > prima.length) ok("il contenuto del nuovo mondo è stato mostrato");
else ko("nessun elenco del nuovo mondo");

// ---- Ricomincia l'esercizio ------------------------------------------------
prima = await testoTerminale();
fatto = await clicca(".es.aperto .es-barra .btn.mini:nth-child(2)");
fatto ? ok(`cliccato «${fatto}»`) : ko("pulsante «Ricomincia» non trovato");
for (let i = 0; i < 40; i++) { await dormi(500); if ((await val(`globalThis.__note||0`)) > 1) break; }
dopo = await testoTerminale();
dopo.includes("Ricomincia") ? ok("«Ricomincia» lascia un segno nel terminale")
                            : ko(`«Ricomincia» non ha scritto niente: ${JSON.stringify(dopo.slice(-160))}`);

// ---- Reimposta la macchina -------------------------------------------------
prima = await testoTerminale();
prima.length > 40 ? ok(`il terminale ha ${prima.split("\n").filter(Boolean).length} righe di storia`) : null;
fatto = await clicca("#btnReimposta");
fatto ? ok(`cliccato «${fatto}»`) : ko("pulsante «Reimposta» non trovato");
await dormi(9000);
dopo = await testoTerminale();
if (dopo.includes("Reimposta")) ok("«Reimposta» lascia un segno nel terminale");
else ko(`«Reimposta» non ha scritto niente: ${JSON.stringify(dopo.slice(-160))}`);
if (dopo.split("\n").filter(Boolean).length < prima.split("\n").filter(Boolean).length)
    ok("lo schermo è stato svuotato: il reset si VEDE");
else ko("lo schermo non è stato svuotato: sembra ancora che non sia successo niente");

// dopo il reset la macchina deve essere di nuovo utilizzabile
const risposta = await val(`window.__sshlab.agente.ping().then(r => r.out).catch(e => 'ERRORE ' + e.message)`);
/pong/.test(risposta || "") ? ok("dopo il reset la macchina risponde ancora")
                            : ko(`dopo il reset la macchina non risponde: ${risposta}`);

errori.length ? ko(`${errori.length} errori JS: ${errori.slice(0, 2).join(" / ")}`) : ok("nessun errore JS");

console.log(guai ? `\n${guai} problemi\n` : "\ntutto verde\n");
ws.close();
process.exit(guai ? 1 : 0);
