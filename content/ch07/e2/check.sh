mondo=$(cat "$LAB_STATE/mondo")
lab_fact mondo "$mondo"
if [ "$mondo" = legittimo ]; then
    attesa=$(lab_hostkey_fp)
    attuali=$(lab_known_hosts_fp manzolo)
    printf '%s\n' "$attuali" | grep -Fqx "$attesa"
    lab_check decisione-coerente $? "${attuali:-(nessuna)}" "$attesa"
    if lab_login_riuscito manzolo "-o StrictHostKeyChecking=yes"; then rc=0; else rc=$?; fi
    lab_check conseguenza-sicura "$rc" "${rc:+login fallito}" "login rigoroso riuscito"
else
    cmp -s "$LAB_STATE/known_hosts_prima" /home/manzolo/.ssh/known_hosts
    lab_check decisione-coerente $? "known_hosts modificato" "known_hosts identico"
    risposta=$(lab_answer_read)
    accepted=$(lab_sshd_dice 'Accepted')
    [ "$risposta" = no ] && [ -z "$accepted" ]
    lab_check conseguenza-sicura $? "risposta=${risposta:-(nessuna)}, accepted=${accepted:-(nessuno)}" "risposta=no, nessun Accepted"
fi
lab_done
