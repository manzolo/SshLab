#!/usr/bin/env node
// Quello che scrivi e' quello che arriva?
//
// La UART emulata ha sedici byte di FIFO e nessun controllo di flusso: quello che
// trabocca si perde, e se a spezzarsi e' un carattere UTF-8 — che sono due byte —
// resta a mezzo e si trasforma in un'altra lettera.
//
// E' successo davvero, ed e' il modo peggiore di sbagliare: l'eco a schermo diceva
// `ssh deploy@10.10.0.2` mentre a `ssh` arrivava `ßer10.10.0.2`. Chi lo vede
// incolpa se' stesso, perche' sullo schermo il comando era giusto.
//
// Qui si prova la condizione peggiore: righe lunghe incollate tutte insieme,
// caratteri accentati, e le due seriali che lavorano nello stesso momento (in v86
// condividono la linea di interruzione, quindi e' proprio quando l'altra macchina
// stampa che questa rischia di perdere un byte).
//
// Il test parla al terminale come il front-end: passando dalla stessa coda.

import path from "node:path";
import url from "node:url";

const ROOT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const { V86 } = await import(path.join(ROOT, "vendor/v86/libv86.mjs"));

const emu = new V86({
    memory_size: 128 * 1024 * 1024, vga_memory_size: 2 * 1024 * 1024,
    uart1: true, uart2: true,
    disable_mouse: true, disable_keyboard: true, disable_speaker: true,
    bzimage_initrd_from_filesystem: true,
    cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose " +
             "modules=virtio_pci tsc=reliable init_on_free=on console=ttyS0",
    bios: { url: path.join(ROOT, "vendor/v86/seabios.bin") },
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
const pulito = s => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "").replace(/\r/g, "");

// La stessa coda del front-end (js/lab/terminal.js): blocchi piccoli, con ritmo.
const BLOCCO = 8, RITMO = 4;
async function incolla(uart, testo) {
    const byte = new TextEncoder().encode(testo);
    for (let i = 0; i < byte.length; i += BLOCCO) {
        emu.serial_send_bytes(uart, byte.slice(i, i + BLOCCO));
        await pausa(RITMO);
    }
}

const guai = [];
const ok = m => console.log(`  OK   ${m}`);
const ko = m => { console.log(`  KO   ${m}`); guai.push(m); };

await pausa(9000);
await incolla(0, "\n"); await incolla(2, "\n");
await pausa(2000);

// --- 1. una riga lunga, incollata tutta insieme ------------------------------
// Una chiave pubblica ed25519 e' lunga cosi': e' il caso vero, non uno di scuola.
const finta = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI" + "K".repeat(40) + " manzolo@pc";
visto[0] = "";
await incolla(0, `echo '${finta}' | wc -c\n`);
await pausa(5000);
const atteso = String(finta.length + 1);
pulito(visto[0]).includes(`\n${atteso}\n`)
    ? ok(`una riga da ${finta.length} caratteri arriva intera`)
    : ko(`riga da ${finta.length} caratteri mutilata: ${JSON.stringify(pulito(visto[0]).slice(-90))}`);

// --- 2. caratteri accentati, che occupano due byte ---------------------------
// Se la coda spezzasse un carattere a meta', qui uscirebbe una lettera diversa —
// che e' esattamente come `server` divento' `ßer`.
visto[0] = "";
const accenti = "àèìòùßÄ";
await incolla(0, `echo '${accenti}' | md5sum | cut -c1-8\n`);
await pausa(5000);
const md5atteso = (await import("node:crypto")).createHash("md5")
    .update(Buffer.concat([Buffer.from(accenti, "utf8"), Buffer.from("\n")])).digest("hex").slice(0, 8);
pulito(visto[0]).includes(md5atteso)
    ? ok(`i caratteri accentati arrivano byte per byte (${accenti})`)
    : ko(`caratteri accentati corrotti: atteso ${md5atteso}, visto ${JSON.stringify(pulito(visto[0]).slice(-60))}`);

// --- 3. si scrive su una macchina mentre l'altra sta stampando ---------------
// Le due seriali condividono la linea di interruzione (IRQ 4): e' la condizione in
// cui un byte si perde piu' facilmente.
visto[0] = ""; visto[2] = "";
await incolla(2, "for i in $(seq 1 300); do echo il-server-sta-parlando-$i; done\n");
await pausa(200);
const sotto = "echo MENTRE-PARLA-" + "z".repeat(60) + "-FINE";
await incolla(0, sotto + "\n");
await pausa(12000);
pulito(visto[0]).includes("MENTRE-PARLA-" + "z".repeat(60) + "-FINE")
    ? ok("si scrive sul pc mentre il server stampa, senza perdere byte")
    : ko(`byte persi scrivendo mentre l'altra macchina stampa: ${JSON.stringify(pulito(visto[0]).slice(-90))}`);

console.log(guai.length ? `\n${guai.length} problemi` : "\ntutto verde");
emu.destroy();
process.exit(guai.length ? 1 : 0);
