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
#
# Si tolgono gli spazi ai BORDI, non quelli in mezzo.
#
# Prima si toglievano tutti, e una risposta consegnata per sbaglio come
# `lab 10.10.53.2` arrivava al confronto come `lab10.10.53.2`: il verdetto mostrava
# `got=lab10.10.53.2 want=10.10.53.2`, due stringhe abbastanza simili da far pensare
# «ma io l'ho scritto giusto». Con lo spazio al suo posto si legge `lab 10.10.53.2`
# e l'errore salta all'occhio: c'e' una parola di troppo.
#
# Ripulire quello che ha scritto l'utente prima di rimostrarglielo nasconde proprio
# la cosa che deve vedere.
lab_answer_read() {
    # 2>/dev/null PRIMA di < : le redirezioni si applicano in ordine, e se il
    # file manca l'errore "can't open" uscirebbe sullo stderr ancora aperto,
    # finendo dentro il verdetto.
    tr -d '\n\r' 2>/dev/null < "$LAB_STATE/answer" \
        | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

# lab_answer_eq ID ATTESO — confronta la risposta consegnata con quella
# ricalcolata dal mondo seminato (mai con una costante scritta a mano).
# ATTENZIONE: qui NON si passa da lab_eq, che stamperebbe `want=<atteso>`
# nel verdetto — basterebbe cliccare Verifica a vuoto e leggere la risposta.
# Il verdetto mostra solo cio' che lo studente ha consegnato.
# (Falla trovata su FsLab il 2026-08-30, chiusa qui alla radice.)
lab_answer_eq() {
    a=$(lab_answer_read)
    lab_fact answer "${a:-(nessuna risposta consegnata)}"
    if [ "$a" = "$2" ]; then lab_check "$1" 0
    else lab_check "$1" 1 "${a:-(vuoto)}"; fi
}

# ---------------------------------------------------------------- il mondo a due
#
# La verifica gira sul pc, come root. Per guardare dentro l'altro host non serve
# la rete: e' la stessa macchina, e si entra nei suoi namespace. E' il vantaggio
# piu' concreto rispetto a due VM separate — con due VM servirebbe un secondo
# agente su un secondo canale, e quel canale potrebbe essere proprio quello che
# l'esercizio ha appena rotto.
#
# "Entrare nel server" si fa in UN modo solo, /run/lab/entra-server, che porta
# dentro sia la rete sia il nome. Averne due (uno con la rete e basta) e' stata la
# causa del bug del prompt: sshd stava in mezzo al guado e le sessioni ssh
# atterravano su una macchina che si chiamava ancora `pc`.

LAB_RUN=/run/lab
lab_srv_ip()   { cat "$LAB_RUN/srv_ip"   2>/dev/null || echo 10.10.0.2; }
lab_pc_ip()    { cat "$LAB_RUN/pc_ip"    2>/dev/null || echo 10.10.0.1; }
lab_srv_user() { cat "$LAB_RUN/srv_user" 2>/dev/null || echo deploy; }
lab_pc_user()  { cat "$LAB_RUN/pc_user"  2>/dev/null || echo manzolo; }

# lab_srv COMANDO... — esegue sull'host "server"
#
# Passa dal punto unico, che entra sia nella rete sia nel NOME: con il solo
# `ip netns exec` un comando avrebbe l'indirizzo del server e l'hostname del pc, e
# un check che confronta `hostname` fallirebbe per una ragione che non c'entra
# niente con l'esercizio.
lab_srv() { /run/lab/entra-server "$@"; }

# lab_come UTENTE COMANDO — esegue con l'identita' di chi studia.
# `su -c`, non `su -`: il trattino azzererebbe l'ambiente, SSH_AUTH_SOCK compreso,
# e i capitoli sull'agent verificherebbero un mondo che non e' quello dell'utente.
lab_come() { u=$1; shift; su "$u" -c "$*" </dev/null 2>&1; }

# lab_fp FILE — l'impronta SHA256 di una chiave, pubblica o privata che sia.
# E' il modo giusto di identificare una chiave: il NOME del file non vuol dire
# niente (id_ed25519 e lavoro sono la stessa chiave se l'impronta combacia), il
# contenuto della riga puo' avere commenti diversi, l'impronta no.
#
# Il contenuto passa da /dev/stdin apposta. Se si chiede direttamente l'impronta
# di `privata` e accanto esiste `privata.pub`, ssh-keygen legge la .pub senza
# verificare che appartenga davvero alla privata. E' esattamente la coppia
# discordante che il capitolo 2 deve riconoscere.
lab_fp() { ssh-keygen -lf /dev/stdin 2>/dev/null < "$1" | awk '{print $2}'; }

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

# lab_login_fallito UTENTE_LOCALE [opzioni] — 0 solo se ssh ha raggiunto il
# server ed e' stato rifiutato durante l'autenticazione.
#
# Non e' la negazione di lab_login_riuscito: host sconosciuto, porta chiusa e
# timeout sono prove che non si sono potute fare, non login respinti. Trattarli
# come successi insegnerebbe che rompere la rete equivale a ritirare una chiave.
lab_login_fallito() {
    u=$1; shift
    if out=$(lab_login_prova "$u" "$@"); then rc=0; else rc=$?; fi
    lab_fact login "$(printf '%s' "$out" | tr '\n' ' ' | cut -c1-76)"
    [ "$rc" -ne 0 ] || return 1
    printf '%s\n' "$out" | grep -Eq \
        'Permission denied|Too many authentication failures'
}

# lab_hostkey_fp — impronta della chiave con cui sshd si presenta adesso.
lab_hostkey_fp() { lab_fp /etc/ssh/ssh_host_ed25519_key.pub; }

# lab_known_hosts_fp UTENTE — tutte le impronte annotate da quell'utente.
# `ssh-keygen -lf` interpreta il formato known_hosts anche quando gli hostname
# sono hashati; parsare le righe a mano farebbe fallire proprio il caso reale.
lab_known_hosts_fp() {
    home=$(getent passwd "$1" 2>/dev/null | cut -d: -f6)
    [ -n "$home" ] || return 1
    ssh-keygen -lf "$home/.ssh/known_hosts" 2>/dev/null \
        | awk '$2 ~ /^(SHA256:|MD5:)/ { print $2 }'
}

# lab_agent_socket UTENTE — trova un agent vivo appartenente a quell'utente.
# Il check gira come root in un altro processo e non eredita SSH_AUTH_SOCK. Il
# nome del socket non basta: un agent terminato puo' aver lasciato resti su disco,
# quindi si accettano soltanto socket a cui ssh-add riesce davvero a parlare.
lab_agent_socket() {
    u=$1
    home=$(getent passwd "$u" 2>/dev/null | cut -d: -f6)
    [ -n "$home" ] || return 1
    vuoto=
    for s in $(find /tmp /run "$home" -xdev -type s -user "$u" -name 'agent.*' 2>/dev/null); do
        if lab_come "$u" "SSH_AUTH_SOCK='$s' ssh-add -l >/dev/null"; then rc=0; else rc=$?; fi
        # ssh-add: 0 con chiavi, 1 se l'agent e' vivo ma vuoto, 2 se non risponde.
        # Se ce ne sono piu' d'uno si preferisce quello che contiene identita'.
        if [ "$rc" -eq 0 ]; then
            printf '%s\n' "$s"
            return 0
        fi
        [ "$rc" -ne 1 ] || vuoto=$s
    done
    [ -n "$vuoto" ] || return 1
    printf '%s\n' "$vuoto"
    return 0
}

# lab_agent_impronte UTENTE — le sole impronte delle chiavi caricate.
lab_agent_impronte() {
    u=$1
    s=$(lab_agent_socket "$u") || return 1
    lab_come "$u" "SSH_AUTH_SOCK='$s' ssh-add -l" \
        | awk '$2 ~ /^(SHA256:|MD5:)/ { print $2 }'
}

# lab_offerte UTENTE — quanti tentativi publickey sono falliti nella stessa
# connessione prima dell'ultimo Accepted. Il parametro identifica l'utente sul
# pc; nel log il server vede invece utente remoto, IP e porta della connessione.
# Contare per porta evita di sommare tentativi appartenenti a sessioni vecchie.
lab_offerte() {
    id "$1" >/dev/null 2>&1 || return 1
    remoto=$(lab_srv_user)
    awk -v remoto="$remoto" '
        function connessione(s) {
            sub(/^.* from /, "", s)
            sub(/ ssh2.*$/, "", s)
            return s
        }
        index($0, "Failed publickey for " remoto " from ") {
            k = connessione($0)
            fallite[k]++
        }
        index($0, "Accepted publickey for " remoto " from ") {
            k = connessione($0)
            ultima = fallite[k] + 0
            trovata = 1
        }
        END {
            if (!trovata) exit 1
            print ultima
        }
    ' /var/log/messages 2>/dev/null
}

# lab_modo FILE — modo ottale senza il tipo del file (700, 600, ...).
# Il check gli da' un nome didattico con lab_fact, per esempio:
#   modo=$(lab_modo "$HOME/.ssh"); lab_fact modo_ssh "$modo"
lab_modo() { stat -c '%a' "$1" 2>/dev/null; }

# lab_sshd_config_intatto — confronta il config con l'impronta registrata dopo
# il seed. La baseline e' di root nell'area sticky del lab: chi studia puo' cambiare
# sshd_config, ma non puo' spostare il riferimento insieme al bersaglio.
lab_sshd_config_intatto() {
    atteso=$(cat "$LAB_STATE/sshd_config.fp" 2>/dev/null)
    attuale=$(sha256sum /etc/ssh/sshd_config.lab 2>/dev/null | awk '{print $1}')
    if [ -n "$atteso" ] && [ "$attuale" = "$atteso" ]; then
        lab_fact sshd_config "intatto ($attuale)"
        return 0
    fi
    lab_fact sshd_config "modificato (${attuale:-(file assente)})"
    return 1
}

# lab_sshd_dice PATTERN — l'ultima riga del registro del server che combacia.
#
# E' il testimone: sshd scrive "Accepted publickey for deploy ... ED25519
# SHA256:xxxx", cioe' METODO e IMPRONTA di quello che ha accettato davvero. Un
# check che guarda qui non sta guardando cosa ha DIGITATO chi studia — sta
# guardando cosa e' successo al server. E' la differenza fra sorvegliare e
# misurare.
lab_sshd_dice() {
    grep -E ' (sshd|sshd-session)\[[0-9]+\]: ' /var/log/messages 2>/dev/null \
        | grep -E "$1" | tail -1
}

# lab_log_azzera — da chiamare nel seed: senza, il testimone dell'esercizio
# precedente resta li' e un check passa senza che nessuno abbia fatto niente.
lab_log_azzera() { : > /var/log/messages 2>/dev/null || true; }
