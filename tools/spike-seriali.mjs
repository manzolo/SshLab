#!/usr/bin/env node
// spike-seriali.mjs — le due seriali si disturbano a vicenda?
//
// In v86 le quattro UART stanno su due sole linee di interruzione: ttyS0 e ttyS2
// sull'IRQ 4, ttyS1 e ttyS3 sull'IRQ 3. La domanda e' se il terminale del server
// si pianta mentre lavora quello del pc.
//
// Il primo tentativo rispondeva "si perde tutto", ma misurava un'altra cosa:
// riversava 1500 byte in un colpo solo su una UART che ha una FIFO da 16 byte e
// nessun controllo di flusso. Persi, giustamente. Una persona che scrive non fa
// mai cosi' — e nemmeno xterm.js, che manda i tasti uno per volta.
//
// Qui si scrive al ritmo di una tastiera veloce (5 ms per carattere), alternando
// i due terminali riga per riga, e si conta chi risponde. Piu' una prova a parte
// per il caso che invece esiste davvero: incollare un comando lungo.

import path from "node:path";
import url from "node:url";
const ROOT = path.join(url.fileURLToPath(new URL(".", import.meta.url)), "..");
const { V86 } = await import(path.join(ROOT, "vendor/v86/libv86.mjs"));

const emu = new V86({
    memory_size: 128 * 1024 * 1024,
    vga_memory_size: 2 * 1024 * 1024,
    uart1: true, uart2: true,
    disable_mouse: true, disable_keyboard: true, disable_speaker: true,
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

const visto = { 0: "", 2: "" };
emu.add_listener("serial0-output-byte", b => { visto[0] += String.fromCharCode(b); });
emu.add_listener("serial2-output-byte", b => { visto[2] += String.fromCharCode(b); });
const pausa = ms => new Promise(r => setTimeout(r, ms));
const byte = (u, c) => emu.serial_send_bytes(u, new TextEncoder().encode(c));

/** Scrive come una persona: un carattere per volta, con una pausa in mezzo. */
async function digita(uart, testo, msPerCarattere = 5) {
    for (const c of testo) { byte(uart, c); await pausa(msPerCarattere); }
}

const numeri = (t, l) => new Set((t.match(new RegExp(l + "(\\d+)\\b", "g")) || []).map(s => +s.slice(1)));

console.log("\n=== le due seriali si disturbano? ===\n");
await pausa(6000);
byte(0, "\n"); byte(2, "\n");
await pausa(2000);
console.log(`prompt ttyS0: ${visto[0].length > 0 ? "si" : "NO"} · prompt ttyS2: ${visto[2].length > 0 ? "si" : "NO"}`);

// --- prova 1: ritmo umano, alternato ----------------------------------------
const N = 40;
visto[0] = ""; visto[2] = "";
for (let i = 1; i <= N; i++) {
    await digita(0, `echo A${i}\n`);
    await digita(2, `echo B${i}\n`);
}
await pausa(6000);
const a = numeri(visto[0], "A"), b = numeri(visto[2], "B");
console.log(`\n[ritmo umano, alternato]`);
console.log(`  ttyS0: ${a.size}/${N} risposte, massimo ${Math.max(0, ...a)}`);
console.log(`  ttyS2: ${b.size}/${N} risposte, massimo ${Math.max(0, ...b)}`);
const prova1 = a.size === N && b.size === N;
console.log(`  ${prova1 ? "OK — nessuna delle due si pianta" : "ATTENZIONE — qualcosa si e' perso"}`);

// --- prova 2: uno lavora mentre l'altro scrive -------------------------------
// Il caso peggiore per un IRQ condiviso: un terminale sputa fuori molto output
// (che genera interruzioni in continuazione) mentre sull'altro si scrive.
visto[0] = ""; visto[2] = "";
await digita(0, "for i in $(seq 1 400); do echo riga-lunga-di-output-numero-$i; done\n");
await pausa(300);
for (let i = 1; i <= 15; i++) await digita(2, `echo C${i}\n`);
await pausa(15000);
const c = numeri(visto[2], "C");
const righeA = (visto[0].match(/riga-lunga-di-output-numero-\d+/g) || []).length;
console.log(`\n[ttyS0 sputa 400 righe mentre si scrive su ttyS2]`);
console.log(`  ttyS0: ${righeA} righe di output arrivate`);
console.log(`  ttyS2: ${c.size}/15 risposte, massimo ${Math.max(0, ...c)}`);
const prova2 = c.size === 15;
console.log(`  ${prova2 ? "OK — il terminale del server risponde anche sotto carico dell'altro" : "ATTENZIONE — il server si e' piantato"}`);

// --- prova 3: incollare un comando lungo -------------------------------------
// Questo NON e' il caso della tastiera: e' l'incolla. Se la FIFO non regge, un
// comando incollato arriva mutilato — e in un lab dove si incollano chiavi
// pubbliche da 80 caratteri conta parecchio.
visto[0] = "";
const lungo = "echo INCOLLATO-" + "x".repeat(300) + "-FINE\n";
emu.serial_send_bytes(0, new TextEncoder().encode(lungo));   // tutto in un colpo
await pausa(6000);
const interi = (visto[0].match(/INCOLLATO-x+-FINE/g) || []);
const piuLungo = Math.max(0, ...interi.map(s => s.length));
console.log(`\n[incolla di ${lungo.length} caratteri in un colpo solo]`);
console.log(`  occorrenze integre: ${interi.filter(s => s.length === 320).length} (la piu' lunga: ${piuLungo}/320)`);
const prova3 = interi.some(s => s.length === 320);
console.log(`  ${prova3 ? "OK — l'incolla lungo arriva intero" : "DA SAPERE — l'incolla lungo si mutila: serve mandare a pezzi dal front-end"}`);

console.log(`\n=== esito: ${[prova1, prova2, prova3].filter(Boolean).length}/3 ===`);
emu.destroy();
process.exit(prova1 && prova2 ? 0 : 1);
