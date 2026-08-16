# Sostituire invece di aggiungere crea subito una finestra senza la vecchia via d'accesso.
lab_come manzolo "ssh-keygen -q -t ed25519 -N '' -f /home/manzolo/.ssh/id_nuova" >/dev/null
install -m 600 -o deploy -g deploy /home/manzolo/.ssh/id_nuova.pub /home/deploy/.ssh/authorized_keys
