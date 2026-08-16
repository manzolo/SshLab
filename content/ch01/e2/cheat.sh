# Il trucco: il file lo scrive il pc, senza mai bussare al server. Siccome il
# disco e' condiviso, il file compare davvero — ed e' proprio per questo che il
# primo check da solo non basterebbe. Il secondo, che guarda il registro di sshd,
# lo smaschera.
lab_srv hostname > /home/deploy/prova.txt
chown deploy:deploy /home/deploy/prova.txt
