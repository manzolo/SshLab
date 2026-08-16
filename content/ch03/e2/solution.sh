trovata=
set -- "$LAB"/chiavi/*.pub
while [ "$#" -gt 1 ]; do
    primo=$1
    shift
    for secondo in "$@"; do
        if [ "$(lab_fp "$primo")" = "$(lab_fp "$secondo")" ]; then
            trovata="$(basename "$primo"),$(basename "$secondo")"
            break
        fi
    done
    [ -z "$trovata" ] || break
done
printf '%s' "$trovata" > "$LAB_STATE/answer"
