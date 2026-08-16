# Il nome resta familiare, il contenuto no: la chiave arriva dal pool in base al
# seme, quindi nessuna impronta scritta nel capitolo puo' essere la risposta.
rm -rf /home/manzolo/.ssh /home/deploy/.ssh
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
set -- 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16
scelta=$(edu_rand_pick 30 "$@")
install -m 644 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$scelta.pub" \
    /home/manzolo/.ssh/id_ed25519.pub
lab_log_azzera
mkdir -p "$LAB"
:
