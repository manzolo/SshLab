rm -rf /home/manzolo/.ssh /home/deploy/.ssh
set -- 01 02 03 04 05 06 07 08
vecchia=$(edu_rand_pick 700 "$@")
set -- 01 02 03 04 05 06 07 08
nuova=$(edu_rand_pick 701 "$@")
[ "$nuova" != "$vecchia" ] || { n=${nuova#0}; nuova=$(printf '%02d' $((n % 8 + 1))); }
install -m 600 "/opt/lab/hostkeys/$nuova/ssh_host_ed25519_key" /etc/ssh/ssh_host_ed25519_key
install -m 644 "/opt/lab/hostkeys/$nuova/ssh_host_ed25519_key.pub" /etc/ssh/ssh_host_ed25519_key.pub
/opt/lab/bin/lab-sshd-riavvia
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
{
    printf '%s ' "$(lab_srv_ip)"
    cat "/opt/lab/hostkeys/$vecchia/ssh_host_ed25519_key.pub"
} > /home/manzolo/.ssh/known_hosts
chown manzolo:manzolo /home/manzolo/.ssh/known_hosts
chmod 600 /home/manzolo/.ssh/known_hosts
mkdir -p "$LAB"
lab_log_azzera
