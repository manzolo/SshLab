socket=$(lab_agent_socket manzolo)
lab_come manzolo "SSH_AUTH_SOCK='$socket' ssh -n -o BatchMode=yes -o IdentitiesOnly=yes -i $LAB/identita/chiave-6 deploy@$(lab_srv_ip) true" >/dev/null
