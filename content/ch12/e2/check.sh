nuova=$(cat "$LAB_STATE/fp_nuova")
riga=$(lab_sshd_dice 'Accepted publickey')
printf '%s\n' "$riga" | grep -Fq " $nuova"
lab_check nuova-provata $? "${riga:-(nessun Accepted)}" "Accepted publickey $nuova"

impronte=$(lab_fp /home/deploy/.ssh/authorized_keys)
vecchia=$(cat "$LAB_STATE/fp_vecchia")
printf '%s\n' "$impronte" | grep -Fqx "$vecchia" && printf '%s\n' "$impronte" | grep -Fqx "$nuova"
lab_check vecchia-ancora-presente $? "${impronte:-(nessuna)}" "$vecchia e $nuova"
lab_done
