risposta=$(lab_answer_read)
primo=$(printf '%s' "$risposta" | cut -d, -f1)
secondo=$(printf '%s' "$risposta" | cut -d, -f2)
campi=$(printf '%s' "$risposta" | awk -F, '{print NF}')
lab_fact risposta "${risposta:-(nessuna risposta consegnata)}"

valida=1
[ "$campi" -eq 2 ] || valida=0
[ -n "$primo" ] && [ "$primo" != "$secondo" ] || valida=0
grep -Fqx "$primo" "$LAB_STATE/ch03-e2-candidati" 2>/dev/null || valida=0
grep -Fqx "$secondo" "$LAB_STATE/ch03-e2-candidati" 2>/dev/null || valida=0

fp_primo=
fp_secondo=
[ "$valida" -eq 0 ] || {
    fp_primo=$(lab_fp "$LAB/chiavi/$primo")
    fp_secondo=$(lab_fp "$LAB/chiavi/$secondo")
}
lab_fact impronte "${fp_primo:-(prima non valida)} / ${fp_secondo:-(seconda non valida)}"
[ "$valida" -eq 1 ] && [ -n "$fp_primo" ] && [ "$fp_primo" = "$fp_secondo" ]
lab_check gemelle-trovate $? "${risposta:-(nessuna)}" "due file seminati con la stessa impronta"
lab_done
