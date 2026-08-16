lab_login_riuscito manzolo >/dev/null
riga=$(lab_sshd_dice 'Accepted publickey')
printf '%s\n' "$riga" | sed -n 's/.* \(SHA256:[^ ]*\).*/\1/p' > "$LAB_STATE/answer"
