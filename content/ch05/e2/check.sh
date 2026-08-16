riga=$(lab_sshd_dice 'Accepted publickey')
attesa=$(cat "$LAB_STATE/fp_attesa")
printf '%s\n' "$riga" | grep -Fq " $attesa"
lab_check percorso-esplicito $? "${riga:-(nessun Accepted)}" "Accepted publickey $attesa"

[ ! -e /home/manzolo/.ssh/id_ed25519 ]
lab_check privata-non-rimessa $? "$(test -e /home/manzolo/.ssh/id_ed25519 && echo presente || echo assente)" "assente"
lab_done
