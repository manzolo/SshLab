// main.js — cablaggio: lingua, profondità, navigazione, macchina, esercizi.

import { initLang, setLang, getLang, onLangChange, refreshStatic, t } from "./i18n.js";
import { get, set, progressiFatti } from "./storage.js";
import { CAPITOLI, capitolo, primoCapitolo } from "../content/index.js";
import { disegnaCapitolo } from "./ui/chapter.js";
import { inizializzaEsercizi, disegnaEsercizi, macchinaPronta, esercizioCorrente } from "./ui/exercises.js";
import { apriSommario, apriIntro, apriQuaderno } from "./ui/overlays.js";
import { avvia, onProgresso, reimposta } from "./lab/machine.js";
import { attendiAgente } from "./lab/agent.js";
import { creaTerminale, adatta, pulisciTerminale, scriviNota } from "./lab/terminal.js";

const $ = id => document.getElementById(id);
let idCorrente = null;

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

async function vaiA(id, spingiUrl = true) {
    let cap;
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
    disegnaEsercizi(cap);
    aggiornaPiede(cap);
    aggiornaProgresso();
}

function aggiornaPiede(cap) {
    const i = CAPITOLI.findIndex(c => c.id === cap.id);
    $("btnPrec").disabled = i <= 0;
    $("btnSucc").disabled = i >= CAPITOLI.length - 1;
    $("etichettaCap").textContent = t("capDi", cap.num, CAPITOLI.length);
}

function aggiornaProgresso() {
    const i = CAPITOLI.findIndex(c => c.id === idCorrente);
    $("barraProgresso").style.width = `${((i + 1) / CAPITOLI.length) * 100}%`;
}

const salta = d => {
    const i = CAPITOLI.findIndex(c => c.id === idCorrente) + d;
    if (i >= 0 && i < CAPITOLI.length) vaiA(CAPITOLI[i].id);
};
$("btnPrec").onclick = () => salta(-1);
$("btnSucc").onclick = () => salta(1);

document.addEventListener("keydown", e => {
    if (e.target.closest(".terminale") || !$("velo").hidden) return;
    if (e.key === "ArrowLeft") salta(-1);
    if (e.key === "ArrowRight") salta(1);
});

$("btnIndice").onclick = () => apriSommario(idCorrente, vaiA);
$("btnIntro").onclick = () => apriIntro();
$("btnQuaderno").onclick = apriQuaderno;

onLangChange(() => { refreshStatic(); if (idCorrente) vaiA(idCorrente, false); });

// ------------------------------------------------------------------ macchina

const stato = $("labStato");
onProgresso((fase, frazione) => {
    if (fase === "scarico") stato.textContent = t("labScarico", Math.round(frazione * 100));
    if (fase === "avvio") stato.textContent = t("labAvvio");
    if (fase === "pronta") { stato.textContent = t("labPronta"); stato.className = "lab-stato pronta"; }
});

// Reimposta la macchina: il ripristino dello snapshot blocca la pagina per qualche
// secondo, e senza segni a schermo sembra che non sia successo niente — lo scrollback
// resta identico. Quindi: bottone occupato, terminale SVUOTATO, banner, e l'esercizio
// corrente riseminato (dopo il ripristino il suo mondo non c'e' piu').
$("btnReimposta").onclick = async () => {
    const btn = $("btnReimposta");
    const testo = btn.textContent;
    btn.disabled = true; btn.textContent = "…";
    stato.textContent = "…";
    try {
        await reimposta();
        pulisciTerminale();
        scriviNota(t("labReimposta"), 79);
        await riseminaEsercizioCorrente();
    } finally {
        btn.disabled = false; btn.textContent = testo;
        stato.textContent = t("labPronta");
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

inizializzaEsercizi($("esercizi"), aggiornaProgresso);

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
        creaTerminale($("terminale"));
        await attendiAgente();
        macchinaPronta(true);
        await vaiA(idCorrente, false);   // ridisegna gli esercizi ora che la macchina c'e'
    } catch (e) {
        stato.className = "lab-stato errore";
        stato.innerHTML = t("labErrore");
        console.error(e);
    }
})();

addEventListener("resize", () => adatta($("terminale")));

// Gancio per i test end-to-end (tools/e2e.mjs). Non e' un'API pubblica.
import * as agente from "./lab/agent.js";
import * as runner from "./lab/runner.js";
import * as termmod from "./lab/terminal.js";
window.__linuxlab = { agente, runner, term: termmod, vaiA, capitolo, get stato() { return stato.textContent; } };
