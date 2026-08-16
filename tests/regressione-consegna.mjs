#!/usr/bin/env node
// Il giro della consegna, fatto come lo fa una persona: DIGITANDO nel terminale.
//
// Perche' un test a parte, quando esiste gia' tests/labs.mjs: quello esegue le
// soluzioni di riferimento attraverso il canale di verifica, cioe' come ROOT. Chi
// studia invece e' `manzolo`, e i due mondi si sono separati il giorno in cui i
// terminali hanno smesso di essere root — che e' anche il giorno in cui `lab
// answer` ha cominciato a fallire senza che nessun test se ne accorgesse.
//
// Il guasto era doppio, e la seconda meta' era la peggiore: la cartella delle
// consegne era di root, quindi la scrittura falliva; e il comando stampava lo
// stesso "risposta consegnata:", cioe' un errore travestito da successo.
//
// Regola che questo file mette per iscritto: se una cosa la fara' l'utente
// scrivendola, il test deve scriverla. Passare dal canale di servizio prova
// un'altra cosa.

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

let buf = "", prossimo = 1;
const attesa = new Map();
emu.add_listener("serial1-output-byte", b => {
    buf += String.fromCharCode(b);
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
        const r0 = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!r0) continue;
        let m; try { m = JSON.parse(r0); } catch { continue; }
        const f = attesa.get(m.id); if (f) { attesa.delete(m.id); f(m); }
    }
});
const chiedi = (op, arg, ms = 90000) => new Promise((res, rej) => {
    const id = prossimo++;
    attesa.set(id, res);
    emu.serial_send_bytes(1, new TextEncoder().encode(`${id} ${op}${arg ? " " + arg : ""}\n`));
    setTimeout(() => { if (attesa.delete(id)) rej(new Error(`timeout ${op}`)); }, ms);
});
const b64 = t => Buffer.from(t, "utf8").toString("base64");
const sh = async (s, ms) => ((await chiedi("sh", `echo ${b64(s)} | base64 -d | sh`, ms)).out || "").trim();

let visto = "";
emu.add_listener("serial0-output-byte", b => { visto += String.fromCharCode(b); });
const pausa = ms => new Promise(r => setTimeout(r, ms));
/** Scrive come una persona: un carattere per volta. La seriale emulata ha una FIFO
 *  piccola e nessun controllo di flusso — riversarle addosso una riga intera in un
 *  colpo solo ne fa perdere dei pezzi. */
async function digita(testo) {
    for (const c of testo) { emu.serial_send_bytes(0, new TextEncoder().encode(c)); await pausa(6); }
}
const pulito = s => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "").replace(/\r/g, "");

const guai = [];
const ok = m => console.log(`  OK   ${m}`);
const ko = m => { console.log(`  KO   ${m}`); guai.push(m); };

// --- via -------------------------------------------------------------------
for (let t = 1; ; t++) {
    try { await chiedi("ping", null, 5000); break; }
    catch { if (t > 30) { console.error("la macchina non risponde"); process.exit(1); } }
}

// il mondo dell'esercizio 1, seminato come lo semina il sito
const seed = await import("node:fs").then(fs => fs.readFileSync(path.join(ROOT, "content/ch01/e1/seed.sh"), "utf8"));
const check = await import("node:fs").then(fs => fs.readFileSync(path.join(ROOT, "content/ch01/e1/check.sh"), "utf8"));
await chiedi("write", `/opt/lab/ch01/e1/seed.sh 755 ${b64(seed)}`);
await chiedi("write", `/opt/lab/ch01/e1/check.sh 755 ${b64(check)}`);
const s = await chiedi("seed", "ch01/e1 424242");
if (!s.ok) { console.error("il seed e' fallito:", s.out); process.exit(1); }

const ipAtteso = await sh("ip netns exec server ip -4 -o addr show veth-srv | awk '{print $4}' | cut -d/ -f1");

// chi digita e' manzolo, e deve essere manzolo
emu.serial_send_bytes(0, new TextEncoder().encode("\n"));
await pausa(1500);
visto = "";
await digita("whoami\n");
await pausa(2500);
pulito(visto).includes("manzolo")
    ? ok("il terminale del pc e' di manzolo, non di root")
    : ko(`chi digita non e' manzolo: ${JSON.stringify(pulito(visto).slice(-60))}`);

// LA CONSEGNA, digitata
visto = "";
await digita(`lab answer ${ipAtteso}\n`);
await pausa(4000);
const uscita = pulito(visto);

uscita.includes("Permission denied") || uscita.includes("can't create")
    ? ko(`la consegna non riesce a scrivere: ${JSON.stringify(uscita.slice(0, 120))}`)
    : ok("la consegna scrive senza errori di permessi");

uscita.includes(`risposta consegnata: ${ipAtteso}`)
    ? ok(`la conferma riporta il valore consegnato (${ipAtteso})`)
    : ko(`la conferma non riporta il valore: ${JSON.stringify(uscita.slice(0, 140))}`);

// e la verifica deve VEDERLA: e' il punto di tutto il giro
const v = await chiedi("check", "ch01/e1");
v.ok ? ok("la verifica vede la risposta consegnata dall'utente")
     : ko(`la verifica non vede la risposta: ${(v.out || "").replace(/\n/g, " | ").slice(0, 160)}`);

// il seme deve restare intoccabile: l'area e' aperta all'utente, ma con lo sticky
// bit, e il seme e' di root. Se si potesse riscrivere, l'anti-trucco cadrebbe.
visto = "";
await digita("echo 999 > /opt/lab/state/seed 2>&1; cat /opt/lab/state/seed\n");
await pausa(3500);
pulito(visto).includes("424242")
    ? ok("il seme resta di root: l'utente non lo puo' riscrivere")
    : ko(`il seme e' stato riscritto dall'utente: ${JSON.stringify(pulito(visto).slice(-80))}`);

console.log(guai.length ? `\n${guai.length} problemi` : "\ntutto verde");
emu.destroy();
process.exit(guai.length ? 1 : 0);
