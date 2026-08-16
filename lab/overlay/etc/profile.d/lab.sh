# Ambiente della shell di chi studia.
export PATH="/opt/lab/bin:$PATH"
export LAB="$HOME/lab"
export PAGER=less
export MANPAGER=less
export EDITOR=vi
export LESS="-R"
# Un prompt che dice sempre dove sei: e' meta' del capitolo 02.
export PS1='\[\e[38;5;79m\]\w\[\e[0m\] $ '
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
