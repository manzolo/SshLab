#!/usr/bin/env node
// e2e — smoke test su Chrome headless via DevTools Protocol. Zero dipendenze.
//
// Verifica la sola cosa che conta davvero: che la macchina parta e che il ciclo
// didattico (mondo seminato -> check che fallisce -> soluzione -> check che passa)
// funzioni su un Linux vero, dentro un browser vero.
//
// Uso:  node tools/e2e.mjs [url] [capitoli...]
//   es: node tools/e2e.mjs http://127.0.0.1:8802/ ch01 ch03
//   senza capitoli si provano TUTTI quelli dichiarati in content/index.js
//
// Il valore predefinito era `["ch01"]`, e il comando documentato — `npm run e2e`,
// quello che sta nel README, in AGENTS.md e in STATO.md — stampava «tutto verde»
// dopo aver toccato due esercizi su venticinque. Il problema non era che provasse
// poco: era che la misura si presentava piu' grande di quello che era, ed e'
// esattamente il difetto che questo lab passa dodici capitoli a insegnare a
// riconoscere.

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const URL_BASE = process.argv[2] || "http://127.0.0.1:8802/";
const CHIESTI = process.argv.slice(3);
// L'indice del corso e' l'unica fonte: un capitolo nuovo entra nell'e2e nello
// stesso momento in cui entra nel corso, senza che nessuno debba ricordarsi di
// aggiornare anche questo file.
const { CAPITOLI: INDICE } = await import(join(ROOT, "content/index.js"));
const CAPITOLI = CHIESTI.length ? CHIESTI : INDICE.map(c => c.id);
const PORTA = 9455;
const BIN = process.env.CHROME || "google-chrome";

const profilo = mkdtempSync(join(tmpdir(), "sshlab-e2e-"));
const chrome = spawn(BIN, [
    "--headless=new", "--disable-gpu", "--no-sandbox",
    `--user-data-dir=${profilo}`, `--remote-debugging-port=${PORTA}`,
    // v86 vive di setTimeout: senza questi, Chrome strozza i timer e la macchina non gira.
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--window-size=1400,900", "about:blank",
], { stdio: "ignore" });

const pulisci = () => { try { chrome.kill(); } catch {} try { rmSync(profilo, { recursive: true, force: true }); } catch {} };
process.on("exit", pulisci);

const dormi = ms => new Promise(r => setTimeout(r, ms));

async function attendiCdp() {
    for (let i = 0; i < 60; i++) {
        try { const r = await fetch(`http://127.0.0.1:${PORTA}/json/version`); if (r.ok) return r.json(); } catch {}
        await dormi(500);
    }
    throw new Error("Chrome non ha aperto il canale di debug");
}

let esitoFinale = 0;
const problemi = [];
const ok = (m) => console.log(`  ✓ ${m}`);
const ko = (m) => { console.log(`  ✗ ${m}`); problemi.push(m); esitoFinale = 1; };

(async () => {
    await attendiCdp();
    const t = await (await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: "PUT" })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    let id = 0; const attesa = new Map();
    const erroriJs = [];

    ws.onmessage = e => {
        const m = JSON.parse(e.data);
        if (m.id && attesa.has(m.id)) { attesa.get(m.id)(m.result); attesa.delete(m.id); return; }
        if (m.method === "Runtime.exceptionThrown") erroriJs.push(m.params.exceptionDetails.text + " " + (m.params.exceptionDetails.exception?.description || ""));
        if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
            erroriJs.push(m.params.args.map(a => a.value ?? a.description).join(" "));
    };
    const cmd = (metodo, params = {}) => new Promise(res => { const i = ++id; attesa.set(i, res); ws.send(JSON.stringify({ id: i, method: metodo, params })); });
    await new Promise(r => ws.onopen = r);
    await cmd("Runtime.enable"); await cmd("Page.enable");

    const val = async expr => (await cmd("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }))?.result?.value;

    console.log(`\nE2E — ${URL_BASE}`);
    const t0 = Date.now();
    // Osserva l'avvio dentro la pagina, a intervalli abbastanza stretti da vedere
    // anche un falso sblocco di pochi millisecondi. Campionare da CDP una volta al
    // secondo non basta: era proprio cosi' che la vecchia regressione lo perdeva.
    await cmd("Page.addScriptToEvaluateOnNewDocument", { source: `
        window.__sshlabAvvio = { sbloccato: false, ribloccato: false };
        window.__sshlabAvvio.timer = setInterval(() => {
            const L = window.__sshlab;
            if (!L) return;
            const input = L.term.inputTerminaliSonoAbilitati();
            const pausa = document.getElementById('pannelloLab')?.classList.contains('preparazione');
            if (input) window.__sshlabAvvio.sbloccato = true;
            if (window.__sshlabAvvio.sbloccato && pausa)
                window.__sshlabAvvio.ribloccato = true;
        }, 10);
    ` });
    await cmd("Page.navigate", { url: URL_BASE });
    await cmd("Page.bringToFront");

    // 1) la macchina parte E il primo mondo e' pronto. `labStato.pronta` da solo
    // in passato intercettava il breve istante fra lo snapshot e il seed: il test
    // dichiarava pronta la pagina mentre subito dopo i terminali si bloccavano.
    let pronta = false;
    let inputPrematuro = false;
    for (let i = 0; i < 90; i++) {
        await dormi(1000);
        const fase = JSON.parse(await val(`JSON.stringify((() => {
            if (!window.__sshlab) return { caricata: false };
            const inPreparazione = document.getElementById('pannelloLab').classList.contains('preparazione');
            const input = window.__sshlab.term.inputTerminaliSonoAbilitati();
            const statoPronto = document.getElementById('labStato').classList.contains('pronta');
            return { caricata: true, inPreparazione, input,
                pronta: statoPronto && !inPreparazione && input };
        })())`) || "{}");
        if (fase.caricata && fase.input && !fase.pronta) inputPrematuro = true;
        pronta = !!fase.pronta;
        if (pronta) break;
        const errore = await val("document.getElementById('labStato').classList.contains('errore')");
        if (errore) break;
    }
    pronta ? ok(`macchina ed esercizio pronti in ${((Date.now() - t0) / 1000).toFixed(1)} s`) : ko("la macchina non è diventata pronta");
    const avvio = JSON.parse(await val(`JSON.stringify((() => {
        clearInterval(window.__sshlabAvvio?.timer);
        return window.__sshlabAvvio || {};
    })())`) || "{}");
    (inputPrematuro || avvio.ribloccato) ? ko("i terminali sono diventati scrivibili prima della fine del seed")
        : ok("terminali bloccati fino alla fine del primo seed");
    if (!pronta) { console.log(`\n${problemi.length} problemi`); process.exit(1); }

    // 2) i terminali hanno scritto qualcosa. TUTTI E DUE, ed e' il punto: un lab a
    // due macchine dove la seconda resta nera e' un lab rotto, e un controllo
    // complessivo ("ci sono delle righe") non se ne accorgerebbe, perche' quelle
    // della prima gli bastano per passare.
    const righePc  = await val("document.querySelectorAll('#terminalePc .xterm-rows > div').length");
    const righeSrv = await val("document.querySelectorAll('#terminaleServer .xterm-rows > div').length");
    righePc  > 0 ? ok(`terminale del pc attivo (${righePc} righe)`)      : ko("il terminale del pc non ha righe");
    righeSrv > 0 ? ok(`terminale del server attivo (${righeSrv} righe)`) : ko("il terminale del server non ha righe");

    // ...e devono essere due macchine DIVERSE: se per un errore di cablaggio le due
    // xterm finissero sulla stessa seriale, a schermo sembrerebbe tutto a posto e il
    // lab insegnerebbe una bugia.
    const dueVere = await val(`(async () => {
        const L = window.__sshlab;
        const a = await L.agente.shell("ip -4 -o addr show veth-pc | awk '{print $4}'");
        const b = await L.agente.shell("/run/lab/entra-server ip -4 -o addr show veth-srv | awk '{print $4}'");
        return JSON.stringify([(a.out || "").trim(), (b.out || "").trim()]);
    })()`);
    const [ipPc, ipSrv] = JSON.parse(dueVere || '["",""]');
    (ipPc && ipSrv && ipPc !== ipSrv)
        ? ok(`due host distinti: ${ipPc} e ${ipSrv}`)
        : ko(`i due host non hanno indirizzi distinti: "${ipPc}" / "${ipSrv}"`);

    // Il seed dell'esercizio successivo puo' durare diversi secondi. Il vecchio
    // terminale non deve accettare comandi destinati a un mondo che sta per
    // essere cancellato: segnale visivo e blocco reale devono coincidere.
    const cambioGrezz = await val(`(async () => {
        document.querySelector('[data-es="e2"] .es-testa').click();
        let visto = false, inputFermo = false;
        const limite = Date.now() + 30000;
        while (Date.now() < limite) {
            const occupato = document.getElementById('pannelloLab').classList.contains('preparazione');
            if (occupato) {
                visto = true;
                if (!window.__sshlab.term.inputTerminaliSonoAbilitati()) inputFermo = true;
            }
            if (visto && !occupato) break;
            await new Promise(r => setTimeout(r, 20));
        }
        return JSON.stringify({ visto, inputFermo,
            riattivato: window.__sshlab.term.inputTerminaliSonoAbilitati() });
    })()`);
    const cambio = JSON.parse(cambioGrezz || "{}");
    (cambio.visto && cambio.inputFermo && cambio.riattivato)
        ? ok("cambio esercizio: terminali in pausa durante il seed e riattivati dopo")
        : ko(`cambio esercizio non atomico: ${cambioGrezz}`);

    // 3) il ciclo didattico, su OGNI capitolo del corso (vedi in testa al file)
    console.log(`  · ${CAPITOLI.length} capitoli da provare: ${CAPITOLI.join(" ")}`);
    for (const capId of CAPITOLI) {
        const esito = await val(`(async () => {
          try {
            const L = window.__sshlab;
            const cap = await L.capitolo(${JSON.stringify(capId)});
            const risultati = [];
            for (const es of cap.exercises || []) {
                const seme = 424242;
                await L.runner.preparaEsercizio(cap.id, es.id, seme);
                const prima = await L.runner.verificaEsercizio(cap.id, es.id);
                // la soluzione di riferimento e il barare passano dal canale di verifica,
                // mai dal terminale: qui simuliamo l'utente che risolve
                await L.agente.scrivi('/opt/lab/' + cap.id + '/' + es.id + '/solution.sh',
                    await (await fetch('./content/' + cap.id + '/' + es.id + '/solution.sh')).text(), '755');
                await L.agente.risolvi(cap.id + '/' + es.id);
                const dopo = await L.runner.verificaEsercizio(cap.id, es.id);
                risultati.push({ es: es.id, prima: prima.superato, dopo: dopo.superato, out: dopo.grezzo });
            }
            return JSON.stringify(risultati);
          } catch (e) {
            // Senza questo, un errore qui dentro tornava come oggetto e si
            // presentava come '"[object Object]" is not valid JSON': un messaggio
            // che parla del messaggero e non dice niente del guasto.
            return JSON.stringify([{ errore: (e && e.message) || String(e) }]);
          }
        })()`);
        const righeEsito = JSON.parse(typeof esito === "string" ? esito : "[]");
        if (righeEsito.length === 1 && righeEsito[0].errore) ko(`${capId}: ${righeEsito[0].errore}`);
        for (const r of righeEsito.filter(x => !x.errore)) {
            if (r.prima) ko(`${capId}.${r.es}: lo stato iniziale passa già (l'esercizio è vuoto)`);
            else ok(`${capId}.${r.es}: parte non superato`);
            if (r.dopo) ok(`${capId}.${r.es}: la soluzione di riferimento passa`);
            else ko(`${capId}.${r.es}: la soluzione NON passa — ${(r.out || "").replace(/\n/g, " | ").slice(0, 200)}`);
        }
    }

    // 4) nessun errore JS
    erroriJs.length ? ko(`${erroriJs.length} errori JS: ${erroriJs.slice(0, 3).join(" / ")}`) : ok("nessun errore JS");

    console.log(problemi.length ? `\n${problemi.length} problemi\n` : "\ntutto verde\n");
    ws.close();
    process.exit(esitoFinale);
})().catch(e => { console.error("e2e fallito:", e.message); process.exit(1); });
