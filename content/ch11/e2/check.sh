socket=$(lab_agent_socket manzolo)
if [ -n "$socket" ]; then
    out=$(lab_come manzolo "SSH_AUTH_SOCK='$socket' ssh -n -o BatchMode=yes lab 'id -un'")
else
    out=
fi
[ "$(printf '%s\n' "$out" | tail -1 | tr -d ' \t\r')" = deploy ]
lab_check alias-funziona $? "${out:-(login fallito)}" "ssh lab stampa deploy"
offerte=$(lab_offerte manzolo)
[ -n "$offerte" ] && [ "$offerte" -le 2 ]
lab_check alias-mirato $? "${offerte:-(nessun login)}" "al massimo 2 rifiuti"
lab_sshd_config_intatto
lab_check limite-intatto $? "config modificato" "MaxAuthTries iniziale"
lab_done
