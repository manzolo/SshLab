rm -rf /home/manzolo/.ssh /home/deploy/.ssh
set -- 01 02 03 04 05 06 07 08
scelta=$(edu_rand_pick 610 "$@")
install -m 600 "/opt/lab/hostkeys/$scelta/ssh_host_ed25519_key" /etc/ssh/ssh_host_ed25519_key
install -m 644 "/opt/lab/hostkeys/$scelta/ssh_host_ed25519_key.pub" /etc/ssh/ssh_host_ed25519_key.pub
/opt/lab/bin/lab-sshd-riavvia
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
set -- 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16
utente=$(edu_rand_pick 611 "$@")
install -m 600 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$utente" /home/manzolo/.ssh/id_ed25519
install -m 644 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$utente.pub" /home/manzolo/.ssh/id_ed25519.pub
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy "/opt/lab/keys/ed25519/$utente.pub" /home/deploy/.ssh/authorized_keys
lab_log_azzera
mkdir -p "$LAB"
