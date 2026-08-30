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

// ---------------------------------------------------------------- basi del capitolo

/** Le basi del CAPITOLO corrente, richiamabili mentre si lavora giu' tra
 *  terminali ed esercizi: storia, immagine mentale, meccanismo e la tabella
 *  dei comandi con le trappole. Niente contenuto nuovo: e' la teoria che sta
 *  gia' in cima alla pagina, distillata in un velo che si apre da dove sei.
 *  (Chiesto da Andrea il 2026-08-30 su FsLab: un aiuto sul focus della lezione
 *  in corso; prima questo pulsante apriva solo la guida globale del laboratorio.) */
export function apriBasi(cap, vaiAlPrimo) {
    if (!cap) return apriIntro(vaiAlPrimo);
    const c = el("div", "basi");
    const blocco = kind => (cap.blocks || []).find(b => b.kind === kind);
    const sez = (titolo, bi) => { if (bi) c.append(el("h3", null, titolo), el("p", null, tr(bi))); };

    c.append(el("p", "basi-lineone", tr(cap.oneLiner)));
    sez(t("basiStoria"), blocco("hook")?.html);
    sez(t("basiImmagine"), blocco("analogy")?.html);
    sez(t("basiMeccanismo"), blocco("pro")?.html);

    const recap = blocco("recap");
    if (recap?.table?.length) {
        c.append(el("h3", null, t("basiComandi")));
        const tb = el("table", "basi-recap");
        for (const r of recap.table) {
            const riga = el("tr");
            riga.append(el("td", null, `<code>${r.cmd}</code>`),
                        el("td", null, `${tr(r.what)}<br><em>${tr(r.flag)}</em>`));
            tb.append(riga);
        }
        c.append(tb);
    }
    if (cap.glossary?.length)
        c.append(el("p", "basi-glossario", cap.glossary.map(g => `<code>${g}</code>`).join(" · ")));

    const bLab = el("button", "btn mini", t("basiLab"));
    bLab.onclick = () => apriIntro(vaiAlPrimo);
    c.append(bLab);

    apriVelo([el("h2", null, `${t("navIntro")} — ${tr(cap.title)}`), c]);
}

// ---------------------------------------------------------------- guida del laboratorio

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


