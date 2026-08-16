#!/usr/bin/env node
// Crea lo scheletro di un capitolo nuovo, con i dieci blocchi e i TODO.
//
// Esiste per una ragione sola: scrivere un capitolo non deve mai cominciare dal
// foglio bianco. La struttura e' decisa una volta, e da li' in poi si riempiono
// le caselle.
//
// Uso:  node tools/new-chapter.mjs 23 nome-del-capitolo [--esercizi 3] [--local]

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const arg = process.argv.slice(2);
const num = parseInt(arg[0], 10);
const slug = arg[1];
const nEs = parseInt(arg[arg.indexOf("--esercizi") + 1], 10) || 3;
const locale = arg.includes("--local");

if (!num || !slug) {
    console.error("uso: node tools/new-chapter.mjs <numero> <slug> [--esercizi N] [--local]");
    process.exit(1);
}

const id = `ch${String(num).padStart(2, "0")}`;
const dir = path.join(ROOT, "content", id);
if (fs.existsSync(dir)) { console.error(`${id} esiste già`); process.exit(1); }

const bl = (it, en) => `{ it: \`${it}\`,\n            en: \`${en}\` }`;

const esercizi = Array.from({ length: nEs }, (_, i) => `        {
            id: "e${i + 1}", tipo: "stato",   // stato | risposta | metodo
            brief: {
                it: \`TODO: la consegna. Concreta, e con la ragione per cui il mondo cambia
                     a ogni sessione se serve dirlo.\`,
                en: \`TODO: the task.\`,
            },
            checks: [
                { id: "todo-id",   // DEVE combaciare con l'id emesso da check.sh
                  why: { it: "TODO: perché questo controllo esiste, in una frase che insegna.",
                         en: "TODO: why this check exists." },
                  nudge: { it: "TODO: un comando per GUARDARE il problema, non la soluzione.",
                           en: "TODO: a command to LOOK at the problem, not the solution." } },
            ],
            hints: [
                { it: "TODO: primo suggerimento — indica la direzione.", en: "TODO." },
                { it: "TODO: secondo — restringe.", en: "TODO." },
                { it: "TODO: terzo — la soluzione.", en: "TODO." },
            ],
        },`).join("\n");

const chapter = `export default {
    id: "${id}", num: ${num}, runtime: "${locale ? "local" : "browser"}", requires: ["ch${String(num - 1).padStart(2, "0")}"], draft: true,
    title: { it: "TODO", en: "TODO" },
    oneLiner: { it: "TODO: l'obiettivo in una riga.", en: "TODO: the goal in one line." },
    commands: [],
    glossary: [],

    blocks: [
        { kind: "hook", html: ${bl("TODO: tre righe, una situazione vera.", "TODO: three lines, a real situation.")} },
        { kind: "lead", html: ${bl("TODO: cosa ti porti a casa.", "TODO: what you take away.")} },
        { kind: "analogy", html: ${bl("TODO: UNA sola analogia, con un'immagine mentale.", "TODO: ONE analogy.")} },
        { kind: "shown", lines: [
            { cmd: "TODO", out: "TODO",
              note: ${bl("TODO: cosa guardare in questa riga.", "TODO: what to look at here.")} },
        ] },
${locale ? `        { kind: "local", html: ${bl("TODO: PERCHÉ non gira nel browser. Il motivo tecnico è contenuto, non una scusa.", "TODO: WHY it does not run in the browser.")},
            cmd: "./lab/local/run.sh ${num} 1\\ndocker exec -it linuxlab bash" },
        { kind: "transcript", src: "transcript.json" },
        { kind: "predict",
          domanda: ${bl("TODO: cosa succede se…?", "TODO: what happens if…?")},
          opzioni: [
              { testo: ${bl("TODO giusta", "TODO right")}, giusta: true },
              { testo: ${bl("TODO plausibile", "TODO plausible")}, giusta: false },
          ],
          spiegazione: ${bl("TODO: il perché, che è la vera lezione.", "TODO: the why.")} },
` : `        { kind: "lab" },
`}        { kind: "pro", html: ${bl("<p>TODO: come funziona sotto, e cosa si rompe.</p>", "<p>TODO: how it works underneath, and what breaks.</p>")} },
        { kind: "pitfalls", items: [
            ${bl("<strong>TODO</strong> — dove sbagliano tutti.", "<strong>TODO</strong>")},
        ] },
        { kind: "recap", table: [
            { cmd: "TODO", what: { it: "TODO", en: "TODO" }, flag: { it: "TODO", en: "TODO" } },
        ] },
    ],

    exercises: [
${esercizi}
    ],
};
`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "chapter.js"), chapter);

for (let i = 1; i <= nEs; i++) {
    const e = path.join(dir, `e${i}`);
    fs.mkdirSync(e);
    fs.writeFileSync(path.join(e, "seed.sh"),
`# Prepara il mondo. L'agente azzera gia' $LAB prima di chiamarti.
# Tutto cio' che varia deve passare da edu_rand_*: e' li' che vive l'anti-trucco.
mkdir -p "$LAB"
:
`);
    fs.writeFileSync(path.join(e, "check.sh"),
`# Asserire l'INVARIANTE, mai la forma del comando usato.
# Se qui compare un grep sul comando dell'utente, e' scritto male.
lab_fact cosa_ho_guardato "TODO"
lab_check todo-id 1 "(TODO)" "TODO"
lab_done
`);
    fs.writeFileSync(path.join(e, "solution.sh"), "# La soluzione di riferimento. I test la eseguono su tre semi diversi.\n");
    fs.writeFileSync(path.join(e, "cheat.sh"), "# Un tentativo di barare plausibile. I test pretendono che FALLISCA.\n");
}

// L'indice si aggiorna a mano: e' una riga, e vederla passare sotto gli occhi
// e' l'unico momento in cui si decide davvero che il capitolo esiste.
console.log(`creato content/${id}/ con ${nEs} esercizi.

Adesso:
  1. aggiungi la riga in content/index.js:
       { id: "${id}", num: ${num}, runtime: "${locale ? "local" : "browser"}", carica: () => import("./${id}/chapter.js") },
  2. riempi i TODO in content/${id}/chapter.js
  3. quando è pronto, togli  draft: true
  4. npm test && npm run test:labs ${id}`);
