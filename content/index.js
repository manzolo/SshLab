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
];

// Quello che verra', dichiarato prima di essere scritto (vedi sopra).
export const IN_ARRIVO = [
    { num: 2,  titolo: { it: "La coppia di chiavi", en: "The key pair" } },
    { num: 3,  titolo: { it: "L'impronta", en: "The fingerprint" } },
    { num: 4,  titolo: { it: "authorized_keys: entrare senza password", en: "authorized_keys: getting in without a password" } },
    { num: 5,  titolo: { it: "Chi firma cosa", en: "Who signs what" } },
    { num: 6,  titolo: { it: "known_hosts e la prima volta", en: "known_hosts and the first time" } },
    { num: 7,  titolo: { it: "«L'impronta è cambiata»", en: "“The fingerprint changed”" } },
    { num: 8,  titolo: { it: "Permessi: cosa pretende sshd", en: "Permissions: what sshd demands" } },
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
