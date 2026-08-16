// machine.js — la macchina virtuale, UNA SOLA per tutta la sessione.
//
// Singleton per scelta: cosi' passando dal capitolo 3 al capitolo 5 non si ricarica niente,
// e i file creati al capitolo 3 sono ancora li'. E' anche realistico: una macchina sola,
// che porti con te.

import { V86 } from "../../vendor/v86/libv86.mjs";
import { IMAGE_BASE, VENDOR_BASE } from "../config.js";

// DEVONO coincidere con lab/build-state.mjs: v86 ripristina uno stato solo se il
// costruttore ha le stesse opzioni dell'originale.
const OPZIONI = {
    memory_size: 128 * 1024 * 1024,
    vga_memory_size: 2 * 1024 * 1024,
    uart1: true,                       // il canale di verifica
    // La seconda macchina. v86 dichiara quattro UART e le mette su due sole linee di
    // interruzione: ttyS0 e ttyS2 sull'IRQ 4, ttyS1 e ttyS3 sull'IRQ 3. Il canale di
    // verifica sta apposta sull'altra linea rispetto ai due terminali umani: e' quello
    // fragile (richiesta/risposta con timeout), mentre una battuta persa su un terminale
    // la ripara la battuta dopo.
    uart2: true,                       // il terminale del server
    // v86 cattura mouse e tastiera per la macchina emulata: registra un listener
    // `wheel` NON passivo su window e chiama preventDefault() su OGNI rotellina
    // della pagina — con l'effetto che il capitolo non si puo' piu' scorrere.
    // Qui non servono: le macchine si pilotano dalle seriali, non hanno uno schermo
    // VGA e nessuno usa la loro tastiera PS/2. Spegnerli restituisce la pagina a chi
    // legge. E niente speaker: v86 aprirebbe un AudioContext che il browser blocca
    // finche' non c'e' un gesto dell'utente, per un suono che non useremo mai.
    disable_mouse: true,
    disable_keyboard: true,
    disable_speaker: true,
    bzimage_initrd_from_filesystem: true,
    cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose " +
             "modules=virtio_pci tsc=reliable init_on_free=on console=ttyS0",
};

let emulatore = null;
let statoIniziale = null;      // copia dello snapshot, per il reset istantaneo
let prontaPromise = null;
const ascoltatoriProgresso = [];

export const onProgresso = fn => ascoltatoriProgresso.push(fn);
const progresso = (fase, frazione) => ascoltatoriProgresso.forEach(f => f(fase, frazione));

export function macchina() { return emulatore; }

/** Avvia (una volta sola) e restituisce l'emulatore pronto all'uso. */
export function avvia() {
    if (prontaPromise) return prontaPromise;

    prontaPromise = (async () => {
        progresso("scarico", 0);

        // Scarichiamo lo snapshot a mano invece di lasciarlo a v86: cosi' possiamo
        // mostrare una barra onesta e soprattutto TENERLO per il reset istantaneo.
        const risposta = await fetch(`${IMAGE_BASE}state.bin.zst`);
        if (!risposta.ok) throw new Error(`immagine non compilata (${risposta.status})`);
        const totale = +risposta.headers.get("content-length") || 0;
        const pezzi = [];
        let letti = 0;
        const reader = risposta.body.getReader();
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            pezzi.push(value); letti += value.length;
            if (totale) progresso("scarico", letti / totale);
        }
        const buf = new Uint8Array(letti);
        let off = 0; for (const p of pezzi) { buf.set(p, off); off += p.length; }
        statoIniziale = buf;

        progresso("avvio", 1);
        emulatore = new V86({
            ...OPZIONI,
            wasm_path: `${VENDOR_BASE}v86/v86.wasm`,
            bios:     { url: `${VENDOR_BASE}v86/seabios.bin` },
            vga_bios: { url: `${VENDOR_BASE}v86/vgabios.bin` },
            autostart: true,
            // Con initial_state, basefs va OMESSO: v86 lo ignorerebbe comunque
            // ("Overridden by state image") e scaricarlo sarebbe puro spreco.
            filesystem: { baseurl: `${IMAGE_BASE}rootfs/` },
            initial_state: { buffer: statoIniziale.slice().buffer },
        });

        await new Promise(res => emulatore.add_listener("emulator-loaded", res));
        risveglia();
        progresso("pronta", 1);
        return emulatore;
    })();

    return prontaPromise;
}

/**
 * Dopo restore_state la macchina e' gia' al prompt e NON stampa nulla: il prompt
 * era stato emesso prima dello snapshot. Senza questo colpetto l'utente vede un
 * terminale nero e crede che sia rotto.
 */
export function risveglia() {
    // Ctrl-L, non "\n": un a-capo esegue un comando vuoto e lascia a schermo un
    // prompt in piu', come se qualcuno avesse premuto Invio al posto tuo. Ctrl-L
    // chiede a readline di ridisegnare il prompt e basta.
    //
    // E su TUTTE E DUE le seriali: le macchine sono due, e un terminale del
    // server che resta nero al primo caricamento sembra rotto esattamente come
    // sembrava rotto quello del pc prima che questo colpetto esistesse.
    setTimeout(() => {
        const ctrlL = new TextEncoder().encode("\x0c");
        emulatore?.serial_send_bytes(0, ctrlL);
        emulatore?.serial_send_bytes(2, ctrlL);
    }, 250);
}

/**
 * Reimposta la macchina allo stato di partenza. Istantaneo e senza rete: e' la
 * migliore rete di sicurezza didattica che esista — "hai fatto rm -rf /? Bene,
 * hai imparato una cosa vera. Premi Reimposta."
 */
export async function reimposta() {
    if (!emulatore || !statoIniziale) return;
    await emulatore.restore_state(statoIniziale.slice().buffer);
    // Il ripristino azzera anche l'agente: aspetta che sia di nuovo raggiungibile
    // prima di dire "pronta", altrimenti il primo `Verifica` dopo il reset fallisce.
    await new Promise(r => setTimeout(r, 400));
    risveglia();
}
