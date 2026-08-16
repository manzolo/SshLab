rm -rf /home/manzolo/.ssh /home/deploy/.ssh
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
set -- 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16
scelta=$(edu_rand_pick 500 "$@")
install -m 600 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$scelta" /home/manzolo/.ssh/id_ed25519
install -m 644 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$scelta.pub" /home/manzolo/.ssh/id_ed25519.pub
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy "/opt/lab/keys/ed25519/$scelta.pub" /home/deploy/.ssh/authorized_keys
{
    printf '%s ' "$(lab_srv_ip)"
    cat /etc/ssh/ssh_host_ed25519_key.pub
} > /home/manzolo/.ssh/known_hosts
chown manzolo:manzolo /home/manzolo/.ssh/known_hosts
chmod 600 /home/manzolo/.ssh/known_hosts
lab_fp "/opt/lab/keys/ed25519/$scelta.pub" > "$LAB_STATE/fp_attesa"
lab_log_azzera
mkdir -p "$LAB"
chown manzolo:manzolo "$LAB"
