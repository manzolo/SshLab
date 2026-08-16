#!/bin/sh
# Prova I1-I4 dentro la VM vera. Non verifica soltanto che i file esistano: usa
# i pool, riavvia sshd, parla con un agent e produce un rifiuto seguito da un
# login reale, cioe' gli stessi fatti su cui poggeranno i capitoli.

set -u
. /opt/lab/lib/labcheck.sh

fallisci() { echo "KO: $*"; exit 1; }
uguale() { [ "$1" = "$2" ] || fallisci "$3: ottenuto '$1', atteso '$2'"; }

CONFIG=/etc/ssh/sshd_config.lab
CONFIG_COPIA=/tmp/sshd_config.lab.infrastruttura
AGENT_SOCK=/tmp/agent.sshlab-infrastruttura
AGENT_ENV=/tmp/agent.sshlab-infrastruttura.env

ripulisci() {
    if [ -f "$AGENT_ENV" ]; then
        pid=$(sed -n 's/^SSH_AGENT_PID=\([0-9][0-9]*\);.*/\1/p' "$AGENT_ENV")
        [ -z "$pid" ] || kill "$pid" 2>/dev/null || true
    fi
    rm -f "$AGENT_SOCK" "$AGENT_ENV"
    rm -rf /home/manzolo/.ssh /home/deploy/.ssh
    if [ -f "$CONFIG_COPIA" ]; then
        cp "$CONFIG_COPIA" "$CONFIG"
        rm -f "$CONFIG_COPIA"
    fi
    lab_log_azzera
}
trap ripulisci EXIT

# I1: otto coppie complete, distinte e con private non leggibili da altri.
uguale "$(find /opt/lab/hostkeys -type f -name ssh_host_ed25519_key | wc -l | tr -d ' ')" 8 \
    "numero di host key private"
uguale "$(find /opt/lab/hostkeys -type f -name ssh_host_ed25519_key.pub | wc -l | tr -d ' ')" 8 \
    "numero di host key pubbliche"

impronte_host=$(
    for k in /opt/lab/hostkeys/*/ssh_host_ed25519_key.pub; do lab_fp "$k"; done \
        | sort -u | wc -l | tr -d ' '
)
uguale "$impronte_host" 8 "host key distinte"
for k in /opt/lab/hostkeys/*/ssh_host_ed25519_key; do
    uguale "$(lab_modo "$k")" 600 "modo di $k"
done

# Il riavvio installa davvero una chiave diversa e lascia sshd dentro entrambi i
# namespace del server. Questo copre il vecchio deploy@pc alla sua causa.
prima=$(lab_hostkey_fp)
scelta=
for d in /opt/lab/hostkeys/*; do
    [ "$(lab_fp "$d/ssh_host_ed25519_key.pub")" = "$prima" ] || { scelta=$d; break; }
done
[ -n "$scelta" ] || fallisci "non c'e' una host key alternativa"
install -m 600 "$scelta/ssh_host_ed25519_key" /etc/ssh/ssh_host_ed25519_key
install -m 644 "$scelta/ssh_host_ed25519_key.pub" /etc/ssh/ssh_host_ed25519_key.pub
/opt/lab/bin/lab-sshd-riavvia || fallisci "riavvio di sshd"
[ "$(lab_hostkey_fp)" != "$prima" ] || fallisci "sshd usa ancora la host key precedente"

pid=$(cat /run/lab/sshd.pid)
nsenter -t "$pid" --net ip link show veth-srv >/dev/null 2>&1 || \
    fallisci "sshd non e' nel namespace di rete del server"
uguale "$(nsenter -t "$pid" --uts hostname)" server "namespace UTS di sshd"

# I2: sedici ed25519 e due RSA-4096, tutte coppie valide e distinte.
uguale "$(find /opt/lab/keys/ed25519 -type f ! -name '*.pub' | wc -l | tr -d ' ')" 16 \
    "numero di chiavi utente ed25519"
uguale "$(find /opt/lab/keys/rsa -type f ! -name '*.pub' | wc -l | tr -d ' ')" 2 \
    "numero di chiavi utente RSA"

impronte_utenti=$(
    for k in /opt/lab/keys/ed25519/*.pub /opt/lab/keys/rsa/*.pub; do lab_fp "$k"; done \
        | sort -u | wc -l | tr -d ' '
)
uguale "$impronte_utenti" 18 "chiavi utente distinte"
for k in /opt/lab/keys/ed25519/[0-9][0-9] /opt/lab/keys/rsa/[0-9][0-9]; do
    uguale "$(lab_modo "$k")" 600 "modo di $k"
done
for k in /opt/lab/keys/rsa/*.pub; do
    uguale "$(ssh-keygen -lf "$k" | awk '{print $1}')" 4096 "lunghezza di $k"
done

# ssh-keygen -lf privata preferisce una `privata.pub` adiacente, anche quando
# appartiene a un'altra chiave. lab_fp deve leggere il file richiesto davvero.
DIR_FP=/tmp/lab-fp-infrastruttura
rm -rf "$DIR_FP"
mkdir -p "$DIR_FP"
cp /opt/lab/keys/ed25519/01 "$DIR_FP/privata"
cp /opt/lab/keys/ed25519/02.pub "$DIR_FP/privata.pub"
uguale "$(lab_fp "$DIR_FP/privata")" "$(lab_fp /opt/lab/keys/ed25519/01.pub)" \
    "impronta della privata con sidecar discordante"
rm -rf "$DIR_FP"

# known_hosts: il file viene hashato prima della lettura. Un parser artigianale
# della riga non passerebbe; ssh-keygen -lf invece conserva l'impronta.
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
{
    printf '%s ' "$(lab_srv_ip)"
    cat /etc/ssh/ssh_host_ed25519_key.pub
} > /home/manzolo/.ssh/known_hosts
chown manzolo:manzolo /home/manzolo/.ssh/known_hosts
ssh-keygen -q -H -f /home/manzolo/.ssh/known_hosts
rm -f /home/manzolo/.ssh/known_hosts.old
chown manzolo:manzolo /home/manzolo/.ssh/known_hosts
uguale "$(lab_known_hosts_fp manzolo)" "$(lab_hostkey_fp)" \
    "impronta da known_hosts hashato"

# Agent: il socket non viene passato al check. Va ritrovato sul disco per
# proprietario, poi interrogato come l'utente che lo possiede.
install -m 600 -o manzolo -g manzolo /opt/lab/keys/ed25519/02 \
    /home/manzolo/.ssh/agent-buona
install -m 600 -o manzolo -g manzolo /opt/lab/keys/ed25519/03 \
    /home/manzolo/.ssh/agent-esca
su manzolo -c "ssh-agent -a '$AGENT_SOCK' > '$AGENT_ENV'" || fallisci "avvio ssh-agent"
su manzolo -c "SSH_AUTH_SOCK='$AGENT_SOCK' ssh-add /home/manzolo/.ssh/agent-buona </dev/null" \
    >/dev/null 2>&1 || fallisci "caricamento chiave nell'agent"
uguale "$(lab_agent_socket manzolo)" "$AGENT_SOCK" "socket dell'agent"
uguale "$(lab_agent_impronte manzolo)" "$(lab_fp /opt/lab/keys/ed25519/02.pub)" \
    "impronta caricata nell'agent"

agent_pid=$(sed -n 's/^SSH_AGENT_PID=\([0-9][0-9]*\);.*/\1/p' "$AGENT_ENV")
kill "$agent_pid"
rm -f "$AGENT_SOCK" "$AGENT_ENV"

# Un rifiuto di autenticazione e una porta chiusa sono entrambi exit 255 per
# ssh. L'helper deve accettare il primo e rifiutare il secondo.
rm -rf /home/deploy/.ssh
opzioni="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
lab_login_fallito manzolo $opzioni >/dev/null || \
    fallisci "un'autenticazione rifiutata non e' stata riconosciuta"
if lab_login_fallito manzolo $opzioni -p 1 >/dev/null; then
    fallisci "una porta chiusa e' stata scambiata per autenticazione rifiutata"
fi

# Una chiave esca viene offerta prima di quella autorizzata. Il conto viene dal
# log di sshd e dalla porta della connessione, non dalle opzioni del client.
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy /opt/lab/keys/ed25519/02.pub \
    /home/deploy/.ssh/authorized_keys
lab_log_azzera
lab_login_riuscito manzolo $opzioni -o IdentitiesOnly=yes \
    -i /home/manzolo/.ssh/agent-esca -i /home/manzolo/.ssh/agent-buona >/dev/null || \
    fallisci "login con una esca seguita dalla chiave giusta"
# Leggere il registro con sudo aggiunge una riga che contiene il testo cercato.
# Il testimone deve restare sshd, non il comando usato per interrogarlo.
printf '%s\n' "Aug 16 12:00:00 pc auth.notice sudo: COMMAND=/bin/grep 'Accepted publickey' /var/log/messages" \
    >> /var/log/messages
riga_sshd=$(lab_sshd_dice 'Accepted publickey')
printf '%s\n' "$riga_sshd" | grep -Eq ' (sshd|sshd-session)\[[0-9]+\]: ' || \
    fallisci "lab_sshd_dice ha scambiato la riga sudo per il testimone"
offerte=$(lab_offerte manzolo) || fallisci "conto delle offerte assente"
[ "$offerte" -ge 1 ] && [ "$offerte" -le 2 ] || \
    fallisci "conto delle offerte inatteso: $offerte"

# La baseline del config e' quella registrata dal mondo corrente. Anche una
# modifica innocua al testo deve cambiare l'impronta e quindi fallire.
lab_sshd_config_intatto >/dev/null || fallisci "config iniziale segnato come modificato"
cp "$CONFIG" "$CONFIG_COPIA"
printf '\n# modifica di prova\n' >> "$CONFIG"
if lab_sshd_config_intatto >/dev/null; then
    fallisci "config modificato segnato come intatto"
fi
cp "$CONFIG_COPIA" "$CONFIG"
rm -f "$CONFIG_COPIA"

# I4: i manuali SSH sono materiale didattico; il resto del vecchio magazzino no.
[ ! -e /opt/repo ] || fallisci "il repository apk offline e' ancora presente"
for p in mandoc openssh-doc; do
    apk info -e "$p" >/dev/null 2>&1 || fallisci "il pacchetto didattico $p manca"
done
MANPAGER=cat man ssh_config 2>/dev/null | grep -q SSH_CONFIG || \
    fallisci "man ssh_config non e' consultabile"
MANPAGER=cat man sshd_config 2>/dev/null | grep -q SSHD_CONFIG || \
    fallisci "man sshd_config non e' consultabile"
for p in mandoc-apropos man-pages coreutils-doc findutils-doc grep-doc \
         sed-doc gawk-doc util-linux-doc procps-ng-doc bash-doc less-doc; do
    apk info -e "$p" >/dev/null 2>&1 && fallisci "il pacchetto residuo $p e' installato"
done

echo "OK: pool, helper, namespace e immagine verificati"
