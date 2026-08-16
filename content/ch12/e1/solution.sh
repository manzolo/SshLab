lab_come manzolo "ssh-keygen -q -t ed25519 -N '' -f /home/manzolo/.ssh/id_nuova" >/dev/null
cat /home/manzolo/.ssh/id_nuova.pub >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
