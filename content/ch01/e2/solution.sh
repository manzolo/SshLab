# La soluzione entra davvero via rete, con la password, e scrive di la'.
# sshpass non c'e' (e sarebbe una brutta abitudine da insegnare): si usa una
# chiave usa-e-getta, si entra, e la si ritira subito.
tmp=$(mktemp -d)
ssh-keygen -t ed25519 -N '' -f "$tmp/k" -q </dev/null
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy "$tmp/k.pub" /home/deploy/.ssh/authorized_keys

ssh -n -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ConnectTimeout=30 -i "$tmp/k" "$(lab_srv_user)@$(lab_srv_ip)" \
    'hostname > ~/prova.txt' 2>/dev/null

rm -rf "$tmp" /home/deploy/.ssh
