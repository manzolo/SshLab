privata=/home/manzolo/.ssh/id_ed25519
pubblica=/home/manzolo/.ssh/id_ed25519.pub

fp_privata=$(lab_fp "$privata")
modo_privata=$(lab_modo "$privata")
lab_fact privata "${fp_privata:-(assente o illeggibile)}, modo ${modo_privata:-(assente)}"
[ -n "$fp_privata" ] && [ "$modo_privata" = 600 ]
lab_check privata-protetta $? "$modo_privata" "chiave valida, modo 600" "$privata"

fp_pubblica=$(lab_fp "$pubblica")
lab_fact pubblica "${fp_pubblica:-(assente o illeggibile)}"
[ -n "$fp_pubblica" ]
lab_check pubblica-presente $? "${fp_pubblica:-(assente)}" "una chiave pubblica valida" "$pubblica"

lab_fact impronta_della_coppia "${fp_privata:-(privata assente)} / ${fp_pubblica:-(pubblica assente)}"
[ -n "$fp_privata" ] && [ "$fp_privata" = "$fp_pubblica" ]
lab_check stessa-impronta $? "${fp_pubblica:-(assente)}" "${fp_privata:-(privata assente)}"
lab_done
