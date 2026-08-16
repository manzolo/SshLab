# Il login riesce, ma il client non conserva alcuna identita' del server.
lab_come manzolo "ssh -n -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null deploy@$(lab_srv_ip) true" >/dev/null
