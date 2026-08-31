// main.js — cablaggio: lingua, profondità, navigazione, macchina, esercizi.

import { initLang, setLang, getLang, onLangChange, refreshStatic, t, tr } from "./i18n.js";
import { get, set } from "./storage.js";
import { CAPITOLI, IN_ARRIVO, capitolo, primoCapitolo } from "../content/index.js";
import { disegnaCapitolo } from "./ui/chapter.js";
import { inizializzaEsercizi, disegnaEsercizi, macchinaPronta, esercizioCorrente } from "./ui/exercises.js";
import { apriSommario, apriIntro, apriBasi } from "./ui/overlays.js";
import { avvia, onProgresso, reimposta } from "./lab/machine.js";
import { attendiAgente, annullaRichiesteInSospeso } from "./lab/agent.js";
import { creaTerminale, adatta, pulisciTerminale, scriviNota, suOutput, abilitaInputTerminali, UART } from "./lab/terminal.js";

const $ = id => document.getElementById(id);
let idCorrente = null;
let navigando = false;

// ------------------------------------------------------------------ lingua e profondità

initLang();
refreshStatic();
aggiornaSwitch("#switchLang", "lang", getLang());

$("switchLang").onclick = e => {
    const l = e.target.dataset.lang;
    if (l) { setLang(l); aggiornaSwitch("#switchLang", "lang", l); }
};

const profondita = get("depth", "base");
document.body.classList.toggle("pro", profondita === "pro");
aggiornaSwitch("#switchDepth", "depth", profondita);

$("switchDepth").onclick = e => {
    const d = e.target.dataset.depth;
    if (!d) return;
    set("depth", d);
    document.body.classList.toggle("pro", d === "pro");
    aggiornaSwitch("#switchDepth", "depth", d);
};

function aggiornaSwitch(sel, chiave, valore) {
    document.querySelectorAll(`${sel} button`).forEach(b =>
        b.classList.toggle("on", b.dataset[chiave] === valore));
}

// ------------------------------------------------------------------ navigazione

// Un cambio di lingua arrivato MENTRE il capitolo si sta ridisegnando non va perso:
// `vaiA` lo scarterebbe (navigando), la chrome cambierebbe lingua e il capitolo no —
// e non recupererebbe piu'. (Segnalato da Andrea il 2026-08-30 su FsLab.)
let ridisegnoInCoda = false;

async function vaiA(id, spingiUrl = true, opzioni = {}) {
    if (navigando) return;
    navigando = true;
    let cap;
    try {
        try { cap = await capitolo(id); }
        catch { cap = await capitolo(primoCapitolo()); id = cap.id; }

        idCorrente = id;
        set("page", id);
        if (spingiUrl) {
            const u = new URL(location.href);
            u.searchParams.set("ch", cap.num);
            history.replaceState(null, "", u);
        }

        disegnaCapitolo(cap, $("capitolo"), vaiA);
        aggiornaPiede(cap);
        $("btnPrec").disabled = $("btnSucc").disabled = true;
        await disegnaEsercizi(cap, opzioni);
        aggiornaProgresso();
    } finally {
        navigando = false;
        if (cap) aggiornaPiede(cap);
        if (ridisegnoInCoda) { ridisegnoInCoda = false; vaiA(idCorrente, false, { soloTesto: true }); }
    }
}

// Il totale e' quello del CORSO, non quello dei capitoli gia' scritti: dodici.
// Dire "1 di 1" mentre il sommario ne annuncia dodici e' la stessa bugia detta due
// volte, e per giunta con la barra dei progressi al 100% quando si e' appena
// cominciato.
const TOTALE = CAPITOLI.length + IN_ARRIVO.length;

function aggiornaPiede(cap) {
    const i = CAPITOLI.findIndex(c => c.id === cap.id);
    $("btnPrec").disabled = i <= 0;

    // Il capitolo dopo puo' non essere ancora scritto. In quel caso il bottone
    // resta spento — non c'e' dove andare — ma il piede DICE perche' e quale sara':
    // un bottone morto senza spiegazione si legge come un guasto, ed e' il primo
    // posto dove si clicca quando si e' finito il capitolo.
    const succ = CAPITOLI[i + 1];
    const arrivo = IN_ARRIVO.find(c => c.num === cap.num + 1);
    $("btnSucc").disabled = !succ;

    const etichetta = $("etichettaCap");
    etichetta.replaceChildren(document.createTextNode(t("capDi", cap.num, TOTALE)));
    if (!succ && arrivo) {
        const nota = document.createElement("span");
        nota.className = "piede-nota";
        nota.textContent = t("capProssimo", tr(arrivo.titolo));
        etichetta.append(nota);
    }
}

function aggiornaProgresso() {
    const i = CAPITOLI.findIndex(c => c.id === idCorrente);
    $("barraProgresso").style.width = `${((i + 1) / TOTALE) * 100}%`;
}

const salta = d => {
    const i = CAPITOLI.findIndex(c => c.id === idCorrente) + d;
    if (i >= 0 && i < CAPITOLI.length) vaiA(CAPITOLI[i].id);
};
$("btnPrec").onclick = () => salta(-1);
$("btnSucc").onclick = () => salta(1);

// «Segnala un problema»: porta a una issue GitHub gia' compilata con cio' che un
// visitatore non penserebbe mai a scrivere — capitolo, lingua, stato del
// laboratorio e browser. L'href si costruisce AL CLICK, quando quei dati sono
// veri; l'href statico (issue vuota) resta il fallback se il modulo non parte.
$("linkSegnala").addEventListener("click", e => {
    const a = e.currentTarget;
    const cap = CAPITOLI.find(c => c.id === idCorrente);
    const titolo = `[cap ${cap ? cap.num : "?"}] `;
    const corpo = t("segnalaCorpo",
        location.href,
        cap ? t("capDi", cap.num, TOTALE) : "—",
        getLang(),
        $("labStato")?.textContent || "—",
        navigator.userAgent);
    a.href = `${a.href.split("?")[0]}?title=${encodeURIComponent(titolo)}&body=${encodeURIComponent(corpo)}`;
});

document.addEventListener("keydown", e => {
    // `.host`, non `.terminale`: i riquadri delle macchine sono due e si chiamano
    // cosi'. Sbagliare il selettore qui significa che la freccia destra premuta
    // dentro `vi` cambia capitolo.
    if (e.target.closest(".host") || !$("velo").hidden) return;
    if (e.key === "ArrowLeft") salta(-1);
    if (e.key === "ArrowRight") salta(1);
});

$("btnIndice").onclick = () => apriSommario(idCorrente, vaiA);
// "Basi" e' del CAPITOLO corrente: la teoria distillata di questa lezione,
// richiamabile mentre lavori. La guida globale resta linkata li' dentro
// (e si apre da sola alla prima visita, piu' sotto).
$("btnIntro").onclick = async () => apriBasi(await capitolo(idCorrente).catch(() => null));

// Cambiare lingua ridisegna solo il TESTO: il mondo nella macchina e' gia' quello
// giusto e riseminarlo cancellerebbe il lavoro fatto.
onLangChange(() => {
    refreshStatic();
    if (!idCorrente) return;
    if (navigando) { ridisegnoInCoda = true; return; }
    vaiA(idCorrente, false, { soloTesto: true });
});

// ------------------------------------------------------------------ macchina

const stato = $("labStato");
onProgresso((fase, frazione) => {
    let testo;
    if (fase === "scarico") testo = t("labScarico", Math.round(frazione * 100));
    if (fase === "avvio") testo = t("labAvvio");
    // `pronta` qui significa soltanto che v86 ha ripristinato lo snapshot. Il
    // mondo dell'esercizio deve ancora essere seminato: dichiarare gia' pronte le
    // macchine creava proprio il falso sblocco visibile al primo caricamento.
    if (fase === "pronta") testo = t("labPreparazione");
    if (!testo) return;
    stato.textContent = testo;
    stato.className = "lab-stato preparazione";
    if ($("pannelloLab").classList.contains("preparazione"))
        $("banco").dataset.busyLabel = testo;
});

// Reimposta la macchina: il ripristino dello snapshot blocca la pagina per qualche
// secondo, e senza segni a schermo sembra che non sia successo niente — lo scrollback
// resta identico. Quindi: bottone occupato, terminale SVUOTATO, banner, e l'esercizio
// corrente riseminato (dopo il ripristino il suo mondo non c'e' piu').
$("btnReimposta").onclick = async () => {
    const btn = $("btnReimposta");
    const testo = btn.textContent;
    btn.disabled = true; btn.textContent = "…";
    impostaBancoInPreparazione(true);
    try {
        await reimposta();
        // Le richieste scritte sulla seriale PRIMA del ripristino sono orfane:
        // rifiutarle subito sblocca la risemina qui sotto, che altrimenti si
        // accoderebbe a un fantasma fino al timeout.
        annullaRichiesteInSospeso(t("labReimpostaAnnullo"));
        pulisciTerminale();                     // tutti e due
        scriviNota(UART.pc, t("labReimposta"), 79);
        scriviNota(UART.server, t("labReimposta"), 179);
        await riseminaEsercizioCorrente();
    } finally {
        btn.disabled = false; btn.textContent = testo;
        impostaBancoInPreparazione(false);
    }
};

// Su telefono il terminale c'e' ma non e' praticabile: meglio dirlo che fingere.
const soloTocco = matchMedia("(pointer: coarse)").matches && innerWidth < 900;
if (soloTocco) {
    const a = document.createElement("div");
    a.className = "avviso-mobile";
    a.textContent = t("mobileAvviso");
    $("esercizi").before(a);
}

function impostaBancoInPreparazione(attiva) {
    abilitaInputTerminali(!attiva);
    $("pannelloLab").classList.toggle("preparazione", attiva);
    $("banco").setAttribute("aria-busy", String(attiva));
    if (attiva) $("banco").dataset.busyLabel = t("labPreparazione");
    else delete $("banco").dataset.busyLabel;
    stato.textContent = t(attiva ? "labPreparazione" : "labPronta");
    stato.className = attiva ? "lab-stato preparazione" : "lab-stato pronta";
}

inizializzaEsercizi($("esercizi"), aggiornaProgresso, impostaBancoInPreparazione);

// Il banco nasce occupato, non soltanto quando parte il seed. Lo snapshot mostra
// i prompt prima che il mondo del primo esercizio sia pronto: senza questo stato
// continuo i terminali sembrano utilizzabili per un istante e poi si ribloccano.
impostaBancoInPreparazione(true);

// Dopo un ripristino della macchina, il mondo dell'esercizio aperto e' sparito
// insieme al resto: va riseminato, o il primo `Verifica` fallirebbe senza motivo.
async function riseminaEsercizioCorrente() {
    const cap = await capitolo(idCorrente).catch(() => null);
    const es = esercizioCorrente();
    if (!cap || !es || cap.runtime === "local") return;
    const { preparaEsercizio } = await import("./lab/runner.js");
    const { semePer } = await import("./storage.js");
    await preparaEsercizio(cap.id, es.id, semePer(`${cap.id}.${es.id}`)).catch(() => {});
}

(async () => {
    const daUrl = new URLSearchParams(location.search).get("ch");
    const id = (daUrl && CAPITOLI.find(c => c.num === +daUrl)?.id) || get("page") || primoCapitolo();
    await vaiA(id, false);

    if (!get("introSeen")) { set("introSeen", true); apriIntro(); }

    try {
        await avvia();
        creaTerminale($("terminalePc"), UART.pc);
        creaTerminale($("terminaleServer"), UART.server);
        preparaBanco();
        await attendiAgente();
        macchinaPronta(true);
        // Gli indirizzi NON si leggono qui. Appena si apre un esercizio il suo seed
        // rimescola la rete, e mostrarli adesso vorrebbe dire scriverli due volte:
        // prima quelli dello snapshot, poi — un paio di secondi dopo, sotto gli occhi
        // di chi guarda — quelli veri. Un numero che cambia da solo sembra un guasto.
        // Quindi restano i puntini finche' il mondo non e' quello definitivo, e ci
        // pensa `prepara()` in ui/exercises.js.
        //
        // Rete di sicurezza: se il capitolo non ha esercizi da seminare, nessuno li
        // scriverebbe mai. Dopo qualche secondo li leggiamo comunque.
        setTimeout(() => { if ($("ipPc").textContent === "…") aggiornaIndirizzi(); }, 5000);
        await vaiA(idCorrente, false);   // ridisegna gli esercizi ora che la macchina c'e'
        // `disegnaEsercizi` toglie gia' la pausa dopo un seed. Questo serve per i
        // capitoli senza esercizi, che altrimenti resterebbero occupati per sempre.
        impostaBancoInPreparazione(false);
    } catch (e) {
        stato.className = "lab-stato errore";
        stato.innerHTML = t("labErrore");
        console.error(e);
    }
})();

// ------------------------------------------------------------------ il banco a due
//
// Tre cose, e sono tutte e tre "far vedere quello che sta succedendo":
// quale macchina ha la tastiera, come si passa all'altra, e — su schermo stretto,
// dove se ne vede una sola — che l'altra ha stampato qualcosa.

/** Gli indirizzi si CHIEDONO alla macchina: cambiano a ogni mondo, e un'etichetta
 *  ferma sarebbe una bugia a video proprio nel lab che insegna a non fidarsi delle
 *  etichette. Si aggiorna dopo ogni seed, non solo all'avvio. */
export async function aggiornaIndirizzi() {
    try {
        const { shell } = await import("./lab/agent.js");
        const pc  = (await shell("cat /run/lab/pc_ip")).out?.trim();
        const srv = (await shell("cat /run/lab/srv_ip")).out?.trim();
        if (pc)  $("ipPc").textContent = pc;
        if (srv) $("ipServer").textContent = srv;
    } catch { /* se la macchina non risponde, restano i puntini: meglio di un numero falso */ }
}

function preparaBanco() {
    const riquadri = { pc: $("hostPc"), server: $("hostServer") };
    const uartDi = { pc: UART.pc, server: UART.server };
    let mostrato = "pc";           // conta solo sotto i 760px

    // 1. il fuoco: chi ha la tastiera si accende, l'altro si smorza.
    for (const [nome, riquadro] of Object.entries(riquadri)) {
        const dentro = riquadro.querySelector(".xterm-helper-textarea") || riquadro;
        dentro.addEventListener("focus", () => segna(nome), true);
        riquadro.addEventListener("mousedown", () => segna(nome));
    }
    function segna(nome) {
        for (const [n, r] of Object.entries(riquadri)) r.classList.toggle("attivo", n === nome);
    }

    // 2. le schede, per lo schermo stretto
    const schede = $("schede");
    schede.onclick = e => {
        const nome = e.target.closest(".scheda")?.dataset.host;
        if (!nome) return;
        mostra(nome);
    };
    function mostra(nome) {
        mostrato = nome;
        for (const [n, r] of Object.entries(riquadri)) r.classList.toggle("mostrato", n === nome);
        schede.querySelectorAll(".scheda").forEach(b => {
            b.classList.toggle("on", b.dataset.host === nome);
            if (b.dataset.host === nome) b.querySelector(".pallino")?.setAttribute("hidden", "");
        });
        segna(nome);
        // xterm deve rimisurarsi: era in un contenitore largo zero finche' era
        // nascosto, e senza questo resta a 40 colonne finche' non si ridimensiona
        // la finestra.
        requestAnimationFrame(() => adatta(schermoDi(nome), uartDi[nome]));
        terminaleDi(nome)?.focus();
    }
    const schermoDi = n => n === "pc" ? $("terminalePc") : $("terminaleServer");
    const terminaleDi = n => riquadri[n].querySelector(".xterm-helper-textarea");
    mostra("pc");

    // 3. il pallino: se il server risponde mentre stai guardando il pc, si vede.
    suOutput(UART.server, () => {
        if (mostrato !== "server" && innerWidth <= 760) {
            schede.querySelector('[data-host="server"] .pallino')?.removeAttribute("hidden");
        }
    });

    // Il ridimensionamento va osservato per contenitore, non sulla finestra: aprire
    // un esercizio o far comparire il verdetto cambia l'altezza dei terminali senza
    // che la finestra si muova di un pixel, e il guest resterebbe convinto di avere
    // le righe di prima.
    //
    // Ma si osservano i RIQUADRI (.host), non gli schermi: dentro lo schermo ci vive
    // xterm, e ridimensionare xterm cambia lo schermo — che rimetterebbe in moto
    // l'osservatore, all'infinito. Il riquadro esterno lo decide solo il layout.
    if (window.ResizeObserver) {
        let attesa;
        const osservatore = new ResizeObserver(() => {
            clearTimeout(attesa);
            attesa = setTimeout(() => {
                adatta($("terminalePc"), UART.pc);
                adatta($("terminaleServer"), UART.server);
            }, 200);
        });
        osservatore.observe($("hostPc"));
        osservatore.observe($("hostServer"));
    }
}

addEventListener("resize", () => {
    adatta($("terminalePc"), UART.pc);
    adatta($("terminaleServer"), UART.server);
});

// Gancio per i test end-to-end (tools/e2e.mjs). Non e' un'API pubblica.
import * as agente from "./lab/agent.js";
import * as runner from "./lab/runner.js";
import * as termmod from "./lab/terminal.js";
window.__sshlab = { agente, runner, term: termmod, vaiA, capitolo, get stato() { return stato.textContent; } };
