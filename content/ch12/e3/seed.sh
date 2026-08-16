rm -rf /home/manzolo/.ssh /home/deploy/.ssh
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
inizio=$(edu_rand_int 1 15 1220)
vecchia=$(printf '%02d' "$inizio")
nuova=$(printf '%02d' $((inizio + 1)))
for nome in vecchia nuova; do
    eval n=\$$nome
    install -m 600 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$n" "/home/manzolo/.ssh/id_$nome"
    install -m 644 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$n.pub" "/home/manzolo/.ssh/id_$nome.pub"
done
{
    printf '%s ' "$(lab_srv_ip)"
    cat /etc/ssh/ssh_host_ed25519_key.pub
} > /home/manzolo/.ssh/known_hosts
chown manzolo:manzolo /home/manzolo/.ssh/known_hosts
chmod 600 /home/manzolo/.ssh/known_hosts
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
cat /home/manzolo/.ssh/id_vecchia.pub /home/manzolo/.ssh/id_nuova.pub > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
cat /home/manzolo/.ssh/id_vecchia.pub > "$LAB_STATE/riga_vecchia"
mkdir -p "$LAB"
lab_log_azzera
