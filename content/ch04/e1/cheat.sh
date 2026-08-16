# Il file giusto sulla macchina sbagliata: con il disco condiviso compare davvero,
# ma sshd legge la home di deploy e non quella di manzolo.
install -m 600 -o manzolo -g manzolo /home/manzolo/.ssh/id_ed25519.pub \
    /home/manzolo/.ssh/authorized_keys
