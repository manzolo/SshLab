riga=$(lab_sshd_dice 'Accepted publickey')
# L'impronta nella riga Accepted E' la risposta da consegnare: nel verdetto la
# riga si mostra mascherata, e niente want= (lo leggerebbe chi verifica a vuoto).
lab_fact sshd_dice "$(printf '%s' "${riga:-(nessun Accepted publickey)}" | sed 's/.*Accepted/Accepted/; s#SHA256:[A-Za-z0-9+/]*#SHA256:…#' | cut -c1-100)"
if [ -n "$riga" ]; then lab_check accesso-publickey-avvenuto 0
else lab_check accesso-publickey-avvenuto 1 "nessun Accepted"; fi
risposta=$(lab_answer_read)
lab_fact risposta "${risposta:-(nessuna risposta consegnata)}"
[ -n "$riga" ] && [ -n "$risposta" ] && printf '%s\n' "$riga" | grep -Fq " $risposta"
lab_check impronta-accettata $? "${risposta:-(nessuna)}"
lab_done
