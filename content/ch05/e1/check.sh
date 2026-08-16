[ ! -e /home/manzolo/.ssh/id_ed25519 ]
lab_check privata-assente $? "$(test -e /home/manzolo/.ssh/id_ed25519 && echo presente || echo assente)" "assente"

attesa=$(cat "$LAB_STATE/fp_attesa")
attuale=$(lab_fp /home/deploy/.ssh/authorized_keys)
lab_eq autorizzazione-intatta "$attesa" "$attuale" /home/deploy/.ssh/authorized_keys

if lab_login_fallito manzolo; then rc=0; else rc=$?; fi
lab_check login-rifiutato "$rc" "${rc:+non dimostrato}" "rifiuto di autenticazione"
lab_done
