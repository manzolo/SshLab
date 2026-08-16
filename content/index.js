// L'indice dei capitoli. Elenca SOLO quelli che esistono davvero.
//
// I capitoli non ancora scritti compaiono lo stesso nel sommario, disattivati ma
// con il loro obiettivo visibile: la roadmap sta dentro il prodotto. Un vuoto
// dichiarato toglie l'ansia meglio di un vuoto nascosto.
//
// Qui non c'e' il campo `runtime` del lab fratello: la' serviva perche' alcuni
// capitoli giravano in un container Docker sul computer di chi studia. Qui tutto
// gira nel browser, comprese le due macchine — che e' il punto.

export const CAPITOLI = [
    { id: "ch01", num: 1, carica: () => import("./ch01/chapter.js") },
    { id: "ch02", num: 2, carica: () => import("./ch02/chapter.js") },
    { id: "ch03", num: 3, carica: () => import("./ch03/chapter.js") },
    { id: "ch04", num: 4, carica: () => import("./ch04/chapter.js") },
    { id: "ch05", num: 5, carica: () => import("./ch05/chapter.js") },
    { id: "ch06", num: 6, carica: () => import("./ch06/chapter.js") },
    { id: "ch07", num: 7, carica: () => import("./ch07/chapter.js") },
    { id: "ch08", num: 8, carica: () => import("./ch08/chapter.js") },
];

// Quello che verra', dichiarato prima di essere scritto (vedi sopra).
export const IN_ARRIVO = [
    { num: 9,  titolo: { it: "La passphrase", en: "The passphrase" } },
    { num: 10, titolo: { it: "ssh-agent", en: "ssh-agent" } },
    { num: 11, titolo: { it: "Troppe chiavi: IdentitiesOnly", en: "Too many keys: IdentitiesOnly" } },
    { num: 12, titolo: { it: "Ruotare una chiave senza chiudersi fuori", en: "Rotating a key without locking yourself out" } },
];

const cache = new Map();

export async function capitolo(id) {
    if (cache.has(id)) return cache.get(id);
    const voce = CAPITOLI.find(c => c.id === id);
    if (!voce) throw new Error(`capitolo sconosciuto: ${id}`);
    const mod = await voce.carica();
    const cap = { ...voce, ...mod.default };
    cache.set(id, cap);
    return cap;
}

export const primoCapitolo = () => CAPITOLI[0].id;
