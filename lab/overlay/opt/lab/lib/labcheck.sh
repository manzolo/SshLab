#!/bin/sh
# labcheck.sh — libreria condivisa da seed.sh e check.sh, identica nei due runtime
# (browser via labagentd, locale via la CLI `lab`).
#
# Due mestieri:
#   1. generare mondi DETERMINISTICI dato $EDU_SEED, ma imprevedibili per chi studia
#      -> e' qui che vive l'anti-trucco: se il numero non lo puoi sapere, non lo puoi cablare
#   2. emettere verdetti in un formato NEUTRO rispetto alla lingua
#      -> i messaggi bilingui vivono nel chapter.js, non qui

LAB="${LAB:-/root/lab}"
EDU_SEED="${EDU_SEED:-1}"
LAB_STATE=/opt/lab/state

# ---------------------------------------------------------------- generatori
#
# NON usiamo srand()/rand() di awk: con semi vicini i primi valori sono correlati,
# e due salt consecutivi finiscono per generare lo stesso nome di file — i file si
# sovrascrivono a vicenda e il mondo esce sbagliato. (Successo davvero, nel capitolo 2.)
# Qui c'e' un generatore congruenziale scritto a mano: moltiplicatore piccolo perche'
# i prodotti restino sotto 2^53 e la doppia precisione sia esatta, e venti giri a vuoto
# in avvio per scollegare del tutto semi e salt vicini.

_EDU_AWK_RNG='
function edu_seed(s, salt,   i) {
    st = ((s % 1000003) * 7919 + salt * 104729 + 12345) % 2147483648
    for (i = 0; i < 20; i++) edu_next()
}
function edu_next() {
    st = (st * 69069 + 12345) % 2147483648
    return st / 2147483648
}
function edu_int(a, b) { return a + int(edu_next() * (b - a + 1)) }
'

# edu_rand_int MIN MAX [SALT] — intero riproducibile nell'intervallo [MIN,MAX]
edu_rand_int() {
    awk -v s="$EDU_SEED" -v salt="${3:-0}" -v a="$1" -v b="$2" \
        "$_EDU_AWK_RNG"'BEGIN{ edu_seed(s, salt); print edu_int(a, b) }'
}

# edu_rand_word [SALT] — parola pronunciabile, per nomi di file e cartelle
edu_rand_word() {
    awk -v s="$EDU_SEED" -v salt="${1:-0}" \
        "$_EDU_AWK_RNG"'BEGIN{
            edu_seed(s, salt)
            n = split("ba be bi bo bu da de di do du fa fe fi fo fu la le li lo lu ma me mi mo mu na ne ni no nu ra re ri ro ru sa se si so su ta te ti to tu", syl, " ")
            out = ""
            for (i = 0; i < 3; i++) out = out syl[edu_int(1, n)]
            print out
        }'
}

# edu_rand_pick SALT item item item... — sceglie un elemento
edu_rand_pick() {
    salt=$1; shift
    i=$(awk -v s="$EDU_SEED" -v salt="$salt" -v n="$#" \
        "$_EDU_AWK_RNG"'BEGIN{ edu_seed(s, salt); print edu_int(1, n) }')
    eval "printf '%s\n' \"\${$i}\""
}

# edu_rand_log FILE RIGHE [SALT] — un access log verosimile, con conteggi
# che nessuno puo' indovinare senza guardarlo davvero
edu_rand_log() {
    awk -v s="$EDU_SEED" -v salt="${3:-0}" -v n="$2" \
        "$_EDU_AWK_RNG"'BEGIN{
            edu_seed(s, salt)
            split("GET POST HEAD PUT", verb, " ")
            split("/ /index.html /api/utenti /api/ordini /static/logo.png /login /admin", path, " ")
            split("200 200 200 200 304 301 404 403 500 502", code, " ")
            split("INFO INFO INFO WARN ERROR DEBUG", lvl, " ")
            for (i = 1; i <= n; i++) {
                ip = sprintf("10.%d.%d.%d", edu_int(1,4), edu_int(0,7), edu_int(1,24))
                printf "2026-03-%02d %02d:%02d:%02d %s %s %s %s %d\n",
                    edu_int(1,28), edu_int(0,23), edu_int(0,59), edu_int(0,59),
                    lvl[edu_int(1,6)], ip, verb[edu_int(1,4)], path[edu_int(1,7)], code[edu_int(1,10)]
            }
        }' > "$1"
}

# ---------------------------------------------------------------- verdetti

_lab_pass=0
_lab_fail=0

# lab_check ID ESITO [got] [want] [at] — ESITO: 0 superato, altro non superato
lab_check() {
    id=$1; rc=$2; got=$3; want=$4; at=$5
    if [ "$rc" -eq 0 ]; then
        _lab_pass=$((_lab_pass + 1))
        printf 'EDU CHECK %s PASS\n' "$id"
    else
        _lab_fail=$((_lab_fail + 1))
        printf 'EDU CHECK %s FAIL' "$id"
        [ -n "$got" ]  && printf ' got=%s'  "$got"
        [ -n "$want" ] && printf ' want=%s' "$want"
        [ -n "$at" ]   && printf ' at=%s'   "$at"
        printf '\n'
    fi
}

# lab_eq ID ATTESO OTTENUTO [at] — la forma piu' usata
lab_eq() {
    if [ "$2" = "$3" ]; then lab_check "$1" 0
    else lab_check "$1" 1 "${3:-(vuoto)}" "$2" "$4"; fi
}

# lab_fact CHIAVE VALORE — cio' che la sonda ha guardato.
# Alimenta il pannello "cosa ha visto la macchina": vedere lo stato con gli occhi
# del verificatore e' meta' della didattica.
lab_fact() { printf 'EDU FACT %s %s\n' "$1" "$2"; }

# lab_done — riepilogo ed exit code. Va chiamato in fondo a ogni check.sh.
lab_done() {
    printf 'EDU RESULT %d/%d\n' "$_lab_pass" "$((_lab_pass + _lab_fail))"
    [ "$_lab_fail" -eq 0 ]
}

# ---------------------------------------------------------------- risposte

# La famiglia "risposta": l'esercizio e' LEGGERE, e leggere non lascia tracce.
# L'utente scrive:  grep -c ERROR app.log | lab answer
lab_answer_read() { tr -d ' \t\n\r' < "$LAB_STATE/answer" 2>/dev/null; }

# lab_answer_eq ID ATTESO — confronta la risposta consegnata con quella
# ricalcolata dal mondo seminato (mai con una costante scritta a mano)
lab_answer_eq() {
    a=$(lab_answer_read)
    lab_fact answer "${a:-(nessuna risposta consegnata)}"
    lab_eq "$1" "$2" "$a"
}

# ---------------------------------------------------------------- il mondo a due
#
# La verifica gira sul pc, come root. Per guardare dentro l'altro host non serve
# la rete: e' la stessa macchina, e un `ip netns exec` ci porta dentro. E' il
# vantaggio piu' concreto dei namespace rispetto a due VM separate — con due VM
# servirebbe un secondo agente su un secondo canale, e quel canale potrebbe essere
# proprio quello che l'esercizio ha appena rotto.

LAB_RUN=/run/lab
lab_srv_ip()   { cat "$LAB_RUN/srv_ip"   2>/dev/null || echo 10.10.0.2; }
lab_pc_ip()    { cat "$LAB_RUN/pc_ip"    2>/dev/null || echo 10.10.0.1; }
lab_srv_user() { cat "$LAB_RUN/srv_user" 2>/dev/null || echo deploy; }
lab_pc_user()  { cat "$LAB_RUN/pc_user"  2>/dev/null || echo manzolo; }

# lab_srv COMANDO... — esegue sull'host "server"
lab_srv() { ip netns exec server "$@"; }

# lab_come UTENTE COMANDO — esegue con l'identita' di chi studia.
# `su -c`, non `su -`: il trattino azzererebbe l'ambiente, SSH_AUTH_SOCK compreso,
# e i capitoli sull'agent verificherebbero un mondo che non e' quello dell'utente.
lab_come() { u=$1; shift; su "$u" -c "$*" </dev/null 2>&1; }

# lab_fp FILE — l'impronta SHA256 di una chiave, pubblica o privata che sia.
# E' il modo giusto di identificare una chiave: il NOME del file non vuol dire
# niente (id_ed25519 e lavoro sono la stessa chiave se l'impronta combacia), il
# contenuto della riga puo' avere commenti diversi, l'impronta no.
lab_fp() { ssh-keygen -lf "$1" 2>/dev/null | awk '{print $2}'; }

# lab_fp_tutte DIR — le impronte di tutte le chiavi pubbliche di una cartella
lab_fp_tutte() {
    for p in "$1"/*.pub; do [ -f "$p" ] && lab_fp "$p"; done
}

# lab_login_prova UTENTE_LOCALE [opzioni ssh...] — LA prova che conta.
#
# BatchMode=yes e' il perno di tutto il corso: se servisse una password, ssh
# FALLISCE invece di chiederla. Cosi' "si entra senza password" diventa una
# proprieta' verificabile invece che una speranza — ed e' l'unico modo di
# asserire un'ASSENZA.
#
# `-n` e' obbligatorio: senza, ssh si mette in ascolto sullo standard input e non
# torna piu' (lo stdin qui e' il canale di verifica, che non si chiude mai).
lab_login_prova() {
    u=$1; shift
    lab_come "$u" "ssh -n -o BatchMode=yes -o ConnectTimeout=15 $* $(lab_srv_user)@$(lab_srv_ip) 'id -un'"
}

# lab_login_riuscito UTENTE_LOCALE [opzioni] — 0 se il login e' andato a buon fine.
# Si guarda che l'ULTIMA riga sia il nome dell'utente remoto: il messaggio di
# rifiuto contiene anche lui il nome ("deploy@10.10.0.2: Permission denied"),
# quindi cercarlo dentro l'output darebbe un falso positivo.
lab_login_riuscito() {
    u=$1; shift
    out=$(lab_login_prova "$u" "$@")
    ultima=$(printf '%s\n' "$out" | tail -1 | tr -d ' \t\r')
    lab_fact login "$(printf '%s' "$out" | tr '\n' ' ' | cut -c1-76)"
    [ "$ultima" = "$(lab_srv_user)" ]
}

# lab_sshd_dice PATTERN — l'ultima riga del registro del server che combacia.
#
# E' il testimone: sshd scrive "Accepted publickey for deploy ... ED25519
# SHA256:xxxx", cioe' METODO e IMPRONTA di quello che ha accettato davvero. Un
# check che guarda qui non sta guardando cosa ha DIGITATO chi studia — sta
# guardando cosa e' successo al server. E' la differenza fra sorvegliare e
# misurare.
lab_sshd_dice() { grep -E "$1" /var/log/messages 2>/dev/null | tail -1; }

# lab_log_azzera — da chiamare nel seed: senza, il testimone dell'esercizio
# precedente resta li' e un check passa senza che nessuno abbia fatto niente.
lab_log_azzera() { : > /var/log/messages 2>/dev/null || true; }
