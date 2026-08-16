rm -rf /home/manzolo/.ssh /home/deploy/.ssh /tmp/ssh-*
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
install -d -m 700 -o manzolo -g manzolo "$LAB/identita"
inizio=$(edu_rand_int 1 11 1110)
i=1
while [ "$i" -le 6 ]; do
    n=$(printf '%02d' $((inizio + i - 1)))
    install -m 600 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$n" "$LAB/identita/chiave-$i"
    install -m 644 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$n.pub" "$LAB/identita/chiave-$i.pub"
    i=$((i + 1))
done
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy "$LAB/identita/chiave-6.pub" /home/deploy/.ssh/authorized_keys
{
    printf '%s ' "$(lab_srv_ip)"
    cat /etc/ssh/ssh_host_ed25519_key.pub
} > /home/manzolo/.ssh/known_hosts
chown manzolo:manzolo /home/manzolo/.ssh/known_hosts
chmod 600 /home/manzolo/.ssh/known_hosts
printf '\nMaxAuthTries 3\n' >> /etc/ssh/sshd_config.lab
/opt/lab/bin/lab-sshd-riavvia
out=$(lab_come manzolo "ssh-agent -s")
socket=$(printf '%s\n' "$out" | sed -n 's/^SSH_AUTH_SOCK=\([^;]*\).*/\1/p')
lab_come manzolo "SSH_AUTH_SOCK='$socket' ssh-add $LAB/identita/chiave-1 $LAB/identita/chiave-2 $LAB/identita/chiave-3 $LAB/identita/chiave-4 $LAB/identita/chiave-5 $LAB/identita/chiave-6" >/dev/null
printf "export SSH_AUTH_SOCK='%s'\n" "$socket" > "$LAB/agent.env"
chown manzolo:manzolo "$LAB/agent.env"
lab_log_azzera
