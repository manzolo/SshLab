cat "$LAB_STATE/fp_attesa" > "$LAB_STATE/answer"
socket=$(lab_agent_socket manzolo)
lab_come manzolo "SSH_AUTH_SOCK='$socket' ssh-add -d /home/manzolo/.ssh/id_ed25519.pub" >/dev/null
