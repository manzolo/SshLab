// exercises.js — il pannello degli esercizi e, soprattutto, il verdetto.
//
// La regola che governa questo file: un errore deve INSEGNARE.
// Ogni check fallito produce tre cose, in quest'ordine:
//   1. il fatto, dalla macchina, neutro          got=644 want=755
//   2. il perche', bilingue, dal chapter.js
//   3. la spinta: un comando per GUARDARE il problema, non la soluzione
// Il terzo punto e' la mossa vera: fallire ti consegna un comando di diagnosi.

import { t, tr } from "../i18n.js";
import { preparaEsercizio, verificaEsercizio, ricominciaEsercizio } from "../lab/runner.js";
import { semePer, nuovoSeme, segnaFatto, eFatto, annotaComandi } from "../storage.js";
import { scriviNota, scriviBlocco, pulisciTerminale, UART } from "../lab/terminal.js";
import { shell } from "../lab/agent.js";

const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
};

let capCorrente = null;
let esCorrente = null;
let contenitore = null;
let pronta = false;
let alCambio = () => {};

export function inizializzaEsercizi(nodo, onCambio) {
    contenitore = nodo;
    alCambio = onCambio || (() => {});
}

export function macchinaPronta(v) { pronta = v; }

export const esercizioCorrente = () => esCorrente;

export function disegnaEsercizi(cap) {
    capCorrente = cap;
    esCorrente = null;
    contenitore.replaceChildren();

    if (!cap.exercises?.length) return;

    contenitore.append(el("h3", "lab-titolo", t("esercizi")));

    cap.exercises.forEach((es, i) => {
        const idPieno = `${cap.id}.${es.id}`;
        const box = el("div", "es" + (eFatto(idPieno) ? " fatto" : ""));
        box.dataset.es = es.id;

        const testa = el("div", "es-testa");
        testa.append(
            el("span", "es-pallino"),
            el("span", "es-nome", t("esercizio", i + 1)),
            el("span", "es-tipo", es.tipo ? t("tipo" + es.tipo[0].toUpperCase() + es.tipo.slice(1)) : ""),
        );
        testa.onclick = () => apri(cap, es, box);
        box.append(testa);
        box.append(el("div", "es-corpo"));
        contenitore.append(box);
    });

    // Il primo non ancora fatto si apre da solo: e' quasi sempre quello che vuoi.
    const primo = cap.exercises.find(e => !eFatto(`${cap.id}.${e.id}`)) || cap.exercises[0];
    const nodo = contenitore.querySelector(`[data-es="${primo.id}"]`);
    if (nodo) apri(cap, primo, nodo);
}

async function apri(cap, es, box) {
    const gia = box.classList.contains("aperto");
    contenitore.querySelectorAll(".es").forEach(b => b.classList.remove("aperto"));
    if (gia) { esCorrente = null; return; }

    box.classList.add("aperto");
    esCorrente = es;
    const corpo = box.querySelector(".es-corpo");
    corpo.replaceChildren();
    corpo.append(el("p", "es-brief", tr(es.brief)));
    corpo.append(costruisciComeSiFa(es));

    // Nei capitoli locali non c'e' una macchina da interrogare: l'esercizio si fa
    // nel container, e la verifica la esegue `lab check`. Il pannello lo dice invece
    // di mostrare un bottone che non potrebbe funzionare.
    if (cap.runtime === "local") {
        const box2 = el("div", "locale");
        box2.append(el("h3", null, t("localeTitolo")));
        const cmd = `./lab/local/run.sh ${cap.num} ${es.id.replace("e", "")}\n` +
                    `docker exec -it linuxlab bash\n` +
                    `lab check ${cap.num} ${es.id.replace("e", "")}`;
        box2.append(el("pre", null, cmd));
        const b = el("button", "btn mini", t("localeCopia"));
        b.onclick = () => {
            navigator.clipboard?.writeText(cmd);
            b.textContent = t("localeCopiato");
            setTimeout(() => b.textContent = t("localeCopia"), 1600);
        };
        box2.append(b);
        corpo.append(box2);
        corpo.append(costruisciAiuti(es));
        return;
    }

    const barra = el("div", "es-barra");
    const btnVer = el("button", "btn primario", t("verifica"));
    const btnRic = el("button", "btn mini", t("labRicomincia"));
    const btnNuo = el("button", "btn mini", t("labNuovoMondo"));
    btnNuo.title = t("labNuovoMondoTitle");
    barra.append(btnVer, btnRic, btnNuo);
    corpo.append(barra);

    const zona = el("div");
    corpo.append(zona);
    corpo.append(costruisciAiuti(es));

    // I pulsanti restano spenti finche' il mondo non e' pronto. Prima erano
    // cliccabili ma senza gestore — perche' gli onclick venivano assegnati DOPO
    // l'await qui sotto — e cliccarli non faceva letteralmente niente.
    // (Segnalato da Andrea il 2026-08-16: «mi sembrano non fare niente».)
    btnVer.disabled = btnRic.disabled = btnNuo.disabled = true;

    // Prepara il mondo dell'esercizio nella macchina.
    const prepara = async (seme) => {
        try {
            await preparaEsercizio(cap.id, es.id, seme);
            // Il seed puo' aver rimescolato la rete: le etichette dei due riquadri
            // devono seguirlo, o mostrerebbero l'indirizzo del mondo di prima.
            const { aggiornaIndirizzi } = await import("../main.js");
            await aggiornaIndirizzi();
        }
        catch (e) { zona.replaceChildren(el("div", "controllo fail", e.message)); }
    };
    btnVer.onclick = async () => {
        btnVer.disabled = true;
        const testo = btnVer.textContent;
        btnVer.textContent = t("verificaInCorso");
        try {
            const v = await verificaEsercizio(cap.id, es.id);
            zona.replaceChildren(disegnaVerdetto(cap, es, v, box));
        } catch (e) {
            zona.replaceChildren(el("div", "controllo fail", t("erroreVerifica")));
        } finally {
            btnVer.disabled = false; btnVer.textContent = testo;
        }
    };
    // Ricomincia e Nuovo mondo agiscono sul filesystem della macchina: senza un
    // segno a schermo sembrano non fare niente finche' non digiti `ls`. Quindi:
    // pulsante occupato mentre lavora, banner nel terminale, e un `ls` mandato dal
    // canale di servizio cosi' il nuovo mondo si VEDE subito.
    // Fa vedere com'e' fatto il mondo adesso. L'`ls` lo esegue il canale di
    // servizio e il risultato viene STAMPATO nel terminale: non viene digitato,
    // cosi' non si mescola a quello che l'utente sta scrivendo.
    // Le macchine sono due, e un esercizio puo' rimescolare il mondo di entrambe:
    // il segno a schermo va dato dove serve. Il ~/.ssh del pc sul terminale del pc,
    // quello del server sul suo — chiedendolo dentro il namespace giusto.
    const mostraContenuto = async () => {
        try {
            const pc = await shell('ls -a "$LAB" /home/manzolo/.ssh 2>/dev/null | tail -n +2');
            scriviBlocco(UART.pc, pc.out?.trim() || "(niente ancora)");
            const srv = await shell('ls -a /home/deploy/.ssh 2>/dev/null | tail -n +2');
            scriviBlocco(UART.server, srv.out?.trim() || "(niente ancora)");
        } catch { /* se non risponde, pazienza: il banner c'e' comunque */ }
    };

    const conAttesa = async (btn, azione, nota) => {
        const testo = btn.textContent;
        btn.disabled = true; btn.textContent = "…";
        try {
            await azione();
            zona.replaceChildren();
            scriviNota(UART.pc, nota, 79);
            scriviNota(UART.server, nota, 179);
            await mostraContenuto();
        } catch (e) {
            zona.replaceChildren(el("div", "controllo fail", e.message));
        } finally { btn.disabled = false; btn.textContent = testo; }
    };
    btnRic.onclick = () => conAttesa(btnRic, () => ricominciaEsercizio(cap.id, es.id), t("labRicomincia"));
    btnNuo.onclick = () => conAttesa(btnNuo, () => prepara(nuovoSeme(`${cap.id}.${es.id}`)), t("labNuovoMondo"));

    // Solo adesso, con i gestori gia' collegati, si prepara il mondo e si accendono
    // i pulsanti. L'ordine e' la correzione: prima i gestori, poi l'attesa.
    if (pronta) {
        await prepara(semePer(`${cap.id}.${es.id}`));
        btnVer.disabled = btnRic.disabled = btnNuo.disabled = false;
    }
}

function disegnaVerdetto(cap, es, v, box) {
    const fuori = el("div", "verdetto" + (v.superato ? " ok" : ""));
    const perId = Object.fromEntries((es.checks || []).map(c => [c.id, c]));
    const proAttivo = document.body.classList.contains("pro");

    // Si mostrano i controlli in ordine didattico: i superati restano verdi, cosi'
    // si vede QUANTO si e' vicini invece di un binario passa/non passa.
    let primoFallito = true;
    for (const c of v.controlli) {
        const meta = perId[c.id] || {};
        if (meta.pro && !proAttivo) continue;

        const riga = el("div", "controllo " + (c.ok ? "pass" : "fail") + (meta.pro ? " pro-tag" : ""));
        riga.append(el("span", null, `<b>${c.id}</b>${meta.pro ? ` <em>(${t("checkPro")})</em>` : ""}`));

        if (!c.ok) {
            const dettagli = [c.got && `got=${c.got}`, c.want && `want=${c.want}`, c.at && `at=${c.at}`].filter(Boolean);
            if (dettagli.length) riga.append(el("span", "fatto-macchina", dettagli.join("   ")));
            if (primoFallito) {
                // Solo il primo fallito riceve il trattamento completo: sommergere di
                // spiegazioni tutti i controlli rotti non aiuta nessuno.
                if (meta.why) riga.append(el("span", "perche", tr(meta.why)));
                if (meta.nudge) riga.append(el("span", "spinta", `<b>${t("provaQuesto")}:</b> ${tr(meta.nudge)}`));
                primoFallito = false;
            }
        }
        fuori.append(riga);
    }

    // "Cosa ha visto la macchina": si apre anche quando passi. Vedere lo stato con
    // gli occhi del verificatore e' meta' della didattica.
    if (v.fatti.length) {
        const d = el("details", "sonda");
        d.append(el("summary", null, t("cosaHaVisto")));
        const tb = el("table");
        for (const f of v.fatti) {
            const r = el("tr");
            r.append(el("td", null, f.chiave), el("td", null, escapa(f.valore)));
            tb.append(r);
        }
        d.append(tb);
        fuori.append(d);
    }

    if (v.superato) {
        const idPieno = `${cap.id}.${es.id}`;
        const conPro = proAttivo && (es.checks || []).some(c => c.pro);
        segnaFatto(idPieno, conPro);
        box.classList.add("fatto");
        annotaComandi(cap.commands || [], cap.num);
        alCambio();
    }
    return fuori;
}

// Suggerimenti progressivi: si aprono uno alla volta, l'ultimo e' la soluzione.
/** "Come si fa": i passi dell'esercizio, con i comandi, SEMPRE visibili.
 *
 *  Non e' un suggerimento — quelli restano a scomparsa, e servono a chi si e'
 *  incagliato. Questo e' il minimo per poter cominciare: quali comandi esistono e
 *  su quale delle due macchine si scrivono. Senza, l'esercizio chiede di fare una
 *  cosa senza dire con quali attrezzi, e chi non conosce gia' la risposta resta
 *  fermo davanti a un cursore che lampeggia.
 *
 *  Ogni passo dichiara la macchina (`dove`), perche' in un lab a due host "su quale
 *  scrivo" e' meta' della domanda. */
function costruisciComeSiFa(es) {
    const box = el("div", "come");
    if (!es.come?.length) return box;
    box.append(el("h4", null, t("comeSiFa")));
    const ol = el("ol");
    for (const passo of es.come) {
        const li = el("li");
        if (passo.dove) {
            const tag = el("span", `dove dove-${passo.dove}`, passo.dove);
            li.append(tag);
        }
        li.insertAdjacentHTML("beforeend", tr(passo.testo));
        if (passo.cmd) {
            // textContent, non innerHTML: i comandi contengono segnaposto come
            // `<indirizzo>`, che come HTML sarebbero un tag sconosciuto e
            // sparirebbero. A video restava `lab answer` — cioe' l'istruzione senza
            // la cosa da scrivere, che e' peggio di nessuna istruzione.
            const c = el("code", "come-cmd");
            c.textContent = passo.cmd;
            li.append(c);
        }
        ol.append(li);
    }
    box.append(ol);
    if (es.nota) box.append(el("p", "come-nota", tr(es.nota)));
    return box;
}

function costruisciAiuti(es) {
    const box = el("div", "aiuto");
    let mostrati = 0;
    const btn = el("button", "btn mini", t("suggerimento"));
    const zona = el("div");
    btn.onclick = () => {
        const h = es.hints?.[mostrati];
        if (!h) return;
        zona.append(el("p", null, tr(h)));
        mostrati++;
        if (mostrati >= (es.hints?.length || 0)) btn.remove();
        else btn.textContent = mostrati === (es.hints.length - 1) ? t("soluzione") : t("suggerimentoAltro");
    };
    if (es.hints?.length) box.append(btn, zona);
    return box;
}

const escapa = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
