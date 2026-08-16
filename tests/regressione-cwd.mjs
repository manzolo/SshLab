#!/usr/bin/env node
// Regressione: cambiando esercizio, la shell dell'utente non deve restare orfana.
//
// Il bug (trovato da Andrea il 2026-08-16, passando dal capitolo 1 al 2): l'agente
// faceva `rm -rf "$LAB"` prima di ogni seed. Se la shell dell'utente era dentro
// quella cartella, restava agganciata a un inode cancellato: il prompt continuava a
// mostrare ~/lab — perche' e' solo una stringa — ma ogni comando rispondeva
// «ls: cannot open directory '.': No such file or directory».
//
// È letteralmente il fenomeno che il capitolo 2 spiega nella parte PRO. Causarlo noi
// sarebbe stato grottesco.
//
// Questo test parla al TERMINALE (ttyS0), non al canale di verifica: e' l'unico modo
// di riprodurre il problema, perche' serve una shell che sopravvive fra un comando e
// l'altro. Ogni `sh` dell'agente e' un processo nuovo e non lo vedrebbe mai.

import path from "node:path";
import url from "node:url";

const ROOT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const { V86 } = await import(path.join(ROOT, "vendor/v86/libv86.mjs"));

const em = new V86({
    memory_size: 128 * 1024 * 1024, vga_memory_size: 2 * 1024 * 1024, uart1: true,
    bzimage_initrd_from_filesystem: true,
    cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose " +
             "modules=virtio_pci tsc=reliable init_on_free=on console=ttyS0",
    bios: { url: path.join(ROOT, "vendor/v86/seabios.bin") },
    vga_bios: { url: path.join(ROOT, "vendor/v86/vgabios.bin") },
    wasm_path: path.join(ROOT, "vendor/v86/v86.wasm"), autostart: true,
    filesystem: { baseurl: path.join(ROOT, "images/rootfs") },
    initial_state: { url: path.join(ROOT, "images/state.bin.zst") },
});

// --- canale di verifica (per seminare come farebbe il sito) ---
let buf1 = "", next = 1; const attesa = new Map();
em.add_listener("serial1-output-byte", b => {
    buf1 += String.fromCharCode(b); let i;
    while ((i = buf1.indexOf("\n")) >= 0) {
        const r = buf1.slice(0, i).trim(); buf1 = buf1.slice(i + 1);
        if (!r) continue; let m; try { m = JSON.parse(r); } catch { continue; }
        const f = attesa.get(m.id); if (f) { attesa.delete(m.id); f(m); }
    }
});
const agente = (op, ...a) => { const id = next++; return new Promise((res, rej) => {
    attesa.set(id, res);
    em.serial_send_bytes(1, new TextEncoder().encode(`${id} ${op} ${a.join(" ")}\n`));
    setTimeout(() => { if (attesa.delete(id)) rej(new Error("timeout " + op)); }, 30000); }); };

// --- terminale dell'utente ---
let s0 = "";
em.add_listener("serial0-output-byte", b => { s0 += String.fromCharCode(b); });
const dormi = ms => new Promise(r => setTimeout(r, ms));
async function digita(cmd, attendi = 2500) {
    s0 = "";
    em.serial0_send(cmd + "\n");
    await dormi(attendi);
    return s0;
}

let guai = 0;
const ok = m => console.log(`  ✓ ${m}`);
const ko = m => { console.log(`  ✗ ${m}`); guai++; };

await new Promise(r => em.add_listener("emulator-loaded", r));
await dormi(2500);
await agente("ping");
em.serial0_send("\n");
await dormi(1500);

console.log("\nregressione: la shell non resta orfana quando cambia esercizio\n");

// 1) l'utente lavora nella sua cartella, e poi scende in una sottocartella
await digita('cd ~/lab && mkdir -p sotto/ancora && cd sotto/ancora && pwd');
let out = await digita('pwd');
out.includes("/root/lab/sotto/ancora") ? ok("l'utente è dentro ~/lab/sotto/ancora")
                                        : ko(`cwd inattesa: ${out.replace(/\n/g, " ")}`);

// 2) intanto il sito prepara un altro esercizio: il mondo viene svuotato
await agente("write", "/opt/lab/prova/e1/seed.sh", "755",
    Buffer.from('mkdir -p "$LAB/nuovo"; echo ciao > "$LAB/nuovo/file.txt"\n:\n', "utf8").toString("base64"));
const s = await agente("seed", "prova/e1", 4242);
s.ok ? ok("il nuovo esercizio è stato seminato") : ko(`seed fallito: ${s.out}`);
// Come fa js/lab/runner.js: un a-capo fa ridisegnare il prompt, e il PROMPT_COMMAND
// riporta a casa la shell prima che l'utente digiti qualcosa.
em.serial0_send("\n");
await dormi(1200);

// 3) IL PUNTO: il terminale dell'utente deve continuare a funzionare
out = await digita("ls -a");
if (/cannot open directory|No such file or directory/.test(out)) {
    ko(`la shell è rimasta orfana: ${out.replace(/\n/g, " ").slice(0, 120)}`);
} else {
    ok("dopo il cambio di esercizio `ls` funziona ancora");
}

out = await digita("pwd");
/\/root\/lab/.test(out) ? ok(`la shell è stata riportata a casa: ${out.match(/\/root\/lab\S*/)?.[0]}`)
                        : ko(`cwd non recuperata: ${out.replace(/\n/g, " ").slice(0, 120)}`);

// 4) e il mondo nuovo è davvero lì
out = await digita("ls nuovo/");
out.includes("file.txt") ? ok("il mondo del nuovo esercizio è visibile")
                         : ko(`mondo nuovo assente: ${out.replace(/\n/g, " ").slice(0, 120)}`);

console.log(guai ? `\n${guai} problemi\n` : "\ntutto verde\n");
em.destroy();
process.exit(guai ? 1 : 0);
