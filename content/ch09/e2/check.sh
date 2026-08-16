fp=$(cat "$LAB_STATE/fp_backup")
riga=$(lab_sshd_dice 'Accepted publickey')
printf '%s\n' "$riga" | grep -Fq " $fp"
lab_check backup-ancora-valido $? "${riga:-(nessun Accepted)}" "Accepted publickey $fp"
lab_answer_eq impronta-backup "$fp"
lab_done
