#!/usr/bin/env node
// Il banco di prova degli esercizi. Avvia la VERA macchina (v86 in Node, dallo
// snapshot) ed esegue su ogni esercizio le cinque asserzioni della collana:
//
//   1. seed -> check              deve FALLIRE   (lo stato iniziale non passa gia')
//   2. seed -> solution -> check  deve PASSARE   (la soluzione di riferimento e' corretta)
//   3. seed -> cheat -> check     deve FALLIRE   (l'anti-trucco funziona)
//   4. la soluzione passa su TRE semi diversi    (niente e' cablato sul mondo)
//   5. ogni script e' un file che esiste ed e' POSIX
//
// Se questi passano, il modello didattico regge. Se un giorno cambio l'immagine,
// me ne accorgo subito.
//
// Uso:  node tests/labs.mjs [ch01 ch02 ...]

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const QUI = url.fileURLToPath(new URL(".", import.meta.url));
const ROOT = path.join(QUI, "..");
const SEMI = [424242, 7, 999983];

const { V86 } = await import(path.join(ROOT, "vendor/v86/libv86.mjs"));

// ---------------------------------------------------------------- macchina

const emulatore = new V86({
    memory_size: 128 * 1024 * 1024,
    vga_memory_size: 2 * 1024 * 1024,
    uart1: true,
    uart2: true,
    bzimage_initrd_from_filesystem: true,
    cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose " +
             "modules=virtio_pci tsc=reliable init_on_free=on console=ttyS0",
    bios:     { url: path.join(ROOT, "vendor/v86/seabios.bin") },
    vga_bios: { url: path.join(ROOT, "vendor/v86/vgabios.bin") },
    wasm_path: path.join(ROOT, "vendor/v86/v86.wasm"),
    autostart: true,
    filesystem: { baseurl: path.join(ROOT, "images/rootfs") },
    initial_state: { url: path.join(ROOT, "images/state.bin.zst") },
});

let buf = "", prossimo = 1;
const attesa = new Map();
emulatore.add_listener("serial1-output-byte", b => {
    buf += String.fromCharCode(b);
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
        const riga = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!riga) continue;
        let m; try { m = JSON.parse(riga); } catch { continue; }
        const r = attesa.get(m.id); if (r) { attesa.delete(m.id); r(m); }
    }
});

function chiedi(op, ...arg) {
    const id = prossimo++;
    return new Promise((res, rej) => {
        attesa.set(id, res);
        emulatore.serial_send_bytes(1, new TextEncoder().encode(`${id} ${op} ${arg.join(" ")}\n`));
        // 120 s, non 40: qui dentro un check puo' aprire una connessione SSH vera, e
        // su una CPU emulata un handshake completo costa una decina di secondi. Il
        // margine e' per le soluzioni che ne fanno piu' d'uno di fila.
        setTimeout(() => { if (attesa.delete(id)) rej(new Error(`timeout su ${op}`)); }, 120000);
    });
}
const b64 = s => Buffer.from(s, "utf8").toString("base64");
const dormi = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- prove

let passati = 0;
const guai = [];
const ok = m => { passati++; if (process.env.VERBOSE) console.log(`    ✓ ${m}`); };
const ko = m => { guai.push(m); console.log(`    ✗ ${m}`); };

async function caricaScript(cap, es, nome) {
    const p = path.join(ROOT, "content", cap, es, nome);
    if (!fs.existsSync(p)) return null;
    await chiedi("write", `/opt/lab/${cap}/${es}/${nome}`, "755", b64(fs.readFileSync(p, "utf8")));
    return true;
}

async function provaEsercizio(cap, es) {
    const etichetta = `${cap}.${es}`;
    const dir = `${cap}/${es}`;

    for (const nome of ["seed.sh", "check.sh", "solution.sh"]) {
        if (!await caricaScript(cap, es, nome)) { ko(`${etichetta}: manca ${nome}`); return; }
    }
    const haCheat = await caricaScript(cap, es, "cheat.sh");

    // 1 + 2 + 4: su tre semi diversi, lo stato iniziale non passa e la soluzione passa
    for (const seme of SEMI) {
        const s = await chiedi("seed", dir, seme);
        if (!s.ok) { ko(`${etichetta} seme ${seme}: il seed è fallito — ${s.out}`); continue; }

        const prima = await chiedi("check", dir);
        if (prima.ok) ko(`${etichetta} seme ${seme}: lo stato iniziale passa già (l'esercizio non chiede nulla)`);
        else ok(`${etichetta} seme ${seme}: parte non superato`);

        const sol = await chiedi("solve", dir);
        if (!sol.ok && sol.code !== 0) { /* alcune soluzioni finiscono con exit non-zero innocuo */ }
        const dopo = await chiedi("check", dir);
        if (dopo.ok) ok(`${etichetta} seme ${seme}: la soluzione passa`);
        else ko(`${etichetta} seme ${seme}: la soluzione NON passa — ${(dopo.out || "").replace(/\n/g, " | ").slice(0, 220)}`);
    }

    // 3: il barare deve fallire, e deve fallire su un seme DIVERSO da quello in cui
    // e' stato scritto — altrimenti non stiamo provando niente.
    if (haCheat) {
        await chiedi("seed", dir, SEMI[1]);
        await chiedi("write", `/opt/lab/${dir}/solution.sh`, "755",
                     b64(fs.readFileSync(path.join(ROOT, "content", cap, es, "cheat.sh"), "utf8")));
        await chiedi("solve", dir);
        const v = await chiedi("check", dir);
        if (v.ok) ko(`${etichetta}: il trucco PASSA — l'anti-trucco non tiene`);
        else ok(`${etichetta}: il trucco fallisce`);
        // rimetti la soluzione vera, per non inquinare le prove successive
        await caricaScript(cap, es, "solution.sh");
    }
}

// ---------------------------------------------------------------- via

// Qui gira tutto nel browser, comprese le due macchine: nessun capitolo da saltare.
const { CAPITOLI } = await import(path.join(ROOT, "content/index.js"));
const dichiarati = new Set(CAPITOLI.map(c => c.id));
const richiesti = process.argv.slice(2);
const capitoli = (richiesti.length ? richiesti : fs.readdirSync(path.join(ROOT, "content"))
    .filter(d => /^ch\d\d$/.test(d) && dichiarati.has(d))).sort();

await new Promise(r => emulatore.add_listener("emulator-loaded", r));
await dormi(2500);
const p = await chiedi("ping");
if (!p.ok) { console.error("la macchina non risponde sul canale di verifica"); process.exit(1); }
console.log(`macchina pronta — provo ${capitoli.length} capitoli\n`);

for (const cap of capitoli) {
    const dirCap = path.join(ROOT, "content", cap);
    const esercizi = fs.readdirSync(dirCap).filter(d => /^e\d+$/.test(d)).sort();
    if (!esercizi.length) { console.log(`${cap}: nessun esercizio eseguibile (capitolo locale o solo lettura)`); continue; }
    console.log(`${cap}`);
    for (const es of esercizi) await provaEsercizio(cap, es);
}

console.log(`\n${passati} asserzioni superate, ${guai.length} problemi`);
if (guai.length) { console.log("\n" + guai.map(g => "  - " + g).join("\n") + "\n"); }
emulatore.destroy();
process.exit(guai.length ? 1 : 0);
