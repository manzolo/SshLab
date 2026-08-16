attesa=$(lab_hostkey_fp)
attuali=$(lab_known_hosts_fp manzolo)
printf '%s\n' "$attuali" | grep -Fqx "$attesa"
lab_check host-ricordato $? "${attuali:-(nessuna)}" "$attesa"
lab_answer_eq impronta-confrontata "$attesa"
lab_done
