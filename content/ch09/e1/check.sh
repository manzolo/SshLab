ssh-keygen -y -P '' -f /home/manzolo/.ssh/id_ed25519 >/dev/null 2>&1
[ "$?" -ne 0 ]
lab_check privata-cifrata $? "passphrase vuota accettata" "passphrase vuota rifiutata"

prima=$(cat "$LAB_STATE/fp_prima")
dopo=$(lab_fp /home/manzolo/.ssh/id_ed25519)
lab_eq pubblica-invariata "$prima" "$dopo" /home/manzolo/.ssh/id_ed25519
lab_done
