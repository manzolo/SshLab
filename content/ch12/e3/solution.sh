vecchia=$(cat "$LAB_STATE/riga_vecchia")
awk -v vecchia="$vecchia" '$0 == vecchia { print "# " $0; next } { print }' /home/deploy/.ssh/authorized_keys > /tmp/authorized_keys.nuovo
install -m 600 -o deploy -g deploy /tmp/authorized_keys.nuovo /home/deploy/.ssh/authorized_keys
