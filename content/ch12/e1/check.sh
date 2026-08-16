impronte=$(lab_fp /home/deploy/.ssh/authorized_keys)
numero=$(printf '%s\n' "$impronte" | awk 'NF {n++} END {print n+0}')
[ "$numero" -eq 2 ] && [ "$(printf '%s\n' "$impronte" | sort -u | wc -l | tr -d ' ')" -eq 2 ]
lab_check due-autorizzazioni $? "$numero" "2 impronte distinte"

if lab_login_riuscito manzolo "-o IdentitiesOnly=yes -i /home/manzolo/.ssh/id_vecchia" &&
   lab_login_riuscito manzolo "-o IdentitiesOnly=yes -i /home/manzolo/.ssh/id_nuova"; then rc=0; else rc=$?; fi
lab_check entrambe-entrano "$rc" "${rc:+una chiave rifiutata}" "vecchia e nuova accettate"
lab_done
