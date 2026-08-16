fp_privata=$(lab_fp "$LAB/chiavi/privata")
for candidata in "$LAB"/chiavi/*.pub; do
    if [ "$(lab_fp "$candidata")" = "$fp_privata" ]; then
        basename "$candidata" > "$LAB_STATE/answer"
        break
    fi
done
