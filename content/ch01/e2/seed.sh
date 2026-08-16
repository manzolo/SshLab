# Mondo pulito: niente file di prova sul server, niente chiavi (il capitolo 1 si
# fa con la password: le chiavi arrivano dal 2), e il registro azzerato.
#
# Il registro va azzerato SEMPRE: e' il testimone su cui poggia il secondo check,
# e se restassero le righe dell'esercizio precedente l'esercizio risulterebbe
# superato senza che nessuno abbia bussato. (Stessa ragione per cui il lab
# fratello smonta i loop device fra un esercizio e l'altro.)
rm -f /home/deploy/prova.txt
rm -rf /home/manzolo/.ssh /home/deploy/.ssh
lab_log_azzera
mkdir -p "$LAB"
:
