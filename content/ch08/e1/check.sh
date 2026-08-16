if lab_login_riuscito manzolo; then rc=0; else rc=$?; fi
lab_check login-ripristinato "$rc" "${rc:+login fallito}" "login publickey riuscito"

modi="$(lab_modo /home/manzolo/.ssh/id_ed25519) $(lab_modo /home/deploy/.ssh) $(lab_modo /home/deploy/.ssh/authorized_keys) $(lab_modo /home/deploy)"
[ "$modi" = "600 700 600 755" ]
lab_check modi-sicuri $? "$modi" "600 700 600 755"

lab_sshd_config_intatto
lab_check strictmodes-intatto $? "config modificato" "config iniziale"
lab_done
