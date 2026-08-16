# Componenti di terze parti

Questo sito **ridistribuisce software di altri**: l'emulatore, il terminale, il BIOS e — cosa
che si dimentica facilmente — un intero rootfs Alpine Linux, cioè centinaia di binari con le
loro licenze. Qui c'è l'elenco.

## Nel repository

| Componente | Versione | Licenza | Dove |
|---|---|---|---|
| [v86](https://github.com/copy/v86) | 0.5.432 (npm) | BSD-2-Clause | `vendor/v86/` |
| ↳ `fs2json.py`, `copy-to-sha256.py` | dallo stesso progetto | BSD-2-Clause | `vendor/v86/tools/` |
| [xterm.js](https://github.com/xtermjs/xterm.js) | 5.5.0 | MIT | `vendor/xterm/` |
| [SeaBIOS](https://www.seabios.org/) | come distribuito da v86 | LGPL-3.0 | `vendor/v86/seabios.bin` |
| VGABIOS | come distribuito da v86 | LGPL-2.1 | `vendor/v86/vgabios.bin` |

Il testo integrale delle licenze è nei rispettivi `vendor/*/LICENSE`.

## Nell'immagine pubblicata

Il rootfs servito da `images/rootfs/` è costruito da `lab/Dockerfile.v86` a partire da
**Alpine Linux 3.21** (`i386/alpine:3.21.0`) e contiene i pacchetti elencati in
`lab/packages.txt`. Le licenze sono quelle dei rispettivi progetti — in prevalenza GPL-2.0,
GPL-3.0, MIT e BSD.

L'immagine **non è nel repository**: viene costruita dalla CI (`lab/build-rootfs.sh`) e
pubblicata insieme al sito. L'inventario esatto, con versioni, è in `lab/packages.lock`,
rigenerato a ogni build da `apk info -v`.

I sorgenti di ogni pacchetto sono disponibili dai mirror ufficiali di Alpine, per esempio
<https://dl-cdn.alpinelinux.org/alpine/v3.21/main/> — come richiesto dalle licenze GPL per
chi ridistribuisce binari.

Il laboratorio locale (`lab/Dockerfile.local`) parte da **Debian trixie** e installa i
pacchetti elencati nel Dockerfile. Quell'immagine si costruisce sulla macchina di chi la usa e
non viene ridistribuita.

## Contenuti

Testi, esercizi e codice di questo lab: **MIT © Andrea Manzi (manzolo)**.

## Inventario dei pacchetti (generato)

Al momento dell'ultima build erano 145 pacchetti. Estratto:

```
acl-2.3.2-r1
acl-libs-2.3.2-r1
agetty-2.40.4-r1
agetty-openrc-0.55.1-r2
alpine-base-3.21.7-r0
alpine-baselayout-3.6.8-r0
alpine-baselayout-data-3.6.8-r0
alpine-conf-3.19.2-r0
alpine-keys-2.5-r0
alpine-release-3.21.0-r0
apk-tools-2.14.6-r2
attr-2.5.2-r2
bash-5.2.37-r0
bash-doc-5.2.37-r0
bc-1.07.1-r5
blkid-2.40.4-r1
brotli-libs-1.1.0-r2
busybox-1.37.0-r14
busybox-binsh-1.37.0-r14
busybox-extras-1.37.0-r14
…
```
