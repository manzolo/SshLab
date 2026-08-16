install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy /home/manzolo/.ssh/id_ed25519.pub \
    /home/deploy/.ssh/authorized_keys
