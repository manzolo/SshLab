riga=$(lab_sshd_dice 'Accepted publickey')
lab_fact sshd_dice "$(printf '%s' "${riga:-(nessun Accepted publickey)}" | sed 's/.*Accepted/Accepted/' | cut -c1-100)"
[ -n "$riga" ]
lab_check accesso-publickey-avvenuto $? "nessun Accepted" "un login publickey registrato da sshd"

risposta=$(lab_answer_read)
lab_fact risposta "${risposta:-(nessuna risposta consegnata)}"
[ -n "$riga" ] && [ -n "$risposta" ] && printf '%s\n' "$riga" | grep -Fq " $risposta"
lab_check impronta-accettata $? "${risposta:-(nessuna)}" "l'impronta nell'ultima riga Accepted"
lab_done
