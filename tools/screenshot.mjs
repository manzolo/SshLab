#!/usr/bin/env node
// screenshot.mjs — le immagini del README, generate invece che ritagliate a mano.
//
// Chrome headless via DevTools Protocol, zero dipendenze, come gli altri strumenti
// di questo repo. Il punto di farlo con uno script e non con un ritaglio: quando
// l'interfaccia cambia, le immagini si rifanno con un comando invece di invecchiare
// in silenzio sul README — che e' la prima cosa che vede chi arriva.
//
// Uso:  npm run serve   (in un'altra finestra)
//       node tools/screenshot.mjs [url]
//
// Produce in screenshots/:
//   banco.png     le due macchine al lavoro, a schermo intero
//   handshake.png il primo incontro: l'impronta del server, letta da tutti e due i lati
//   stretto.png   la stessa pagina su schermo stretto, dove i terminali diventano schede

import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import url from "node:url";

const URL_BASE = process.argv[2] || "http://127.0.0.1:8802/";
const ROOT = join(url.fileURLToPath(new URL(".", import.meta.url)), "..");
const FUORI = join(ROOT, "screenshots");
const PORTA = 9533;
const BIN = process.env.CHROME || "google-chrome";

mkdirSync(FUORI, { recursive: true });
const profilo = mkdtempSync(join(tmpdir(), "sshlab-shot-"));
const chrome = spawn(BIN, [
    "--headless=new", "--disable-gpu", "--no-sandbox",
    `--user-data-dir=${profilo}`, `--remote-debugging-port=${PORTA}`,
    // v86 vive di setTimeout: senza questi Chrome strozza i timer quando la finestra
    // non e' in primo piano, e la macchina emulata rallenta fino a sembrare ferma.
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--hide-scrollbars",
    "about:blank",
], { stdio: "ignore" });
process.on("exit", () => {
    try { chrome.kill(); } catch {}
    // il profilo di Chrome non si lascia sempre cancellare al primo colpo
    try { rmSync(profilo, { recursive: true, force: true }); } catch {}
});

const dormi = ms => new Promise(r => setTimeout(r, ms));

for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORTA}/json/version`); if (r.ok) break; } catch {}
    await dormi(500);
}
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

async function scatta(nome) {
    const r = await cmd("Page.captureScreenshot", { format: "png" });
    const dove = join(FUORI, nome);
    writeFileSync(dove, Buffer.from(r.data, "base64"));
    console.log(`  ${nome}`);
}

/** Aspetta che le due macchine siano pronte. */
async function attendiMacchine() {
    for (let i = 0; i < 120; i++) {
        if (await val("!!(window.__sshlab && document.getElementById('labStato').classList.contains('pronta'))")) return true;
        await dormi(1000);
    }
    throw new Error("le macchine non sono diventate pronte");
}

/** Scrive nel terminale come lo farebbe una persona, un carattere per volta: la
 *  seriale emulata ha una FIFO piccola e nessun controllo di flusso, e una riga
 *  intera riversata in un colpo solo perde dei pezzi. */
const digita = (uart, testo) => val(`(async () => {
    const m = await import('./js/lab/machine.js');
    const pausa = ms => new Promise(r => setTimeout(r, ms));
    for (const c of ${JSON.stringify(testo)}) {
        m.macchina().serial_send_bytes(${uart}, new TextEncoder().encode(c));
        await pausa(5);
    }
    return 'ok';
})()`);

const srvIp = () => val(`(async () => {
    const a = await import('./js/lab/agent.js');
    return ((await a.shell("cat /run/lab/srv_ip")).out || "").trim();
})()`);

console.log(`schermate da ${URL_BASE} →  screenshots/`);

// ---------------------------------------------------------------- 1. il banco
await cmd("Emulation.setDeviceMetricsOverride", { width: 1500, height: 950, deviceScaleFactor: 2, mobile: false });
await cmd("Page.navigate", { url: URL_BASE });
await attendiMacchine();
await val("document.getElementById('velo').hidden = true; 'ok'");

// Si aspetta che il MONDO sia quello definitivo prima di leggere l'indirizzo: il
// seed del primo esercizio rimescola la rete, e chiedendolo troppo presto si
// otterrebbe quello dello snapshot — cioe' si fotograferebbe un `ping` verso una
// macchina che non esiste piu'. L'etichetta smette di essere "…" esattamente
// quando il mondo e' pronto, quindi e' lei il segnale.
for (let i = 0; i < 40; i++) {
    if ((await val("document.getElementById('ipPc').textContent")) !== "…") break;
    await dormi(500);
}
await dormi(1200);

const ip = await srvIp();
await digita(2, "hostname; id -un\n");
await dormi(1500);
await digita(2, "ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub\n");
await dormi(2200);
await digita(0, `ip -4 -o addr show veth-pc | awk '{print $4}'\n`);
await dormi(1500);
await digita(0, `ping -c 2 ${ip}\n`);
await dormi(4000);
await scatta("banco.png");

// ---------------------------------------------------------------- 2. l'handshake
await digita(0, `ssh deploy@${ip}\n`);
await dormi(6000);
// si porta in vista il laboratorio, che e' il soggetto di questa immagine
await val("document.getElementById('pannelloLab').scrollIntoView({block:'center'}); 'ok'");
await dormi(700);
await scatta("handshake.png");

// ---------------------------------------------------------------- 3. schermo stretto
await digita(0, "\x03");           // Ctrl-C: via la domanda del TOFU, non e' questa la scena
await dormi(1200);
await cmd("Emulation.setDeviceMetricsOverride", { width: 620, height: 900, deviceScaleFactor: 2, mobile: false });
await dormi(1800);
await val("document.getElementById('pannelloLab').scrollIntoView({block:'start'}); 'ok'");
await dormi(700);
await scatta("stretto.png");

console.log("fatte.");
process.exit(0);
