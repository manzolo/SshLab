// L'indice dei capitoli. Elenca SOLO quelli che esistono davvero.
//
// I capitoli non ancora scritti compaiono lo stesso nel sommario, disattivati ma
// con il loro obiettivo visibile: la roadmap sta dentro il prodotto. Un vuoto
// dichiarato toglie l'ansia meglio di un vuoto nascosto.

export const CAPITOLI = [
    { id: "ch01", num: 1,  runtime: "browser", carica: () => import("./ch01/chapter.js") },
    { id: "ch02", num: 2,  runtime: "browser", carica: () => import("./ch02/chapter.js") },
    { id: "ch03", num: 3,  runtime: "browser", carica: () => import("./ch03/chapter.js") },
    { id: "ch04", num: 4,  runtime: "browser", carica: () => import("./ch04/chapter.js") },
    { id: "ch05", num: 5,  runtime: "browser", carica: () => import("./ch05/chapter.js") },
    { id: "ch06", num: 6,  runtime: "browser", carica: () => import("./ch06/chapter.js") },
    { id: "ch07", num: 7,  runtime: "browser", carica: () => import("./ch07/chapter.js") },
    { id: "ch08", num: 8,  runtime: "browser", carica: () => import("./ch08/chapter.js") },
    { id: "ch09", num: 9,  runtime: "browser", carica: () => import("./ch09/chapter.js") },
    { id: "ch10", num: 10, runtime: "browser", carica: () => import("./ch10/chapter.js") },
    { id: "ch11", num: 11, runtime: "browser", carica: () => import("./ch11/chapter.js") },
    { id: "ch12", num: 12, runtime: "browser", carica: () => import("./ch12/chapter.js") },
    { id: "ch13", num: 13, runtime: "browser", carica: () => import("./ch13/chapter.js") },
    { id: "ch14", num: 14, runtime: "browser", carica: () => import("./ch14/chapter.js") },
    { id: "ch15", num: 15, runtime: "browser", carica: () => import("./ch15/chapter.js") },
    { id: "ch16", num: 16, runtime: "browser", carica: () => import("./ch16/chapter.js") },
    { id: "ch17", num: 17, runtime: "local",   carica: () => import("./ch17/chapter.js") },
    { id: "ch18", num: 18, runtime: "local",   carica: () => import("./ch18/chapter.js") },
    { id: "ch19", num: 19, runtime: "local",   carica: () => import("./ch19/chapter.js") },
    { id: "ch20", num: 20, runtime: "local",   carica: () => import("./ch20/chapter.js") },
    { id: "ch21", num: 21, runtime: "local",   carica: () => import("./ch21/chapter.js") },
    { id: "ch22", num: 22, runtime: "local",   carica: () => import("./ch22/chapter.js") },
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
