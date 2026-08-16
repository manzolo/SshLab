out=$(lab_come manzolo "ssh-agent -s")
socket=$(printf '%s\n' "$out" | sed -n 's/^SSH_AUTH_SOCK=\([^;]*\).*/\1/p')
printf '#!/bin/sh\necho lab\n' > /tmp/lab-askpass
chmod 755 /tmp/lab-askpass
lab_come manzolo "SSH_AUTH_SOCK='$socket' SSH_ASKPASS=/tmp/lab-askpass SSH_ASKPASS_REQUIRE=force DISPLAY=:0 ssh-add /home/manzolo/.ssh/id_ed25519 </dev/null" >/dev/null
