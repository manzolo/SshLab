# Cancellare la riga revoca, ma perde la traccia e rende meno semplice annullare.
tail -n +2 /home/deploy/.ssh/authorized_keys > /tmp/authorized_keys.nuovo
install -m 600 -o deploy -g deploy /tmp/authorized_keys.nuovo /home/deploy/.ssh/authorized_keys
