if lab_login_fallito manzolo "-o IdentitiesOnly=yes -i /home/manzolo/.ssh/id_vecchia"; then rc=0; else rc=$?; fi
lab_check vecchia-ritirata "$rc" "${rc:+login non rifiutato}" "rifiuto della vecchia"

if lab_login_riuscito manzolo "-o IdentitiesOnly=yes -i /home/manzolo/.ssh/id_nuova"; then rc=0; else rc=$?; fi
lab_check nuova-attiva "$rc" "${rc:+login fallito}" "login con la nuova"

riga=$(cat "$LAB_STATE/riga_vecchia")
grep -Fqx "# $riga" /home/deploy/.ssh/authorized_keys && grep -Eq '^[^#[:space:]]' /home/deploy/.ssh/authorized_keys
lab_check ritiro-annullabile $? "vecchia assente o file senza chiavi attive" "vecchia commentata e nuova attiva"
lab_done
