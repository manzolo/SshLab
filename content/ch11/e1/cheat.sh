# Aumentare il limite fa arrivare la chiave buona, ma non riduce le offerte del client.
sed -i 's/MaxAuthTries 3/MaxAuthTries 20/' /etc/ssh/sshd_config.lab
/opt/lab/bin/lab-sshd-riavvia
socket=$(lab_agent_socket manzolo)
lab_come manzolo "SSH_AUTH_SOCK='$socket' ssh -n -o BatchMode=yes deploy@$(lab_srv_ip) true" >/dev/null
