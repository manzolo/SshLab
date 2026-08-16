# Due file con i nomi giusti non fanno una coppia: privata e pubblica arrivano
# da due identita' diverse del pool.
install -m 600 -o manzolo -g manzolo /opt/lab/keys/ed25519/01 \
    /home/manzolo/.ssh/id_ed25519
install -m 644 -o manzolo -g manzolo /opt/lab/keys/ed25519/02.pub \
    /home/manzolo/.ssh/id_ed25519.pub
