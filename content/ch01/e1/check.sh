# L'indirizzo si RICALCOLA dal mondo, non si confronta con una costante: se un
# giorno il seed cambiasse schema, il check seguirebbe da solo.
atteso=$(lab_srv ip -4 -o addr show veth-srv | awk '{print $4}' | cut -d/ -f1)
lab_answer_eq indirizzo-giusto "$atteso"
lab_done
