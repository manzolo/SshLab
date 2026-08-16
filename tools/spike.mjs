#!/usr/bin/env node
// spike.mjs — la prova che l'architettura regge, e la misura dei suoi tempi.
//
// Riparte dallo snapshot come farebbe chi apre il lab, e verifica che: i due host
// esistano gia' all'avvio, i due terminali rispondano, una chiave si generi in un
// paio di secondi, e un `ssh` entri dal pc al server con la chiave e non senza.
//
// Numeri misurati il 2026-08-16 (i9-9900K):
//   macchina pronta         5,5 s
//   chiave ed25519          1,8 s
//   PRIMO login             8,2 s
//   login successivi        7,5-8,1 s
//
// Tre cose sono costate mezza serata e vale la pena non riscoprirle:
//   1. `adduser -D` lascia la password bloccata e per sshd l'utente NON ESISTE;
//   2. `ssh` senza `-n` si mette in ascolto sullo stdin e non torna piu';
//   3. l'escaping dell'agente non toglieva il \r, e il primo `ssh` — che stampa
//      "Warning: Permanently added ...\r\n" — produceva un JSON illegale.
// Tutte e tre valgono anche come materiale dei capitoli.

import path from "node:path";
import url from "node:url";
const ROOT = path.join(url.fileURLToPath(new URL(".", import.meta.url)), "..");
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
        const r = attesa.get(m.id); if (r) { attesa.delete(m.id); r(m); }
    }
});
function chiedi(op, arg, ms) {
    const id = prossimo++;
    return new Promise((res, rej) => {
        attesa.set(id, res);
        emu.serial_send_bytes(1, new TextEncoder().encode(`${id} ${op}${arg ? " " + arg : ""}\n`));
        setTimeout(() => { if (attesa.delete(id)) rej(new Error(`TIMEOUT-${ms / 1000}s`)); }, ms);
    });
}
const b64 = t => Buffer.from(t, "utf8").toString("base64");
async function sh(script, ms = 180000) {
    const t0 = Date.now();
    let out;
    try { out = ((await chiedi("sh", `echo ${b64(script)} | base64 -d | sh`, ms)).out || "").trim(); }
    catch (e) { out = `<<${e.message}>>`; }
    return { out, dt: (Date.now() - t0) / 1000 };
}
const passo = async (et, s, ms = 180000) => {
    const r = await sh(s, ms);
    console.log(`\n--- ${et}   [${r.dt.toFixed(1)} s]`);
    console.log(r.out.split("\n").map(x => "    " + x).join("\n"));
    return r;
};
const esiti = [];
const esito = (n, ok, d) => { esiti.push({ n, ok }); console.log(`${ok ? "  OK  " : "FALLITO"} ${n}${d ? " — " + d : ""}`); };

// i due terminali visibili
const visto = { 0: "", 2: "" };
emu.add_listener("serial0-output-byte", b => { visto[0] += String.fromCharCode(b); });
emu.add_listener("serial2-output-byte", b => { visto[2] += String.fromCharCode(b); });
const pausa = ms => new Promise(r => setTimeout(r, ms));
async function digita(uart, testo, ms = 4) {
    for (const c of testo) { emu.serial_send_bytes(uart, new TextEncoder().encode(c)); await pausa(ms); }
}

async function principale() {
    console.log("\n=== prova dell'architettura EDU-SSH ===");
    const t0 = Date.now();
    for (let t = 1; ; t++) {
        try { await chiedi("ping", null, 5000); break; }
        catch { if (t > 30) throw new Error("agente muto"); }
    }
    console.log(`macchina pronta in ${((Date.now() - t0) / 1000).toFixed(1)} s`);

    // --- il mondo c'e' gia'? ----------------------------------------------------
    const mondo = await passo("il mondo dentro lo snapshot", `
        ip -o -4 addr show veth-pc | awk '{print "pc:  " $4}'
        /run/lab/entra-server ip -o -4 addr show veth-srv | awk '{print "srv: " $4}'
        ping -c 1 -W 3 10.10.0.2 >/dev/null 2>&1 && echo "cavo: ok"
        kill -0 "$(cat /run/lab/sshd.pid)" 2>/dev/null && echo "sshd: vivo"
        getent passwd manzolo deploy | cut -d: -f1,6 | tr '\\n' ' '; echo
        ls /home/deploy/.ssh/authorized_keys 2>/dev/null && echo "ATTENZIONE: chiave del riscaldamento rimasta" || echo "pulizia: ok (nessuna chiave gia' autorizzata)"
    `, 120000);
    esito("i due host esistono gia' all'avvio", mondo.out.includes("cavo: ok") && mondo.out.includes("sshd: vivo"));
    esito("il riscaldamento non ha lasciato porte aperte", mondo.out.includes("pulizia: ok"));

    // --- i due terminali ---------------------------------------------------------
    emu.serial_send_bytes(0, new TextEncoder().encode("\n"));
    emu.serial_send_bytes(2, new TextEncoder().encode("\n"));
    await pausa(2000);
    visto[0] = ""; visto[2] = "";
    await digita(0, "echo sono-il-pc\n");
    await digita(2, "echo sono-il-server\n");
    await pausa(4000);
    esito("il terminale del pc risponde", visto[0].includes("sono-il-pc"));
    esito("il terminale del server risponde", visto[2].includes("sono-il-server"));

    // --- lo studente genera la sua chiave e la autorizza -------------------------
    const kg = await passo("lo studente genera la chiave", `
        rm -rf /home/manzolo/.ssh /home/deploy/.ssh
        su manzolo -c "mkdir -p ~/.ssh; chmod 700 ~/.ssh; ssh-keygen -t ed25519 -N '' -C manzolo@pc -f ~/.ssh/id_ed25519 -q </dev/null"
        ssh-keygen -lf /home/manzolo/.ssh/id_ed25519.pub
    `, 180000);

    const copia = await passo("ssh-copy-id porta la chiave sul server (via rete, con la password)", `
        install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
        install -m 600 -o deploy -g deploy /home/manzolo/.ssh/id_ed25519.pub /home/deploy/.ssh/authorized_keys
        echo "autorizzata:"; ssh-keygen -lf /home/deploy/.ssh/authorized_keys
    `, 180000);

    // --- LA MISURA ---------------------------------------------------------------
    const opz = "-n -o BatchMode=yes -o ConnectTimeout=20";
    const l1 = await passo("PRIMO login della sessione",
        `su manzolo -c "ssh ${opz} -o StrictHostKeyChecking=accept-new deploy@10.10.0.2 'id -un; hostname'" </dev/null 2>&1 | tail -3`, 250000);
    esito("il PRIMO ssh entra", l1.out.includes("deploy"), `${l1.dt.toFixed(1)} s`);

    const l2 = await passo("secondo login", `su manzolo -c "ssh ${opz} deploy@10.10.0.2 'id -un'" </dev/null 2>&1 | tail -2`, 250000);
    esito("il secondo ssh entra", l2.out.includes("deploy"), `${l2.dt.toFixed(1)} s`);

    const l3 = await passo("terzo login", `su manzolo -c "ssh ${opz} deploy@10.10.0.2 'id -un'" </dev/null 2>&1 | tail -2`, 250000);

    // --- l'invariante che useranno i check ---------------------------------------
    const log = await passo("il testimone nel log del server",
        `grep 'Accepted publickey' /var/log/messages | tail -1 | sed 's/.*Accepted/Accepted/' | cut -c1-100`, 60000);
    esito("il server registra metodo e impronta", /Accepted publickey/.test(log.out));

    const senza = await passo("senza la chiave non si entra", `
        mv /home/manzolo/.ssh/id_ed25519 /tmp/via
        su manzolo -c "ssh ${opz} deploy@10.10.0.2 'id -un'" </dev/null 2>&1 | tail -1
        mv /tmp/via /home/manzolo/.ssh/id_ed25519
    `, 250000);
    // NB: non si puo' cercare l'assenza della parola "deploy" — il messaggio di
    // rifiuto e' "deploy@10.10.0.2: Permission denied" e la contiene. L'invariante
    // e' che il comando remoto NON abbia risposto, cioe' che l'ultima riga sia il
    // rifiuto e non l'uscita di `id -un`.
    esito("tolta la chiave privata, il login fallisce",
          /Permission denied/.test(senza.out) && senza.out.trim().split("\n").pop().trim() !== "deploy",
          senza.out.slice(0, 60));

    console.log("\n=== NUMERI ===");
    console.log(`  avvio della macchina : ${((Date.now() - t0) / 1000).toFixed(1)} s (totale spike)`);
    console.log(`  keygen dello studente: ${kg.dt.toFixed(1)} s`);
    console.log(`  PRIMO login          : ${l1.dt.toFixed(1)} s`);
    console.log(`  secondo login        : ${l2.dt.toFixed(1)} s`);
    console.log(`  terzo login          : ${l3.dt.toFixed(1)} s`);
    const falliti = esiti.filter(e => !e.ok);
    console.log(`\n=== ${esiti.length - falliti.length}/${esiti.length} verdi ===`);
    if (falliti.length) console.log("falliti: " + falliti.map(f => f.n).join(" · "));
    emu.destroy();
    process.exit(falliti.length ? 1 : 0);
}
setTimeout(() => { console.error("\nTIMEOUT GENERALE"); process.exit(2); }, 1500000);
principale().catch(e => { console.error("\nERRORE:", e.message); process.exit(3); });
