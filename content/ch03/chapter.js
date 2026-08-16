export default {
    id: "ch03", num: 3, requires: ["ch02"], draft: false,
    title: { it: "L'impronta", en: "The fingerprint" },
    oneLiner: {
        it: "Il nome racconta dove hai messo una chiave. L'impronta dice quale chiave e'.",
        en: "The name tells you where you put a key. The fingerprint tells you which key it is.",
    },
    commands: ["ssh-keygen -lf", "ssh-keygen -E md5 -lf", "man ssh_config", "diff"],
    glossary: ["impronta", "SHA256", "hash", "base64", "commento"],

    blocks: [
        { kind: "hook", html: {
            it: `Cerchi una chiave da ritirare e trovi <code>id_ed25519</code>,
                 <code>lavoro</code>, <code>vecchia.pub</code> e una copia in
                 <code>backup/</code>. I nomi sembrano raccontare quattro storie. Potrebbero
                 essere quattro chiavi oppure quattro copie della stessa. Se decidi dal nome,
                 stai amministrando etichette.`,
            en: `You need to revoke a key and find <code>id_ed25519</code>,
                 <code>work</code>, <code>old.pub</code>, and a copy under
                 <code>backup/</code>. Their names appear to tell four stories. They may be
                 four keys, or four copies of the same one. If you decide from the name, you
                 are managing labels.` } },

        { kind: "lead", html: {
            it: `L'identita' stabile e' l'<strong>impronta</strong>. La calcoli con
                 <code>ssh-keygen -lf file</code>. Se due file hanno la stessa impronta,
                 contengono la stessa chiave anche se nome, percorso e commento cambiano.
                 Se le impronte differiscono, due nomi uguali non li rendono parenti.`,
            en: `The stable identity is the <strong>fingerprint</strong>. Compute it with
                 <code>ssh-keygen -lf file</code>. If two files have the same fingerprint,
                 they contain the same key even when their names, paths, and comments differ.
                 If the fingerprints differ, matching names do not make them related.` } },

        { kind: "analogy", html: {
            it: `Il nome del file e' l'etichetta su una scatola. Puoi staccarla, riscriverla
                 o mettere lo stesso oggetto in un'altra scatola. L'impronta e' il numero di
                 serie inciso sull'oggetto: per fare un censimento guardi quello, non la
                 calligrafia sull'etichetta.`,
            en: `The filename is the label on a box. You can peel it off, rewrite it, or put
                 the same object in another box. The fingerprint is the serial number engraved
                 on the object: for an inventory, you inspect that number, not the handwriting
                 on the label.` } },

        { kind: "shown", lines: [
            { cmd: "ssh-keygen -lf ~/.ssh/id_ed25519.pub", out: "256 SHA256:Wk0...9Q manzolo@pc (ED25519)",
              note: { it: "<code>256</code> e' la dimensione, <code>SHA256:...</code> e' l'impronta, poi vengono commento e tipo.", en: "<code>256</code> is the size, <code>SHA256:...</code> is the fingerprint, followed by comment and type." } },
            { cmd: "cp ~/.ssh/id_ed25519.pub ~/lavoro.pub; ssh-keygen -lf ~/lavoro.pub", out: "256 SHA256:Wk0...9Q manzolo@pc (ED25519)",
              note: { it: "Il percorso e' cambiato. L'identita' no.", en: "The path changed. The identity did not." } },
            { cmd: "ssh-keygen -E md5 -lf ~/lavoro.pub", out: "256 MD5:6a:31:...:d2 manzolo@pc (ED25519)",
              note: { it: "Stessa chiave, rappresentazione vecchia. Prima di confrontare, usa lo stesso algoritmo.", en: "Same key, old representation. Before comparing, use the same algorithm." } },
        ] },

        { kind: "pitfalls", items: [
            { it: `<strong>Vedi <code>id_ed25519.old</code> e lo cancelli perche' sembra
                    superato.</strong> Il suffisso non dice quando e' nata la chiave ne' dove
                    e' ancora autorizzata. Prima annota l'impronta; poi cerca quella stessa
                    impronta sui server.`,
              en: `<strong>You see <code>id_ed25519.old</code> and delete it because it looks
                    obsolete.</strong> The suffix says neither when the key was created nor
                    where it is still authorised. Record the fingerprint first; then search
                    for that fingerprint on the servers.` },
            { it: `<strong><code>diff</code> dice che due pubbliche sono diverse e gli credi.</strong>
                    Basta cambiare il commento finale per rendere diverse le righe. La chiave
                    puo' essere ancora la stessa. Chiedilo a <code>ssh-keygen -lf</code>.`,
              en: `<strong><code>diff</code> says two public keys differ and you believe it.</strong>
                    Changing the trailing comment is enough to make the lines differ. The key
                    may still be the same. Ask <code>ssh-keygen -lf</code>.` },
            { it: `<strong>Confronti una riga <code>SHA256:</code> con una <code>MD5:</code>.</strong>
                    Non sono due chiavi: sono due hash della stessa chiave. Normalizza il formato
                    prima di dichiarare una mancata corrispondenza.`,
              en: `<strong>You compare a <code>SHA256:</code> line with an <code>MD5:</code>
                    line.</strong> They are not two keys: they are two hashes of the same key.
                    Normalise the format before declaring a mismatch.` },
        ] },

        { kind: "pro", html: {
            it: `<p>Una pubblica OpenSSH contiene tre parti: tipo, blocco codificato in base64
                 e commento. L'impronta SHA256 e' l'hash del blocco della chiave decodificato,
                 mostrato di nuovo in base64 e senza padding finale. Il commento resta fuori:
                 puoi sostituire <code>manzolo@pc</code> con <code>deploy-2026</code> senza
                 cambiare l'impronta.</p>
                 <p><code>-E md5</code> chiede invece MD5 e produce gli ottetti separati da due
                 punti che compaiono ancora su apparati vecchi. Non usare MD5 per nuovi
                 confronti; serve a parlare con un inventario che lo usa gia'. OpenSSH decide
                 il formato mostrato anche tramite <code>FingerprintHash</code>: cerca quella
                 voce con <code>man ssh_config</code>.</p>`,
            en: `<p>An OpenSSH public key has three parts: type, a base64-encoded blob, and a
                 comment. The SHA256 fingerprint hashes the decoded key blob, then displays it
                 in base64 without trailing padding. The comment is outside: you can replace
                 <code>manzolo@pc</code> with <code>deploy-2026</code> without changing the
                 fingerprint.</p>
                 <p><code>-E md5</code> requests MD5 instead and produces colon-separated bytes
                 still found on old appliances. Do not use MD5 for new comparisons; use it to
                 communicate with an inventory that already does. OpenSSH can also choose the
                 displayed format through <code>FingerprintHash</code>: find that entry with
                 <code>man ssh_config</code>.</p>` } },

        { kind: "lab" },

        { kind: "recap", table: [
            { cmd: "ssh-keygen -lf file", what: { it: "mostra l'impronta SHA256", en: "show the SHA256 fingerprint" }, flag: { it: "legge private e pubbliche", en: "reads private and public keys" } },
            { cmd: "ssh-keygen -E md5 -lf file", what: { it: "mostra il formato MD5 storico", en: "show the historical MD5 format" }, flag: { it: "solo per confronti con sistemi vecchi", en: "only for comparisons with old systems" } },
            { cmd: "man ssh_config", what: { it: "documenta le opzioni del client", en: "document client options" }, flag: { it: "cerca <code>/FingerprintHash</code>", en: "search for <code>/FingerprintHash</code>" } },
            { cmd: "diff file1 file2", what: { it: "confronta i file, non le identita'", en: "compare files, not identities" }, flag: { it: "un commento diverso basta a farlo fallire", en: "a different comment is enough to make it fail" } },
        ] },
    ],

    exercises: [
        {
            id: "e1", tipo: "risposta",
            brief: {
                it: `Nel <strong>pc</strong> e' comparsa <code>~/.ssh/id_ed25519.pub</code>.
                     Leggi la sua impronta SHA256 e consegnala completa, prefisso compreso,
                     con <code>lab answer SHA256:...</code>. La chiave cambia a ogni mondo.`,
                en: `A <code>~/.ssh/id_ed25519.pub</code> file has appeared on the
                     <strong>pc</strong>. Read its SHA256 fingerprint and submit it in full,
                     prefix included, with <code>lab answer SHA256:...</code>. The key changes
                     in every world.`,
            },
            come: [
                { dove: "pc", testo: { it: "Chiedi a OpenSSH di leggere la chiave:", en: "Ask OpenSSH to read the key:" }, cmd: "ssh-keygen -lf ~/.ssh/id_ed25519.pub" },
                { dove: "pc", testo: { it: "Nell'uscita prendi il campo che comincia con <code>SHA256:</code>.", en: "From the output, take the field beginning with <code>SHA256:</code>." } },
                { dove: "pc", testo: { it: "Consegna il valore senza aggiungere il commento:", en: "Submit the value without adding the comment:" }, cmd: "lab answer SHA256:..." },
            ],
            nota: {
                it: "La risposta non e' scritta nel capitolo: il seed sceglie una chiave diversa dal pool per ogni mondo e il check ricalcola l'impronta dal file.",
                en: "The answer is not written in the chapter: the seed chooses a different key from the pool for each world, and the check recomputes the fingerprint from the file.",
            },
            checks: [
                { id: "impronta-giusta",
                  why: { it: "Il valore consegnato non e' l'impronta SHA256 della chiave presente adesso.", en: "The submitted value is not the SHA256 fingerprint of the key currently present." },
                  nudge: { it: "Esegui <code>ssh-keygen -lf ~/.ssh/id_ed25519.pub</code> e copia soltanto il secondo campo, incluso <code>SHA256:</code>.", en: "Run <code>ssh-keygen -lf ~/.ssh/id_ed25519.pub</code> and copy only the second field, including <code>SHA256:</code>." } },
            ],
            hints: [
                { it: "Il nome del file non contiene la risposta. Devi leggerne il contenuto con uno strumento SSH.", en: "The filename does not contain the answer. You need to inspect its contents with an SSH tool." },
                { it: "Il comando e' <code>ssh-keygen -lf file</code>: <code>-l</code> mostra l'impronta e <code>-f</code> indica il file.", en: "The command is <code>ssh-keygen -lf file</code>: <code>-l</code> shows the fingerprint and <code>-f</code> selects the file." },
                { it: "Copia il secondo campo dell'uscita e consegnalo con <code>lab answer</code>.", en: "Copy the second output field and submit it with <code>lab answer</code>." },
            ],
        },
        {
            id: "e2", tipo: "risposta",
            brief: {
                it: `In <code>~/lab/chiavi/</code> ci sono sei pubbliche. Due rappresentano
                     la stessa chiave, ma hanno nomi e commenti diversi. Trovale e consegna i
                     due nomi separati da una virgola, in qualunque ordine:
                     <code>lab answer nome1.pub,nome2.pub</code>.`,
                en: `There are six public keys in <code>~/lab/chiavi/</code>. Two represent
                     the same key but have different names and comments. Find them and submit
                     both names separated by a comma, in either order:
                     <code>lab answer name1.pub,name2.pub</code>.`,
            },
            come: [
                { dove: "pc", testo: { it: "Entra nella cartella e stampa ogni nome accanto alla sua impronta:", en: "Enter the directory and print every name beside its fingerprint:" }, cmd: "cd ~/lab/chiavi; for f in *.pub; do printf '%-16s ' \"$f\"; ssh-keygen -lf \"$f\" | awk '{print $2}'; done" },
                { dove: "pc", testo: { it: "Cerca l'unico valore <code>SHA256:</code> che compare due volte.", en: "Find the only <code>SHA256:</code> value that appears twice." } },
                { dove: "pc", testo: { it: "Consegna i due nomi che gli stanno accanto, senza spazi:", en: "Submit the two names beside it, without spaces:" }, cmd: "lab answer <nome1.pub>,<nome2.pub>" },
            ],
            nota: {
                it: "I sei nomi nascono dal seme. La verifica pretende due file distinti fra quelli seminati e confronta le loro impronte; l'ordine non conta.",
                en: "All six names come from the seed. The check requires two distinct seeded files and compares their fingerprints; order does not matter.",
            },
            checks: [
                { id: "gemelle-trovate",
                  why: { it: "La risposta non indica due candidate distinte con la stessa impronta.", en: "The answer does not identify two distinct candidates with the same fingerprint." },
                  nudge: { it: "Non confrontare commenti o nomi. Stampa per ogni file il secondo campo di <code>ssh-keygen -lf</code> e cerca il duplicato.", en: "Do not compare comments or names. Print the second field from <code>ssh-keygen -lf</code> for every file and find the duplicate." } },
            ],
            hints: [
                { it: "Due righe possono essere diverse soltanto per il commento finale. <code>diff</code> qui trae in inganno.", en: "Two lines may differ only in their trailing comments. <code>diff</code> is misleading here." },
                { it: "Associa sempre il nome all'impronta: stampare soltanto sei SHA256 non ti dice quale file consegnare.", en: "Always associate the name with the fingerprint: printing six SHA256 values alone does not tell you which file to submit." },
                { it: "Trova l'impronta ripetuta e usa <code>lab answer primo.pub,secondo.pub</code>; puoi invertirli.", en: "Find the repeated fingerprint and use <code>lab answer first.pub,second.pub</code>; either order works." },
            ],
        },
    ],
};
