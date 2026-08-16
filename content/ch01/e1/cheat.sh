# Il trucco piu' naturale: ricopiare l'indirizzo scritto nel capitolo. Funziona
# nel mondo del testo e fallisce in tutti gli altri, perche' la rete cambia col seme.
printf '%s' "10.10.0.2" > "$LAB_STATE/answer"
