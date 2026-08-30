attesa=$(cat "$LAB_STATE/fp_attesa")
lab_answer_eq impronta-letta "$attesa"
impronte=$(lab_agent_impronte manzolo)
# Le impronte nell'agent SONO la risposta da consegnare: il verdetto dice solo
# se l'agent e' vuoto, non cosa contiene.
if [ -z "$impronte" ]; then rc=0; stato_agent="(agent vuoto)"; else rc=1; stato_agent="un'identita' e' ancora nell'agent"; fi
lab_check chiave-rimossa "$rc" "$stato_agent"
lab_done
