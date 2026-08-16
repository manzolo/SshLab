risposta=$(lab_answer_read)
lab_fact risposta "${risposta:-(nessuna risposta consegnata)}"

valida=1
case "$risposta" in
    ""|*/*) valida=0 ;;
    *) grep -Fqx "$risposta" "$LAB_STATE/ch02-e2-candidati" 2>/dev/null || valida=0 ;;
esac

fp_privata=$(lab_fp "$LAB/chiavi/privata")
fp_candidata=
[ "$valida" -eq 0 ] || fp_candidata=$(lab_fp "$LAB/chiavi/$risposta")
lab_fact impronte "privata=${fp_privata:-(assente)} candidata=${fp_candidata:-(non valida)}"

[ "$valida" -eq 1 ] && [ -n "$fp_privata" ] && [ "$fp_privata" = "$fp_candidata" ]
lab_check pubblica-giusta $? "${risposta:-(nessuna)}" "il file con la stessa impronta della privata"
lab_done
