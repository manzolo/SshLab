cat > /home/manzolo/.ssh/config <<EOF
Host lab
    HostName $(lab_srv_ip)
    User deploy
    IdentityFile $LAB/identita/chiave-6
    IdentitiesOnly yes
EOF
chown manzolo:manzolo /home/manzolo/.ssh/config
chmod 600 /home/manzolo/.ssh/config
