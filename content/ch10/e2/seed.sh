rm -rf /home/manzolo/.ssh /home/deploy/.ssh /tmp/ssh-*
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
set -- 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16
scelta=$(edu_rand_pick 1010 "$@")
install -m 600 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$scelta" /home/manzolo/.ssh/id_ed25519
install -m 644 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$scelta.pub" /home/manzolo/.ssh/id_ed25519.pub
lab_come manzolo "ssh-keygen -p -P '' -N lab -f /home/manzolo/.ssh/id_ed25519" >/dev/null
out=$(lab_come manzolo "ssh-agent -s")
socket=$(printf '%s\n' "$out" | sed -n 's/^SSH_AUTH_SOCK=\([^;]*\).*/\1/p')
printf '#!/bin/sh\necho lab\n' > /tmp/lab-askpass
chmod 755 /tmp/lab-askpass
lab_come manzolo "SSH_AUTH_SOCK='$socket' SSH_ASKPASS=/tmp/lab-askpass SSH_ASKPASS_REQUIRE=force DISPLAY=:0 ssh-add /home/manzolo/.ssh/id_ed25519 </dev/null" >/dev/null
printf "export SSH_AUTH_SOCK='%s'\n" "$socket" > "$LAB/agent.env"
chown manzolo:manzolo "$LAB/agent.env"
lab_fp "/opt/lab/keys/ed25519/$scelta.pub" > "$LAB_STATE/fp_attesa"
