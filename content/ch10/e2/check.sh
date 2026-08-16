attesa=$(cat "$LAB_STATE/fp_attesa")
lab_answer_eq impronta-letta "$attesa"
impronte=$(lab_agent_impronte manzolo)
if [ -z "$impronte" ]; then rc=0; else rc=1; fi
lab_check chiave-rimossa "$rc" "${impronte:-(agent vuoto)}" "agent vuoto"
lab_done
