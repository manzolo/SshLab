#!/usr/bin/env node
// Dopo un `ssh`, sei davvero sull'altra macchina?
//
// Il prompt e' l'unica cosa che, dopo un `ssh`, dice dove sei: la finestra e' la
// stessa e il riquadro pure. Se mente, il lab insegna la propria bugia nel punto
// esatto in cui il capitolo 1 dice «guarda il prompt».
//
// Ed e' mentito davvero. `ip netns exec server` porta dentro la pila di rete e
// basta: il NOME di una macchina vive in un namespace a parte, l'UTS. sshd era
// avviato solo nel namespace di rete, quindi le sessioni ssh atterravano su una
// macchina con l'indirizzo del server e il nome del pc — `deploy@pc`.
//
// La causa profonda: c'erano DUE modi di entrare nel server, e uno dei due era
// incompleto. Ora ce n'e' uno solo (/run/lab/entra-server) e questo test lo prova
// dall'unico punto di vista che conta: quello di chi digita.

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
async function digita(uart, testo) {
    for (const c of testo) { emu.serial_send_bytes(uart, new TextEncoder().encode(c)); await pausa(6); }
}
const pulito = s => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "").replace(/\r/g, "");

const guai = [];
const ok = m => console.log(`  OK   ${m}`);
const ko = m => { console.log(`  KO   ${m}`); guai.push(m); };

await pausa(9000);
await digita(0, "\n"); await digita(2, "\n");
await pausa(2000);

// --- 1. i due terminali, ognuno con la propria identita' ---------------------
visto[0] = ""; visto[2] = "";
await digita(0, "echo IO-SONO $(id -un)@$(hostname)\n");
await digita(2, "echo IO-SONO $(id -un)@$(hostname)\n");
await pausa(5000);

const chiSono = t => (pulito(t).match(/IO-SONO (\S+)/g) || []).map(s => s.slice(8)).pop();
const pc = chiSono(visto[0]), srv = chiSono(visto[2]);
pc === "manzolo@pc"    ? ok(`il terminale di sinistra e' ${pc}`)  : ko(`il terminale di sinistra dice ${pc}, atteso manzolo@pc`);
srv === "deploy@server" ? ok(`il terminale di destra e' ${srv}`)  : ko(`il terminale di destra dice ${srv}, atteso deploy@server`);

// --- 2. e DENTRO una sessione ssh? -------------------------------------------
// E' il caso che il difetto colpiva: qui non basta guardare i due terminali, si
// deve fare il giro vero, come chi studia.
visto[0] = "";
await digita(0, "ssh -o StrictHostKeyChecking=accept-new deploy@10.10.0.2\n");
await pausa(11000);
await digita(0, "lab\n");                    // la password di deploy
await pausa(11000);
visto[0] = "";
await digita(0, "echo DENTRO $(id -un)@$(hostname)\n");
await pausa(6000);

const dentro = (pulito(visto[0]).match(/DENTRO (\S+)/g) || []).map(s => s.slice(7)).pop();
dentro === "deploy@server"
    ? ok(`dentro la sessione ssh sei ${dentro}`)
    : ko(`dentro la sessione ssh il prompt dice ${dentro}, atteso deploy@server ` +
         `(sshd sta girando fuori dal namespace UTS del server?)`);

// e uscendo si deve tornare a casa
visto[0] = "";
await digita(0, "exit\n");
await pausa(5000);
await digita(0, "echo TORNATO $(id -un)@$(hostname)\n");
await pausa(5000);
const tornato = (pulito(visto[0]).match(/TORNATO (\S+)/g) || []).map(s => s.slice(8)).pop();
tornato === "manzolo@pc"
    ? ok(`uscendo si torna su ${tornato}`)
    : ko(`uscendo il prompt dice ${tornato}, atteso manzolo@pc`);

console.log(guai.length ? `\n${guai.length} problemi` : "\ntutto verde");
emu.destroy();
process.exit(guai.length ? 1 : 0);
