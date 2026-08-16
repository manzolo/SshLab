# ---- 1. il file esiste sul server, e dice il nome del server ----------------
# Si guarda dentro il namespace del server con lab_srv: e' la stessa macchina,
# quindi non serve nessun canale in piu'.
f=/home/deploy/prova.txt
contenuto=$(cat "$f" 2>/dev/null | tr -d ' \t\r\n')
atteso=$(lab_srv hostname 2>/dev/null | tr -d ' \t\r\n')
lab_fact prova_txt "${contenuto:-(il file non c'e')}"
lab_fact hostname_del_server "$atteso"
lab_eq file-sul-server "$atteso" "$contenuto"

# ---- 2. ci sei arrivato ATTRAVERSO LA RETE ----------------------------------
# L'invariante non e' "il file esiste" ma "c'e' stata una sessione ssh": il file
# si potrebbe scrivere dal pc in un secondo, e sarebbe un'altra cosa. Il testimone
# e' il registro del SERVER, non la history del pc: si misura quello che e'
# successo, non quello che e' stato digitato.
riga=$(lab_sshd_dice 'Accepted (password|publickey|keyboard-interactive)')
lab_fact sshd_dice "$(printf '%s' "$riga" | sed 's/.*Accepted/Accepted/' | cut -c1-70)"
[ -n "$riga" ]
lab_check sessione-ssh-avvenuta $? "${riga:+una sessione}" "un accesso registrato da sshd"

lab_done
