# La nuova funziona, ma la vecchia e' stata ritirata prima della prova.
install -m 600 -o deploy -g deploy /home/manzolo/.ssh/id_nuova.pub /home/deploy/.ssh/authorized_keys
lab_login_riuscito manzolo "-o IdentitiesOnly=yes -i /home/manzolo/.ssh/id_nuova" >/dev/null
