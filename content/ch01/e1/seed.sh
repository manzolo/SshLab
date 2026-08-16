# Il mondo dell'esercizio 1: l'indirizzo del server cambia col seme, cosi' la
# risposta non e' copiabile da nessun testo — nemmeno da questo capitolo.
#
# Non si riscrive l'indirizzo a mano nei due namespace: si sposta la rete intera.
# Il terzo ottetto viene dal seme, il quarto resta 1 e 2 per non complicare la
# lettura a chi sta imparando cos'e' un indirizzo.
terzo=$(edu_rand_int 20 250 11)
nuova_pc="10.10.$terzo.1"
nuova_srv="10.10.$terzo.2"

ip addr flush dev veth-pc 2>/dev/null
ip addr add "$nuova_pc/24" dev veth-pc
lab_srv ip addr flush dev veth-srv 2>/dev/null
lab_srv ip addr add "$nuova_srv/24" dev veth-srv

printf '%s' "$nuova_pc"  > /run/lab/pc_ip
printf '%s' "$nuova_srv" > /run/lab/srv_ip

# La cache ARP ricorda il vicino di prima: senza svuotarla, un ping al vecchio
# indirizzo continuerebbe a funzionare per qualche minuto e il mondo mentirebbe.
ip neigh flush all 2>/dev/null

mkdir -p "$LAB"
lab_log_azzera
:
