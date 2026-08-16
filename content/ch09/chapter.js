export default {
    id: "ch09", num: 9, requires: ["ch08"], draft: false,
    title: { it: "La passphrase", en: "The passphrase" },
    oneLiner: { it: "Cifra la privata sul disco; non cambia la chiave e non ritira le copie.", en: "It encrypts the private key on disk; it neither changes the key nor revokes copies." },
    commands: ["ssh-keygen -p", "ssh-keygen -y", "ssh-keygen -lf", "ssh -i", "man ssh-keygen"],
    glossary: ["passphrase", "cifratura a riposo", "KDF", "backup", "ritiro"],
    blocks: [
        { kind: "hook", html: { it: `Una privata senza passphrase finisce in un backup. Chi
            legge quel file entra senza una seconda barriera. Aggiungi una passphrase alla copia
            sul pc: il file diventa cifrato. Poi scopri che il vecchio backup continua ad aprire
            la stessa porta.`, en: `An unprotected private key ends up in a backup. Anyone who
            reads that file can log in without a second barrier. Add a passphrase to the copy on
            the pc: the file becomes encrypted. Then discover that the old backup still opens
            the same door.` } },
        { kind: "lead", html: { it: `La passphrase protegge la privata a riposo. Quando la usi,
            <code>ssh-keygen</code> la decifra in memoria e la chiave firma come prima. L'impronta
            pubblica non cambia; nessuna riga in <code>authorized_keys</code> cambia. E nessuna
            copia gia' uscita viene cifrata a distanza.`, en: `A passphrase protects the private
            key at rest. When used, <code>ssh-keygen</code> decrypts it in memory and the key
            signs as before. The public fingerprint does not change; no
            <code>authorized_keys</code> entry changes. And no copy already made becomes
            encrypted remotely.` } },
        { kind: "analogy", html: { it: `Metti la penna in una cassaforte. Non cambi la firma e
            non fai sparire le fotocopie della penna gia' distribuite. Proteggi solo quella copia,
            da questo momento in poi.`, en: `You put the pen in a safe. You do not change the
            signature or make already distributed copies of the pen disappear. You protect only
            that copy, from now on.` } },
        { kind: "shown", lines: [
            { cmd: "ssh-keygen -p -f ~/.ssh/id_ed25519", out: "Enter old passphrase:\nEnter new passphrase (empty for no passphrase):\nYour identification has been saved with the new passphrase.", note: { it: "La coppia resta la stessa; cambia la cifratura del file privato.", en: "The pair remains the same; encryption of the private file changes." } },
            { cmd: "ssh-keygen -y -P '' -f ~/.ssh/id_ed25519", out: "Load key ...: incorrect passphrase supplied to decrypt private key", note: { it: "La passphrase vuota fallisce: e' una prova sul file, non sull'agent.", en: "The empty passphrase fails: this tests the file, not the agent." } },
            { cmd: "ssh-keygen -lf ~/.ssh/id_ed25519", out: "256 SHA256:... (ED25519)", note: { it: "L'impronta resta leggibile e identica: la parte pubblica e' nel formato privato.", en: "The fingerprint remains readable and unchanged: the private format contains the public half." } },
        ] },
        { kind: "pitfalls", items: [
            { it: `<strong>Pensi di aver ruotato la chiave.</strong> Hai cifrato un file esistente.
                La pubblica autorizzata e l'impronta sono identiche; un vecchio duplicato della
                privata resta valido.`, en: `<strong>You think you rotated the key.</strong> You
                encrypted one existing file. The authorised public key and fingerprint are
                unchanged; an old duplicate of the private key remains valid.` },
            { it: `<strong>Provi dal login e l'agent ti inganna.</strong> Se l'agent ha gia' la
                chiave sbloccata, il login riesce senza chiedere niente. Interroga direttamente
                il file con una passphrase vuota.`, en: `<strong>You test by logging in and the
                agent misleads you.</strong> If the agent already holds the unlocked key, login
                succeeds without asking. Query the file directly with an empty passphrase.` },
        ] },
        { kind: "pro", html: { it: `<p>Il formato <code>openssh-key-v1</code> lascia la meta'
            pubblica in chiaro e cifra il materiale privato usando una chiave derivata dalla
            passphrase. Ecco perche' <code>ssh-keygen -lf</code> calcola l'impronta anche sulla
            privata cifrata, mentre <code>ssh-keygen -y -P ''</code> fallisce.</p><p>L'opzione
            <code>-a</code> aumenta i giri della derivazione e rende piu' costoso provare molte
            passphrase. In questo browser emulato usiamo il valore predefinito per non trasformare
            la lezione in attesa; su una macchina reale usa <code>-a 100</code>. Leggi
            <code>man ssh-keygen</code>.</p>`, en: `<p>The <code>openssh-key-v1</code> format leaves
            the public half in clear text and encrypts private material with a key derived from
            the passphrase. That is why <code>ssh-keygen -lf</code> can fingerprint an encrypted
            private key while <code>ssh-keygen -y -P ''</code> fails.</p><p>The <code>-a</code>
            option increases derivation rounds and makes bulk passphrase guesses more expensive.
            This emulated browser uses the default to avoid turning the lesson into waiting; on
            a real machine use <code>-a 100</code>. Read <code>man ssh-keygen</code>.</p>` } },
        { kind: "lab" },
        { kind: "recap", table: [
            { cmd: "ssh-keygen -p -f privata", what: { it: "aggiunge o cambia la passphrase", en: "add or change the passphrase" }, flag: { it: "non genera una chiave nuova", en: "does not generate a new key" } },
            { cmd: "ssh-keygen -y -P '' -f privata", what: { it: "prova se il file accetta una passphrase vuota", en: "test whether the file accepts an empty passphrase" }, flag: { it: "deve fallire se protetto", en: "must fail when protected" } },
            { cmd: "ssh-keygen -lf privata", what: { it: "riconosce la stessa impronta pubblica", en: "recognise the same public fingerprint" }, flag: { it: "funziona anche se cifrata", en: "works even when encrypted" } },
        ] },
    ],
    exercises: [
        { id: "e1", tipo: "stato", brief: { it: `Proteggi
            <code>~/.ssh/id_ed25519</code> con una passphrase usando <code>ssh-keygen -p</code>.
            Sceglila tu e ricordala. La pubblica deve restare la stessa.`, en: `Protect
            <code>~/.ssh/id_ed25519</code> with a passphrase using <code>ssh-keygen -p</code>.
            Choose and remember it. The public key must remain the same.` },
          come: [{ dove: "pc", testo: { it: "Aggiungi la passphrase al file esistente:", en: "Add a passphrase to the existing file:" }, cmd: "ssh-keygen -p -f ~/.ssh/id_ed25519" }, { dove: "pc", testo: { it: "Verifica che una passphrase vuota venga rifiutata:", en: "Verify that an empty passphrase is rejected:" }, cmd: "ssh-keygen -y -P '' -f ~/.ssh/id_ed25519" }, { dove: "pc", testo: { it: "Calcola ancora l'impronta:", en: "Compute the fingerprint again:" }, cmd: "ssh-keygen -lf ~/.ssh/id_ed25519" }],
          nota: { it: "Il check ha registrato l'impronta prima della modifica e confronta quella stessa identita'.", en: "The check recorded the fingerprint before the change and compares that same identity." },
          checks: [{ id: "privata-cifrata", why: { it: "Il file privato accetta ancora una passphrase vuota.", en: "The private file still accepts an empty passphrase." }, nudge: { it: "Esegui la prova con <code>ssh-keygen -y -P ''</code>, non con un login.", en: "Test with <code>ssh-keygen -y -P ''</code>, not with a login." } }, { id: "pubblica-invariata", why: { it: "L'impronta non e' piu' quella registrata dal seed.", en: "The fingerprint no longer matches the seed baseline." }, nudge: { it: "<code>-p</code> modifica la protezione; non sostituire il file con un'altra chiave.", en: "<code>-p</code> changes protection; do not replace the file with another key." } }],
          hints: [{ it: "La P minuscola modifica la passphrase di una privata esistente.", en: "Lowercase p changes the passphrase of an existing private key." }, { it: "La vecchia passphrase e' vuota: premi Invio.", en: "The old passphrase is empty: press Enter." }, { it: "Usa <code>ssh-keygen -p -f ~/.ssh/id_ed25519</code> e inserisci due volte la nuova passphrase.", en: "Use <code>ssh-keygen -p -f ~/.ssh/id_ed25519</code> and enter the new passphrase twice." }] },
        { id: "e2", tipo: "risposta", brief: { it: `La chiave principale ora e' protetta, ma
            <code>~/lab/backup-2019/id_ed25519</code> e' una vecchia copia in chiaro. Entra usando
            soltanto quella e consegna l'impronta che <code>sshd</code> ha accettato.`, en: `The
            main key is now protected, but <code>~/lab/backup-2019/id_ed25519</code> is an old
            unencrypted copy. Log in using only that copy and submit the fingerprint accepted by
            <code>sshd</code>.` },
          come: [{ dove: "pc", testo: { it: "Isola la copia del backup:", en: "Isolate the backup copy:" }, cmd: "ssh -o BatchMode=yes -o IdentitiesOnly=yes -i ~/lab/backup-2019/id_ed25519 deploy@10.10.0.2 true" }, { dove: "server", testo: { it: "Leggi l'ultima riga Accepted publickey di sshd.", en: "Read sshd's latest Accepted publickey line." } }, { dove: "pc", testo: { it: "Consegna il campo SHA256:", en: "Submit the SHA256 field:" }, cmd: "lab answer SHA256:..." }],
          nota: { it: "Cifrata sul pc non significa cancellata dai posti che conosci, meno ancora da quelli che hai dimenticato.", en: "Encrypted on the pc does not mean deleted from places you know, much less places you forgot." },
          checks: [{ id: "backup-ancora-valido", why: { it: "Il registro non dimostra un accesso con la chiave del backup.", en: "The log does not prove a login with the backup key." }, nudge: { it: "Usa IdentitiesOnly e il percorso completo del backup, poi leggi sshd.", en: "Use IdentitiesOnly and the full backup path, then read sshd." } }, { id: "impronta-backup", why: { it: "La risposta non e' l'impronta accettata dal server.", en: "The answer is not the fingerprint accepted by the server." }, nudge: { it: "Copia il campo SHA256 dalla riga Accepted publickey.", en: "Copy the SHA256 field from the Accepted publickey line." } }],
          hints: [{ it: "La copia ha la stessa pubblica della chiave protetta.", en: "The copy has the same public key as the protected key." }, { it: "BatchMode evita che una password mascheri il risultato.", en: "BatchMode prevents a password from masking the result." }, { it: "Entra con <code>-o IdentitiesOnly=yes -i ~/lab/backup-2019/id_ed25519</code>.", en: "Log in with <code>-o IdentitiesOnly=yes -i ~/lab/backup-2019/id_ed25519</code>." }] },
    ],
};
