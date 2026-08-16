// Percorsi degli artefatti. Tutti relativi: il sito deve funzionare servito da
// qualunque sottocartella (GitHub Pages lo mette sotto /LinuxLab/).
//
// `?images=` esiste per lo sviluppo: permette di puntare a un'immagine compilata
// altrove senza toccare il codice.
const p = new URLSearchParams(location.search);

export const IMAGE_BASE = p.get("images") || "./images/";
export const VENDOR_BASE = "./vendor/";
export const CONTENT_BASE = "./content/";
