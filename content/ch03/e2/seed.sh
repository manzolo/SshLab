# Cinque identita' distinte producono sei file. Una viene copiata due volte; la
# seconda copia riceve un altro commento, cosi' solo l'impronta rivela la gemella.
dir="$LAB/chiavi"
mkdir -p "$dir"

set -- 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16
scelte=
salt=60
while [ "$(printf '%s\n' $scelte | sed '/^$/d' | wc -l)" -lt 5 ]; do
    scelta=$(edu_rand_pick "$salt" "$@")
    salt=$((salt + 1))
    case " $scelte " in
        *" $scelta "*) ;;
        *) scelte="$scelte $scelta" ;;
    esac
done
duplicata=$(edu_rand_pick 72 $scelte)

: > "$LAB_STATE/ch03-e2-candidati"
i=0
for scelta in $scelte; do
    nome=$(edu_rand_word $((80 + i))).pub
    install -m 644 "/opt/lab/keys/ed25519/$scelta.pub" "$dir/$nome"
    printf '%s\n' "$nome" >> "$LAB_STATE/ch03-e2-candidati"
    i=$((i + 1))
done

nome=$(edu_rand_word 95).pub
awk '{$NF="copia-rinominata@pc"; print}' "/opt/lab/keys/ed25519/$duplicata.pub" > "$dir/$nome"
chmod 644 "$dir/$nome"
printf '%s\n' "$nome" >> "$LAB_STATE/ch03-e2-candidati"
chmod 600 "$LAB_STATE/ch03-e2-candidati"
:
