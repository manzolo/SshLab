pubblica=/home/manzolo/.ssh/id_ed25519.pub
autorizzate=/home/deploy/.ssh/authorized_keys
fp_pc=$(lab_fp "$pubblica")
fp_server=$(lab_fp "$autorizzate")
lab_fact impronta_pc "${fp_pc:-(chiave assente)}"
lab_fact impronte_authorized_keys "${fp_server:-(file assente o illeggibile)}"
printf '%s\n' "$fp_server" | grep -Fqx "$fp_pc"
lab_check pubblica-sul-server $? "${fp_server:-(nessuna)}" "$fp_pc" "$autorizzate"

if lab_login_riuscito manzolo; then login=0; else login=$?; fi
lab_check login-senza-password "$login" "${login:+rifiutato}" "deploy senza richiesta di password"
lab_done
