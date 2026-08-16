// storage — localStorage con prefisso e fallback in memoria.
// Il fallback non e' pignoleria: in navigazione privata localStorage lancia,
// e un lab che esplode perche' non puo' salvare i progressi e' un lab rotto.

const PREFIX = "linuxlab.";
const memoria = new Map();
let disponibile = (() => {
    try { const k = PREFIX + "_t"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; }
    catch { return false; }
})();

export function get(chiave, def = null) {
    try {
        const v = disponibile ? localStorage.getItem(PREFIX + chiave) : memoria.get(chiave);
        return v == null ? def : JSON.parse(v);
    } catch { return def; }
}

export function set(chiave, valore) {
    const v = JSON.stringify(valore);
    try { disponibile ? localStorage.setItem(PREFIX + chiave, v) : memoria.set(chiave, v); }
    catch { disponibile = false; memoria.set(chiave, v); }
}

// --- progressi -------------------------------------------------------------

export const progressiFatti = () => new Set(get("progress", []));
export const progressiPro   = () => new Set(get("pro", []));

export function segnaFatto(idEsercizio, conPro = false) {
    const p = progressiFatti(); p.add(idEsercizio); set("progress", [...p]);
    if (conPro) { const q = progressiPro(); q.add(idEsercizio); set("pro", [...q]); }
}

export const eFatto = id => progressiFatti().has(id);

// --- semi ------------------------------------------------------------------
// Il seme e' il cuore dell'anti-trucco: cambia a ogni esercizio e a ogni "nuovo mondo",
// quindi la risposta non e' cablabile. Deterministico una volta scelto.

export function semePer(idEsercizio) {
    const semi = get("seeds", {});
    if (!semi[idEsercizio]) {
        semi[idEsercizio] = 1 + Math.floor(Math.random() * 900000);
        set("seeds", semi);
    }
    return semi[idEsercizio];
}

export function nuovoSeme(idEsercizio) {
    const semi = get("seeds", {});
    semi[idEsercizio] = 1 + Math.floor(Math.random() * 900000);
    set("seeds", semi);
    return semi[idEsercizio];
}

// --- quaderno di bordo -----------------------------------------------------
// La ricompensa vera: i comandi incontrati risolvendo, non una medaglia.

export function annotaComandi(comandi, idCapitolo) {
    const q = get("quaderno", {});
    for (const c of comandi) if (!q[c]) q[c] = idCapitolo;
    set("quaderno", q);
}

export const quaderno = () => get("quaderno", {});
