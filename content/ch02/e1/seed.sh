# Si parte senza identita' SSH: l'esercizio deve creare una coppia nuova.
rm -rf /home/manzolo/.ssh /home/deploy/.ssh
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
lab_log_azzera
mkdir -p "$LAB"
:
