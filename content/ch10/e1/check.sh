socket=$(lab_agent_socket manzolo)
[ -n "$socket" ] && [ -S "$socket" ]
lab_check agent-vivo $? "${socket:-(nessun socket)}" "socket vivo di manzolo"

attesa=$(cat "$LAB_STATE/fp_attesa")
impronte=$(lab_agent_impronte manzolo)
printf '%s\n' "$impronte" | grep -Fqx "$attesa"
lab_check chiave-caricata $? "${impronte:-(agent vuoto)}" "$attesa"

if [ -n "$socket" ] && lab_login_riuscito manzolo "-o IdentityAgent=$socket"; then rc=0; else rc=$?; fi
lab_check firma-in-memoria "$rc" "${rc:+login fallito}" "login BatchMode con agent"
lab_done
