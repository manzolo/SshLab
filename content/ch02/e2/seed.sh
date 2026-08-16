# Una privata e quattro pubbliche: la candidata giusta e i nomi cambiano col
# seme. La lista resta di root nello stato, cosi' il check sa quali file sono
# stati seminati senza fidarsi di file aggiunti dopo.
dir="$LAB/chiavi"
mkdir -p "$dir"

set -- 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16
giusta=$(edu_rand_pick 20 "$@")
install -m 600 "/opt/lab/keys/ed25519/$giusta" "$dir/privata"

scelte=$giusta
salt=21
while [ "$(printf '%s\n' $scelte | wc -l)" -lt 4 ]; do
    scelta=$(edu_rand_pick "$salt" "$@")
    salt=$((salt + 1))
    case " $scelte " in
        *" $scelta "*) ;;
        *) scelte="$scelte $scelta" ;;
    esac
done

: > "$LAB_STATE/ch02-e2-candidati"
i=0
for scelta in $scelte; do
    nome=$(edu_rand_word $((40 + i))).pub
    install -m 644 "/opt/lab/keys/ed25519/$scelta.pub" "$dir/$nome"
    printf '%s\n' "$nome" >> "$LAB_STATE/ch02-e2-candidati"
    i=$((i + 1))
done
chmod 600 "$LAB_STATE/ch02-e2-candidati"
:
