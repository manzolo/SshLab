riga=$(lab_sshd_dice 'Accepted publickey')
[ -n "$riga" ]
lab_check login-mirato $? "${riga:-(nessun Accepted)}" "login publickey accettato"
offerte=$(lab_offerte manzolo)
[ -n "$offerte" ] && [ "$offerte" -le 2 ]
lab_check poche-offerte $? "${offerte:-(nessun login)}" "al massimo 2 rifiuti prima di Accepted"
lab_sshd_config_intatto
lab_check limite-intatto $? "config modificato" "MaxAuthTries iniziale"
lab_done
