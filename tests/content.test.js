// Test strutturali dei contenuti. Puro node:test, zero dipendenze, secondi.
//
// Non provano che gli esercizi funzionino (quello è tests/labs.mjs, che avvia la
// macchina vera): provano che un capitolo sia BEN FORMATO. Servono a fare in modo
// che un capitolo mal scritto non arrivi mai in produzione, e soprattutto a non
// doverlo rileggere a mano ogni volta.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const { CAPITOLI, capitolo } = await import(path.join(ROOT, "content/index.js"));

const LINGUE = ["it", "en"];
const BLOCCHI_NOTI = ["hook", "lead", "analogy", "shown", "lab", "pro", "pitfalls",
                      "recap", "local", "transcript", "predict"];

/** Cammina un oggetto e restituisce ogni coppia {it,en} che incontra, col suo percorso. */
function coppieBilingui(o, dove = "", trovate = []) {
    if (o == null || typeof o !== "object") return trovate;
    if (Array.isArray(o)) { o.forEach((v, i) => coppieBilingui(v, `${dove}[${i}]`, trovate)); return trovate; }
    const chiavi = Object.keys(o);
    if (chiavi.some(k => LINGUE.includes(k)) && chiavi.every(k => LINGUE.includes(k))) {
        trovate.push({ dove, obj: o });
        return trovate;
    }
    for (const k of chiavi) coppieBilingui(o[k], dove ? `${dove}.${k}` : k, trovate);
    return trovate;
}

const capitoliCaricati = [];
for (const voce of CAPITOLI) {
    try { capitoliCaricati.push(await capitolo(voce.id)); }
    catch (e) { capitoliCaricati.push({ id: voce.id, __errore: e.message }); }
}

test("ogni capitolo dell'indice esiste e si carica", () => {
    const rotti = capitoliCaricati.filter(c => c.__errore);
    assert.deepEqual(rotti.map(c => `${c.id}: ${c.__errore}`), []);
});

for (const cap of capitoliCaricati.filter(c => !c.__errore)) {
    test(`${cap.id} — struttura`, () => {
        assert.ok(cap.title && cap.oneLiner, "servono title e oneLiner");
        assert.ok(Array.isArray(cap.blocks) && cap.blocks.length, "servono dei blocchi");
        for (const b of cap.blocks) {
            assert.ok(BLOCCHI_NOTI.includes(b.kind), `${cap.id}: blocco sconosciuto "${b.kind}"`);
        }
        // Qui non c'e' il campo `runtime` del lab fratello: la' distingueva i capitoli
        // da fare in un container sul proprio computer, qui gira tutto nel browser —
        // due macchine comprese. Senza il blocco lab, pero', il capitolo non le
        // mostrerebbe affatto.
        assert.ok(cap.blocks.some(b => b.kind === "lab"), `${cap.id}: manca il blocco lab`);
    });

    test(`${cap.id} — bilingue completo`, () => {
        for (const { dove, obj } of coppieBilingui(cap)) {
            for (const l of LINGUE) {
                assert.ok(obj[l] && String(obj[l]).trim(), `${cap.id}.${dove}: manca "${l}"`);
            }
        }
    });

    test(`${cap.id} — prerequisiti esistenti e senza cicli`, () => {
        for (const r of cap.requires || []) {
            assert.ok(CAPITOLI.some(c => c.id === r), `${cap.id}: prerequisito inesistente "${r}"`);
            const suo = capitoliCaricati.find(c => c.id === r);
            assert.ok(!(suo?.requires || []).includes(cap.id), `${cap.id} e ${r} si richiedono a vicenda`);
            assert.ok(CAPITOLI.find(c => c.id === r).num < cap.num, `${cap.id}: il prerequisito ${r} viene dopo`);
        }
    });

    test(`${cap.id} — esercizi: file presenti e id coerenti`, () => {
        for (const es of cap.exercises || []) {
            const dir = path.join(ROOT, "content", cap.id, es.id);
            assert.ok(fs.existsSync(dir), `${cap.id}.${es.id}: cartella assente`);
            for (const f of ["seed.sh", "check.sh", "solution.sh", "cheat.sh"]) {
                assert.ok(fs.existsSync(path.join(dir, f)), `${cap.id}.${es.id}: manca ${f}`);
            }
            assert.ok(es.brief, `${cap.id}.${es.id}: manca la consegna`);
            assert.ok((es.checks || []).length, `${cap.id}.${es.id}: nessun check dichiarato`);
            assert.ok((es.hints || []).length >= 2, `${cap.id}.${es.id}: servono almeno due suggerimenti`);

            // Gli id dei check dichiarati nel chapter.js devono combaciare con quelli
            // emessi da check.sh: altrimenti il verdetto mostra un id senza spiegazione.
            const check = fs.readFileSync(path.join(dir, "check.sh"), "utf8");
            const emessi = new Set([...check.matchAll(/lab_(?:check|eq|answer_eq)\s+([A-Za-z0-9_-]+)/g)].map(m => m[1]));
            // Alcuni check.sh chiamano lab_check attraverso una funzione locale, passando
            // l'id come variabile: in quel caso il nome non e' letterale nella chiamata,
            // ma deve comunque comparire nel file. Si allarga la ricerca solo in quel caso.
            const indiretto = /lab_check\s+"?\$/.test(check);
            if (indiretto) {
                for (const m of check.matchAll(/\b([a-z0-9]+(?:-[a-z0-9]+)+)\b/g)) emessi.add(m[1]);
            }
            for (const c of es.checks) {
                assert.ok(emessi.has(c.id),
                    `${cap.id}.${es.id}: il check "${c.id}" è dichiarato ma check.sh non lo emette (emette: ${[...emessi].join(", ")})`);
                assert.ok(c.why && c.nudge, `${cap.id}.${es.id}.${c.id}: servono "why" e "nudge"`);
            }
            const dichiarati = new Set(es.checks.map(c => c.id));
            for (const e of indiretto ? [] : emessi) {
                assert.ok(dichiarati.has(e),
                    `${cap.id}.${es.id}: check.sh emette "${e}" ma il chapter.js non lo spiega`);
            }

            // Ogni check.sh deve chiudere con lab_done, o l'esito non viene mai calcolato.
            assert.match(check, /lab_done/, `${cap.id}.${es.id}: check.sh non chiama lab_done`);
        }
    });
}

test("i trascritti dichiarati sono stati generati", () => {
    for (const cap of capitoliCaricati.filter(c => !c.__errore)) {
        for (const b of cap.blocks.filter(b => b.kind === "transcript" && b.src)) {
            const f = path.join(ROOT, "content", cap.id, b.src);
            assert.ok(fs.existsSync(f),
                `${cap.id}: manca ${b.src} — esegui  node tools/gen-transcript.mjs ${cap.id}`);
            const d = JSON.parse(fs.readFileSync(f, "utf8"));
            assert.ok(d.steps?.length, `${cap.id}: ${b.src} è vuoto`);
        }
    }
});

test("le stringhe della chrome esistono in entrambe le lingue", async () => {
    const it = (await import(path.join(ROOT, "js/strings/it.js"))).default;
    const en = (await import(path.join(ROOT, "js/strings/en.js"))).default;
    const soloIt = Object.keys(it).filter(k => !(k in en));
    const soloEn = Object.keys(en).filter(k => !(k in it));
    assert.deepEqual(soloIt, [], "chiavi presenti solo in italiano");
    assert.deepEqual(soloEn, [], "chiavi presenti solo in inglese");
});
