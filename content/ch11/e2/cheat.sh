# L'alias esiste, ma si lascia che l'agent offra tutto e si alza il limite server.
cat > /home/manzolo/.ssh/config <<EOF
Host lab
    HostName $(lab_srv_ip)
    User deploy
EOF
chown manzolo:manzolo /home/manzolo/.ssh/config
chmod 600 /home/manzolo/.ssh/config
sed -i 's/MaxAuthTries 3/MaxAuthTries 20/' /etc/ssh/sshd_config.lab
/opt/lab/bin/lab-sshd-riavvia
