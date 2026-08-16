if [ "$(cat "$LAB_STATE/mondo")" = legittimo ]; then
    {
        printf '%s ' "$(lab_srv_ip)"
        cat /etc/ssh/ssh_host_ed25519_key.pub
    } > /home/manzolo/.ssh/known_hosts
    chown manzolo:manzolo /home/manzolo/.ssh/known_hosts
    chmod 600 /home/manzolo/.ssh/known_hosts
else
    printf '%s\n' no > "$LAB_STATE/answer"
fi
