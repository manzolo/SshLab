// overlays.js — il sommario e la guida "Basi", sullo stesso velo.

import { t, tr } from "../i18n.js";
import { CAPITOLI, IN_ARRIVO, capitolo } from "../../content/index.js";
import { progressiFatti } from "../storage.js";
import INTRO from "../strings/intro.js";

const velo = () => document.getElementById("velo");
const box  = () => document.getElementById("veloBox");

const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
};

export function chiudiVelo() { velo().hidden = true; }

function apriVelo(contenuto, testoChiusura = t("chiudi")) {
    box().replaceChildren(...contenuto);
    const riga = el("div", "chiudi-riga");
    const b = el("button", "btn primario", testoChiusura);
    b.onclick = chiudiVelo;
    riga.append(b);
    box().append(riga);
    velo().hidden = false;
}

velo()?.addEventListener("click", e => { if (e.target === velo()) chiudiVelo(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") chiudiVelo(); });

// ---------------------------------------------------------------- sommario

export async function apriSommario(idCorrente, vaiA) {
    const fatti = progressiFatti();
    const griglia = el("div", "toc");

    for (const voce of CAPITOLI) {
        const b = el("button");
        if (voce.id === idCorrente) b.classList.add("corrente");
        b.append(el("span", "n", String(voce.num).padStart(2, "0")));

        let cap = null;
        try { cap = await capitolo(voce.id); } catch { /* non ancora scritto */ }

        if (!cap || cap.draft) {
            // I capitoli non scritti restano visibili, con il loro obiettivo:
            // la roadmap sta dentro il prodotto, e un vuoto dichiarato non fa ansia.
            b.disabled = true;
            b.append(el("span", null, cap ? tr(cap.title) : "…"));
            b.append(el("span", "stato", t("inLavorazione")));
        } else {
            b.append(el("span", null, tr(cap.title)));
            const n = cap.exercises?.length || 0;
            const f = (cap.exercises || []).filter(e => fatti.has(`${cap.id}.${e.id}`)).length;
            b.append(el("span", "stato" + (n && f === n ? " pieno" : ""), n ? `${f}/${n}` : ""));
            b.onclick = () => { chiudiVelo(); vaiA(voce.id); };
        }
        griglia.append(b);
    }

    // I capitoli non ancora scritti stanno qui, spenti ma con il loro titolo. Erano
    // gia' dichiarati in content/index.js e nessuno li disegnava: il sommario si
    // fermava all'unico capitolo esistente, e insieme al bottone `Successivo` spento
    // faceva sembrare finito un corso che comincia appena. La roadmap sta DENTRO il
    // prodotto: un vuoto dichiarato toglie l'ansia meglio di un vuoto nascosto.
    for (const voce of IN_ARRIVO) {
        const b = el("button");
        b.disabled = true;
        b.append(el("span", "n", String(voce.num).padStart(2, "0")));
        b.append(el("span", null, tr(voce.titolo)));
        b.append(el("span", "stato", t("inLavorazione")));
        griglia.append(b);
    }

    apriVelo([el("h2", null, t("navIndice")), griglia]);
}

// ---------------------------------------------------------------- guida "Basi"

export function apriIntro(vaiAlPrimo) {
    const c = el("div");
    c.innerHTML = tr(INTRO);
    box().replaceChildren(el("h2", null, t("introTitolo")), c);
    const riga = el("div", "chiudi-riga");
    const b = el("button", "btn primario", t("introInizia"));
    b.onclick = () => { chiudiVelo(); vaiAlPrimo?.(); };
    riga.append(b);
    box().append(riga);
    velo().hidden = false;
}


