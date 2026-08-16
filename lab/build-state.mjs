#!/usr/bin/env node
// Genera lo snapshot da cui il browser riparte in mezzo secondo.
//
// Perche' uno snapshot e non il boot normale: a freddo, da 9p, il kernel ci mette ~46 s.
// Con lo snapshot il prompt c'e' in 0,6 s. Non e' un'ottimizzazione, e' la differenza fra
// un lab che si usa e uno che si chiude.
//
// Perche' UNO snapshot per tutti i capitoli e non uno per capitolo: una sola URL, scaricata
// al primo capitolo e cache hit per tutti gli altri; e la macchina resta la STESSA passando
// di capitolo in capitolo, cosi' i file creati al capitolo 3 esistono ancora al capitolo 5.
//
// Dentro lo snapshot ci sono gia': i due host con il loro cavo, sshd in ascolto, la
// casualita' del kernel sbloccata e le pagine di ssh gia' lette dal disco. Sono tutte
// cose che costano una volta qui e zero a chi studia — perche' lo snapshot salva la
// RAM, e la RAM tiene sia i namespace sia la cache del filesystem.
//
// NB: il lab fratello dichiara "niente warm-up", misurato sul suo caso. Qui e' stato
// rimisurato e il risultato e' opposto: senza scaldare ssh, il PRIMO login costa oltre
// tre minuti contro gli otto secondi dei successivi. Le regole ereditate si
// rimisurano, non si applicano a scatola chiusa. Il prezzo sono ~5 MB di snapshot.

import path from "node:path";
import fs from "node:fs";
import url from "node:url";
import child_process from "node:child_process";

const HERE = url.fileURLToPath(new URL(".", import.meta.url));
const ROOT = path.join(HERE, "..");
const IMAGES = path.join(ROOT, "images");
const STATE = path.join(IMAGES, "state.bin");

const { V86 } = await import(path.join(ROOT, "vendor/v86/libv86.mjs"));

// ATTENZIONE: queste opzioni devono coincidere ESATTAMENTE con quelle di js/lab/machine.js.
// v86 ripristina uno stato solo se il costruttore ha le stesse opzioni dell'originale:
// se `uart1` manca qui, nello stato ripristinato il canale di verifica non esiste.
export const OPZIONI_MACCHINA = {
    memory_size: 128 * 1024 * 1024,
    vga_memory_size: 2 * 1024 * 1024,
    uart1: true,
    uart2: true,                       // il terminale del server (vedi js/lab/machine.js)
    bzimage_initrd_from_filesystem: true,
    cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose " +
             "modules=virtio_pci tsc=reliable init_on_free=on console=ttyS0",
};

const emulator = new V86({
    ...OPZIONI_MACCHINA,
    bios: { url: path.join(ROOT, "vendor/v86/seabios.bin") },
    vga_bios: { url: path.join(ROOT, "vendor/v86/vgabios.bin") },
    wasm_path: path.join(ROOT, "vendor/v86/v86.wasm"),
    autostart: true,
    filesystem: {
        baseurl: path.join(IMAGES, "rootfs"),
        basefs: path.join(IMAGES, "fs.json"),
    },
});

const t0 = Date.now();
let testo = "", fase = "boot";
const PROMPT = "$ ";

process.stdout.write("boot a freddo dal 9p, ci vuole un minuto");
const punti = setInterval(() => process.stdout.write("."), 3000);

emulator.add_listener("serial0-output-byte", (b) => {
    testo += String.fromCharCode(b);
    if (!testo.endsWith(PROMPT)) return;

    if (fase === "boot") {
        clearInterval(punti);
        console.log(`\nprompt raggiunto in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
        // Sblocco del generatore di casualita' del kernel PRIMA di salvare.
        //
        // In v86 non c'e' nessun hardware da cui estrarre entropia (l'istruzione RDRAND
        // non e' emulata), quindi il CRNG del kernel ci mette parecchio a dichiararsi
        // pronto. Finche' non lo e', `getrandom()` BLOCCA — e `ssh-keygen` si pianta
        // senza stampare una parola: sembra un guasto, e non lo e'.
        //
        // Il CRNG vive in RAM, e lo snapshot salva la RAM. Quindi basta aspettarlo UNA
        // volta, qui, in fase di build: ogni sessione ripristinata riparte da uno stato
        // in cui e' gia' pronto. Il conto lo paga la CI, una volta, invece di chi studia,
        // ogni volta.
        fase = "crng";
        testo = "";
        emulator.serial0_send("sudo dd if=/dev/random of=/dev/null bs=32 count=1 2>/dev/null; " +
                              "grep -q . /proc/sys/kernel/random/entropy_avail && echo CRNG-PRONTO\n");
        return;
    }
    if (fase === "crng") {
        console.log(`casualita' del kernel pronta a ${((Date.now() - t0) / 1000).toFixed(1)} s`);
        // I due host li ha gia' costruiti init (`::sysinit:/opt/lab/bin/lab-hosts-up`,
        // e le azioni sysinit girano tutte prima dei respawn, quindi prima ancora che
        // esista questo prompt). Qui si controlla soltanto che ci siano: uno snapshot
        // salvato con il mondo a meta' sarebbe un guasto che si presenta molto piu'
        // avanti, addosso a chi studia, e senza nessun indizio.
        fase = "mondo";
        testo = "";
        emulator.serial0_send("cat /run/lab/srv_ip; sudo ip netns list; pgrep -c sshd\n");
        return;
    }
    if (fase === "mondo") {
        if (!/server/.test(testo)) {
            console.error("\nERRORE: il mondo a due host non c'e'. Guarda /opt/lab/bin/lab-hosts-up");
            console.error(testo.slice(-400));
            process.exit(1);
        }
        console.log(`due host in piedi a ${((Date.now() - t0) / 1000).toFixed(1)} s`);
        // E qui si paga, una volta per tutte, il primo `ssh`: misurato, a freddo
        // costa piu' di tre minuti (sono i binari letti dal 9p, non la crittografia),
        // a caldo sette secondi. Scaldandolo adesso, quel conto non lo paga nessuno.
        fase = "scalda";
        testo = "";
        emulator.serial0_send("sudo /opt/lab/bin/lab-scalda-ssh\n");
        return;
    }
    if (fase === "scalda") {
        clearInterval(punti);
        console.log(`ssh scaldato a ${((Date.now() - t0) / 1000).toFixed(1)} s`);
        // NB: niente `drop_caches` dopo il riscaldamento — butterebbe via proprio
        // quello che siamo appena andati a prendere. Si scarta solo la cache del
        // filesystem letta durante il boot, PRIMA di scaldare, e infatti l'ordine
        // qui e' boot -> crng -> mondo -> scalda -> salva.
        fase = "save";
        testo = "";
        setTimeout(() => salva(), 3000);
        return;
    }
});

async function salva() {
    const s = await emulator.save_state();
    fs.writeFileSync(STATE, new Uint8Array(s));
    child_process.execSync(`zstd -19 -q -f "${STATE}" -o "${STATE}.zst"`);
    fs.unlinkSync(STATE);
    const mb = fs.statSync(STATE + ".zst").size / 1048576;
    console.log(`snapshot: ${mb.toFixed(1)} MB compressi -> images/state.bin.zst`);
    if (mb > 25) {
        console.error("ATTENZIONE: snapshot oltre i 25 MB. Prima di toccare altro, prova memory_size a 64 MB.");
        process.exit(1);
    }
    emulator.destroy();
    process.exit(0);
}

// 15 minuti, non 5: il riscaldamento di ssh (fase "scalda") da solo puo' costarne
// tre o quattro, perche' e' li' che si legge dal 9p tutto quello che serve a una
// connessione. E' tempo speso una volta in CI per non farlo spendere a nessun altro.
setTimeout(() => { console.error("\nTIMEOUT: la macchina non ha finito in 900 s"); process.exit(1); }, 900000);
