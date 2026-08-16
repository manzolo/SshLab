// chapter.js — disegna un capitolo a partire dai suoi blocchi.
// I blocchi sono in ordine fisso: l'ordine fisso e' l'anti-stress vero, perche'
// scrivere un capitolo diventa "riempi le caselle" invece di "inventa la struttura".

import { t, tr } from "../i18n.js";
import { CAPITOLI } from "../../content/index.js";
import { CONTENT_BASE } from "../config.js";

const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
};

const disegnatori = {
    hook:   b => el("div", "blocco hook", tr(b.html)),
    lead:   b => el("div", "blocco lead", tr(b.html)),
    analogy: b => el("div", "blocco analogia", tr(b.html)),

    shown: b => {
        const box = el("div", "blocco mostra");
        for (const r of b.lines) {
            const riga = el("div", "mostra-riga");
            riga.append(el("div", "mostra-cmd", escapa(r.cmd)));
            if (r.out) riga.append(el("pre", "mostra-out", escapa(r.out)));
            if (r.note) riga.append(el("div", "mostra-nota", tr(r.note)));
            box.append(riga);
        }
        return box;
    },

    pro: b => {
        const box = el("div", "blocco probox");
        box.append(el("h3", null, t("bloccoPro")));
        box.insertAdjacentHTML("beforeend", tr(b.html));
        return box;
    },

    pitfalls: b => {
        const box = el("div", "blocco trappole");
        box.append(el("h3", null, t("bloccoTrappole")));
        const ul = el("ul");
        for (const i of b.items) ul.append(el("li", null, tr(i)));
        box.append(ul);
        return box;
    },

    recap: b => {
        const box = el("div", "blocco recap");
        box.append(el("h3", null, t("bloccoRecap")));
        const tb = el("table");
        tb.innerHTML = `<thead><tr><th>${t("recapComando")}</th><th>${t("recapCosa")}</th><th>${t("recapOpzione")}</th></tr></thead>`;
        const body = el("tbody");
        for (const r of b.table) {
            const tr_ = el("tr");
            tr_.append(el("td", null, escapa(r.cmd)), el("td", null, tr(r.what)), el("td", null, tr(r.flag)));
            body.append(tr_);
        }
        tb.append(body); box.append(tb);
        return box;
    },

    // I capitoli locali non sono capitoli mutilati: hanno la stessa anatomia,
    // cambia solo chi esegue il laboratorio.
    local: b => {
        const box = el("div", "blocco locale");
        box.append(el("h3", null, t("localeTitolo")));
        box.insertAdjacentHTML("beforeend", tr(b.html));
        if (b.cmd) {
            box.append(el("pre", null, escapa(b.cmd)));
            const btn = el("button", "btn mini", t("localeCopia"));
            btn.onclick = () => {
                navigator.clipboard?.writeText(b.cmd);
                btn.textContent = t("localeCopiato");
                setTimeout(() => btn.textContent = t("localeCopia"), 1600);
            };
            box.append(btn);
        }
        return box;
    },

    // Trascritto giocabile: l'output non e' inventato, lo produce tools/gen-transcript.mjs
    // eseguendo davvero i comandi nell'immagine locale. Se l'immagine cambia si
    // rigenera, e la differenza si vede nel diff.
    transcript: (b, cap) => {
        // I passi possono essere in linea oppure in un file generato (src)
        if (b.src) {
            const box = el("div", "blocco");
            fetch(`${CONTENT_BASE}${cap.id}/${b.src}`)
                .then(r => r.ok ? r.json() : null)
                .then(d => {
                    if (!d?.steps?.length) { box.remove(); return; }
                    box.replaceWith(disegnatori.transcript({ kind: "transcript", steps: d.steps }, cap));
                })
                .catch(() => box.remove());
            return box;
        }
        const box = el("div", "blocco");
        for (const p of b.steps) {
            const passo = el("div", "passo");
            passo.append(el("div", "passo-cmd", escapa(p.cmd)));
            const pre = el("pre", "passo-out");
            pre.innerHTML = evidenzia(escapa(p.out || ""), p.mark);
            pre.hidden = true;
            const btn = el("button", "btn mini", t("mostraOutput"));
            btn.onclick = () => { pre.hidden = false; btn.remove(); };
            passo.append(btn, pre);
            if (p.note) passo.append(el("div", "passo-nota", tr(p.note)));
            box.append(passo);
        }
        return box;
    },

    // Predici-prima-di-vedere: trasforma la lettura in esercizio, costa pochissimo
    // scriverla e si verifica in JS senza macchina virtuale.
    predict: b => {
        const box = el("div", "blocco predizione");
        box.append(el("h4", null, t("predizione")));
        box.append(el("p", null, tr(b.domanda)));
        const esito = el("div", "esito");
        b.opzioni.forEach((o, i) => {
            const btn = el("button", null, tr(o.testo));
            btn.onclick = () => {
                if (box.dataset.risposto) return;
                box.dataset.risposto = "1";
                box.querySelectorAll("button").forEach((x, j) => {
                    if (b.opzioni[j].giusta) x.classList.add("giusta");
                    else if (j === i) x.classList.add("sbagliata");
                });
                esito.innerHTML = `<b>${o.giusta ? t("predizioneGiusta") : t("predizioneSbagliata")}</b> ${tr(b.spiegazione)}`;
            };
            box.append(btn);
        });
        box.append(esito);
        return box;
    },

    lab: () => null,   // il laboratorio ha il suo pannello, non sta nel flusso del testo
};

function escapa(s) {
    return String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function evidenzia(testo, mark) {
    if (!mark) return testo;
    return testo.replace(escapa(mark), `<span class="evidenzia">${escapa(mark)}</span>`);
}

export function disegnaCapitolo(cap, contenitore, vaiA) {
    contenitore.replaceChildren();
    contenitore.scrollTop = 0;

    contenitore.append(el("div", "cap-numero", `${t("capDi", cap.num, CAPITOLI.length)}`));
    contenitore.append(el("h1", null, tr(cap.title)));
    contenitore.append(el("p", "cap-oneliner", tr(cap.oneLiner)));

    // I prerequisiti non bloccano: mostrano un cartello. Chi sa gia' salta, ed e' giusto.
    for (const req of cap.requires || []) {
        const num = CAPITOLI.find(c => c.id === req)?.num ?? req;
        const box = el("div", "prereq", t("prerequisito", num));
        const b = el("button", "btn mini", t("vaiA"));
        b.onclick = () => vaiA(req);
        box.append(b);
        contenitore.append(box);
    }

    for (const b of cap.blocks) {
        const n = disegnatori[b.kind]?.(b, cap);
        if (n) contenitore.append(n);
    }
}
