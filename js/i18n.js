// i18n — due meccanismi, come nei fratelli della collana:
//   t(chiave, ...arg)   dizionari piatti per la "chrome" (bottoni, etichette, messaggi)
//   tr({it, en})        contenuti dei capitoli, che vivono nei chapter.js
// Priorita' della lingua: ?lang= nell'URL > scelta salvata > lingua del browser > en.

import IT from "./strings/it.js";
import EN from "./strings/en.js";
import { get, set } from "./storage.js";

const DIZ = { it: IT, en: EN };
const LINGUE = ["it", "en"];
const ascoltatori = [];
let lingua = "en";

export function initLang() {
    const url = new URLSearchParams(location.search).get("lang");
    const salvata = get("lang");
    const browser = (navigator.language || "en").slice(0, 2);
    lingua = [url, salvata, browser].find(l => LINGUE.includes(l)) || "en";
    sincronizzaUrl();
    return lingua;
}

export const getLang = () => lingua;

export function setLang(l) {
    if (!LINGUE.includes(l) || l === lingua) return;
    lingua = l;
    set("lang", l);
    sincronizzaUrl();
    refreshStatic();
    ascoltatori.forEach(fn => fn(l));
}

// L'URL resta un link condivisibile che forza la lingua.
function sincronizzaUrl() {
    const u = new URL(location.href);
    u.searchParams.set("lang", lingua);
    history.replaceState(null, "", u);
    document.documentElement.lang = lingua;
}

export function onLangChange(fn) { ascoltatori.push(fn); }

export function t(chiave, ...arg) {
    const s = DIZ[lingua][chiave] ?? DIZ.en[chiave] ?? chiave;
    return arg.length ? arg.reduce((acc, v, i) => acc.replaceAll(`{${i}}`, v), s) : s;
}

// tr accetta {it, en}; una stringa semplice passa invariata (comodo per i valori tecnici)
export function tr(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[lingua] ?? obj.en ?? obj.it ?? "";
}

// Riscrive il testo statico marcato nell'HTML. Va chiamata PRIMA dei listener,
// cosi' chi si ridisegna trova la chrome gia' tradotta.
export function refreshStatic(radice = document) {
    radice.querySelectorAll("[data-i18n]").forEach(e => e.textContent = t(e.dataset.i18n));
    radice.querySelectorAll("[data-i18n-html]").forEach(e => e.innerHTML = t(e.dataset.i18nHtml));
    radice.querySelectorAll("[data-i18n-title]").forEach(e => e.title = t(e.dataset.i18nTitle));
    radice.querySelectorAll("[data-i18n-aria]").forEach(e => e.setAttribute("aria-label", t(e.dataset.i18nAria)));
    radice.querySelectorAll("[data-i18n-placeholder]").forEach(e => e.placeholder = t(e.dataset.i18nPlaceholder));
}
