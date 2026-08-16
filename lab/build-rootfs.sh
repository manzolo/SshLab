#!/usr/bin/env bash
# Costruisce il rootfs 9p che il browser carica su richiesta.
# Docker -> export -> fs2json -> copy-to-sha256, come in tools/docker/alpine di copy/v86.
set -euo pipefail
cd "$(dirname "$0")"

OUT=../images
TOOLS=../vendor/v86/tools
IMG=sshlab-v86
CNT=sshlab-build

# Budget dichiarato: la build fallisce se sforato. Un tetto misurato a ogni build
# e' l'unico modo per non svegliarsi tra sei mesi con 400 MB.
MAX_MB=${MAX_MB:-160}
MAX_FILES=${MAX_FILES:-9000}

mkdir -p "$OUT"

echo "==> docker build (linux/386)"
docker build . -f Dockerfile.v86 --platform linux/386 --rm --tag "$IMG"

echo "==> export del filesystem"
docker rm "$CNT" >/dev/null 2>&1 || true
docker create --platform linux/386 -t -i --name "$CNT" "$IMG" >/dev/null
docker export "$CNT" -o "$OUT/rootfs.tar"
docker rm "$CNT" >/dev/null
tar -f "$OUT/rootfs.tar" --delete ".dockerenv" 2>/dev/null || true

echo "==> fs.json (indice) e rootfs piatto indirizzato per hash"
"$TOOLS/fs2json.py" --zstd --out "$OUT/fs.json" "$OUT/rootfs.tar" >/dev/null
rm -rf "$OUT/rootfs" && mkdir -p "$OUT/rootfs"
"$TOOLS/copy-to-sha256.py" --zstd "$OUT/rootfs.tar" "$OUT/rootfs" >/dev/null
rm -f "$OUT/rootfs.tar"

echo "==> inventario dei pacchetti (serve a THIRD-PARTY.md)"
docker run --rm --platform linux/386 "$IMG" apk info -v | sort > packages.lock

MB=$(du -sm "$OUT/rootfs" | cut -f1)
N=$(find "$OUT/rootfs" -type f | wc -l)
echo
echo "rootfs piatto: ${MB} MB in ${N} file  (tetto: ${MAX_MB} MB / ${MAX_FILES} file)"
echo "pacchetti:     $(wc -l < packages.lock)"

# Nota: il peso del piatto NON e' il peso scaricato. Con initial_state all'avvio non si
# scarica nulla del filesystem: solo i file toccati dopo il ripristino, uno per uno.
if [ "$MB" -gt "$MAX_MB" ] || [ "$N" -gt "$MAX_FILES" ]; then
    echo "ERRORE: budget dell'immagine sforato." >&2
    echo "Primo taglio consigliato: ridurre i pacchetti -doc ai soli comandi usati nei capitoli." >&2
    exit 1
fi
echo "OK"
