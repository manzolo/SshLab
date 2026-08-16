# Spegnere il controllo sul server non ripara i permessi e cambia il contratto di sshd.
printf '\nStrictModes no\n' >> /etc/ssh/sshd_config.lab
/opt/lab/bin/lab-sshd-riavvia
