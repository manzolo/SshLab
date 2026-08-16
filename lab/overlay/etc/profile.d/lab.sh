# Ambiente della shell di chi studia.
export PATH="/opt/lab/bin:$PATH"
export LAB="$HOME/lab"
export PAGER=less
export MANPAGER=less
export EDITOR=vi
export LESS="-R"
# Il prompt dice CHI SEI e SU QUALE MACCHINA, oltre a dove.
#
# In un lab a due host non e' un vezzo: e' l'unico segnale che resta vero quando
# fai `ssh` dal terminale di sinistra e ti ritrovi sul server. La finestra e'
# sempre quella, il colore del riquadro pure — cambia solo il prompt. Chi non ci
# fa caso finisce per cancellare file sulla macchina sbagliata.
#
# Il colore segue la macchina: ciano il pc, ambra il server, come i riquadri.
if [ "$(hostname 2>/dev/null)" = "server" ]; then _lab_col=179; else _lab_col=79; fi
export PS1='\[\e[38;5;'"$_lab_col"'m\]\u@\h\[\e[0m\]:\[\e[38;5;245m\]\w\[\e[0m\]\$ '
[ -d "$LAB" ] || mkdir -p "$LAB" 2>/dev/null
cd "$LAB" 2>/dev/null || true

# Cambiando esercizio, il mondo precedente viene svuotato. Se in quel momento eri
# dentro una sottocartella, quella sparisce e la shell resta "appesa" a una
# directory che non esiste piu': il prompt continua a mostrarne il nome ma ogni
# comando risponde "cannot open directory". Qui la shell si riporta a casa da sola,
# in silenzio, prima di ogni prompt.
if [ -n "$BASH_VERSION" ]; then
    PROMPT_COMMAND='[ -e "$PWD" ] || cd "$LAB" 2>/dev/null'
    export PROMPT_COMMAND
fi
