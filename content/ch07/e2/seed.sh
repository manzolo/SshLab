rm -rf /home/manzolo/.ssh /home/deploy/.ssh
set -- 01 02 03 04 05 06 07 08
vecchia=$(edu_rand_pick 710 "$@")
set -- 01 02 03 04 05 06 07 08
nuova=$(edu_rand_pick 711 "$@")
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
cp /home/manzolo/.ssh/known_hosts "$LAB_STATE/known_hosts_prima"

set -- 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16
utente=$(edu_rand_pick 712 "$@")
install -m 600 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$utente" /home/manzolo/.ssh/id_ed25519
install -m 644 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$utente.pub" /home/manzolo/.ssh/id_ed25519.pub
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy "/opt/lab/keys/ed25519/$utente.pub" /home/deploy/.ssh/authorized_keys

mondo=$(edu_rand_pick 713 legittimo sospetto)
printf '%s' "$mondo" > "$LAB_STATE/mondo"
mkdir -p "$LAB"
if [ "$mondo" = legittimo ]; then
    {
        echo "Manutenzione completata: reinstallazione del server."
        echo "Data: 2026-08-16"
        echo "Nuova impronta: $(lab_hostkey_fp)"
    } > "$LAB/manutenzione.txt"
fi
lab_log_azzera
