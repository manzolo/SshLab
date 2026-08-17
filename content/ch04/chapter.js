export default {
    id: "ch04", num: 4, requires: ["ch03"], draft: false,
    title: { it: "authorized_keys", en: "authorized_keys" },
    oneLiner: {
        it: "L'autorizzazione vive sul server. Una riga decide quale privata puo' aprire una sessione.",
        en: "Authorisation lives on the server. One line decides which private key may open a session.",
    },
    commands: ["ssh-copy-id", "ssh -o BatchMode=yes", "authorized_keys", "awk sul registro di sshd", "man sshd_config"],
    glossary: ["authorized_keys", "autorizzazione", "BatchMode", "registro", "Accepted publickey"],

    blocks: [
        { kind: "hook", html: {
            it: `Hai generato la coppia sul pc, ma il server continua a chiedere la password.
                 Non gli manca la tua privata: quella non deve arrivargli mai. Gli manca una
                 regola che dica <strong>questa pubblica puo' entrare come deploy</strong>.
                 Quella regola non sta in un servizio centrale. E' una riga sul server.`,
            en: `You generated the pair on your pc, but the server still asks for a password.
                 It does not need your private key: that key must never reach it. It needs a
                 rule saying <strong>this public key may log in as deploy</strong>. That rule
                 is not stored in a central service. It is one line on the server.` } },

        { kind: "lead", html: {
            it: `Per l'utente <code>deploy</code>, il file e'
                 <code>/home/deploy/.ssh/authorized_keys</code>. Ogni riga contiene una
                 pubblica autorizzata. Puoi aggiungerla con <code>ssh-copy-id</code> oppure a
                 mano. Il risultato che conta non e' il file: e' un login vero che riesce con
                 <code>BatchMode=yes</code>, quindi senza poter chiedere una password.`,
            en: `For user <code>deploy</code>, the file is
                 <code>/home/deploy/.ssh/authorized_keys</code>. Each line contains an
                 authorised public key. You may add it with <code>ssh-copy-id</code> or by hand.
                 The result that matters is not the file: it is a real login that succeeds with
                 <code>BatchMode=yes</code>, and therefore cannot ask for a password.` } },

        { kind: "analogy", html: {
            it: `La pubblica in <code>authorized_keys</code> e' un nome sulla lista degli
                 invitati. La privata e' il documento che dimostra di essere quella persona.
                 La lista resta all'ingresso, sul server; il documento resta in tasca, sul pc.
                 Copiare la lista in casa tua non convince il portiere dall'altra parte.`,
            en: `The public key in <code>authorized_keys</code> is a name on the guest list.
                 The private key is the document proving you are that person. The list stays at
                 the entrance, on the server; the document stays in your pocket, on the pc.
                 Copying the list into your own house does not convince the doorman elsewhere.` } },

        { kind: "shown", lines: [
            { cmd: "ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@10.10.0.2", out: "deploy@10.10.0.2's password:\nNumber of key(s) added: 1",
              note: { it: "La password serve questa volta: autorizza l'aggiunta della pubblica sul server.", en: "The password is needed this time: it authorises adding the public key on the server." } },
            { cmd: "ssh -o BatchMode=yes deploy@10.10.0.2 'id -un'", out: "deploy",
              note: { it: "Se servisse ancora una password, BatchMode farebbe fallire il comando invece di fermarsi a chiederla.", en: "If a password were still required, BatchMode would fail instead of stopping to ask for it." } },
            { cmd: "sudo awk '$6 ~ /^sshd/ && /Accepted publickey/' /var/log/messages | tail -1", out: "sshd[...] Accepted publickey for deploy from 10.10.0.1 port ... ssh2: ED25519 SHA256:...",
              note: { it: "Si filtra anche il processo: altrimenti sudo registra il comando appena eseguito e grep finisce per trovare se stesso.", en: "The process is filtered too: otherwise sudo records the command just run and grep ends up finding itself." } },
        ] },

        { kind: "pitfalls", items: [
            { it: `<strong>Scrivi <code>~/.ssh/authorized_keys</code> senza guardare il
                    prompt.</strong> Sei ancora su <code>manzolo@pc</code>, quindi il file nasce
                    sul pc. E' perfetto, contiene la riga giusta, e non cambia nulla: chi decide
                    e' <code>deploy@server</code>.`,
              en: `<strong>You write <code>~/.ssh/authorized_keys</code> without checking the
                    prompt.</strong> You are still on <code>manzolo@pc</code>, so the file is
                    created on the pc. It is perfect, contains the right line, and changes
                    nothing: <code>deploy@server</code> is the side making the decision.` },
            { it: `<strong>Copi <code>id_ed25519</code> invece di
                    <code>id_ed25519.pub</code>.</strong> Il login magari funzionera' da quella
                    macchina, ma hai consegnato al server il segreto con cui presentarsi come
                    te altrove. In <code>authorized_keys</code> entrano solo righe pubbliche.`,
              en: `<strong>You copy <code>id_ed25519</code> instead of
                    <code>id_ed25519.pub</code>.</strong> Login may work from that machine, but
                    you handed the server the secret it can use to impersonate you elsewhere.
                    Only public key lines belong in <code>authorized_keys</code>.` },
            { it: `<strong>Usi <code>&gt;</code> e cancelli le autorizzazioni degli altri.</strong>
                    Per aggiungere una riga a mano serve <code>&gt;&gt;</code>. Prima fai una copia,
                    poi controlla il file risultante e tieni aperta la sessione corrente finche'
                    il nuovo login non e' provato.`,
              en: `<strong>You use <code>&gt;</code> and erase everybody else's
                    authorisations.</strong> Adding a line by hand requires <code>&gt;&gt;</code>.
                    Make a copy first, inspect the resulting file, and keep the current session
                    open until the new login has been tested.` },
        ] },

        { kind: "pro", html: {
            it: `<p><code>ssh-copy-id</code> non usa un canale segreto. Apre una normale
                 sessione SSH con il metodo che funziona gia' — qui la password — crea
                 <code>~/.ssh</code> e appende la pubblica a <code>authorized_keys</code>. Puoi
                 leggere lo script e il suo contratto con <code>man ssh-copy-id</code>. Sapere
                 questo permette di fare la stessa operazione a mano quando lo script non c'e'.</p>
                 <p>Il nome <code>authorized_keys</code> e' una configurazione, non una legge
                 del protocollo. <code>sshd</code> legge i percorsi indicati da
                 <code>AuthorizedKeysFile</code>, normalmente relativi alla home dell'utente
                 che sta entrando. Apri <code>man sshd_config</code> e cerca
                 <code>/AuthorizedKeysFile</code>: vedrai anche i token come <code>%h</code> e
                 <code>%u</code>. Non c'e' un registro centrale nascosto dietro il file.</p>`,
            en: `<p><code>ssh-copy-id</code> does not use a secret channel. It opens a normal
                 SSH session using a method that already works — the password here — creates
                 <code>~/.ssh</code>, and appends the public key to
                 <code>authorized_keys</code>. You can read the script and its contract with
                 <code>man ssh-copy-id</code>. Knowing this lets you perform the same operation
                 manually when the script is unavailable.</p>
                 <p>The name <code>authorized_keys</code> is configuration, not a law of the
                 protocol. <code>sshd</code> reads paths selected by
                 <code>AuthorizedKeysFile</code>, normally relative to the home directory of
                 the account being entered. Open <code>man sshd_config</code> and search for
                 <code>/AuthorizedKeysFile</code>: you will also see tokens such as
                 <code>%h</code> and <code>%u</code>. There is no hidden central registry behind
                 the file.</p>` } },

        { kind: "lab" },

        { kind: "recap", table: [
            { cmd: "ssh-copy-id -i chiave.pub utente@host", what: { it: "aggiunge una pubblica sul server", en: "add a public key on the server" }, flag: { it: "la password autorizza l'operazione iniziale", en: "the password authorises the initial operation" } },
            { cmd: "ssh -o BatchMode=yes utente@host", what: { it: "prova un login senza domande", en: "test a login without prompts" }, flag: { it: "fallisce invece di chiedere la password", en: "fails if a password would be required" } },
            { cmd: "~/.ssh/authorized_keys", what: { it: "elenca le pubbliche ammesse per quell'utente", en: "list public keys allowed for that user" }, flag: { it: "sta sul server, una riga per chiave", en: "lives on the server, one line per key" } },
            { cmd: "awk '$6 ~ /^sshd/ && /Accepted publickey/' /var/log/messages", what: { it: "dice quale impronta sshd ha accettato", en: "show which fingerprint sshd accepted" }, flag: { it: "eseguilo sul server, spesso con sudo", en: "run it on the server, often with sudo" } },
        ] },
    ],

    exercises: [
        {
            id: "e1", tipo: "stato",
            brief: {
                it: `Porta la pubblica del <strong>pc</strong>,
                     <code>~/.ssh/id_ed25519.pub</code>, fra le chiavi autorizzate di
                     <code>deploy</code> sul <strong>server</strong>. Puoi usare
                     <code>ssh-copy-id</code>; la password di deploy e' <code>lab</code>.
                     Alla fine il login deve riuscire senza poter chiedere una password.`,
                en: `Move the <strong>pc</strong>'s public key,
                     <code>~/.ssh/id_ed25519.pub</code>, into <code>deploy</code>'s authorised
                     keys on the <strong>server</strong>. You may use <code>ssh-copy-id</code>;
                     deploy's password is <code>lab</code>. At the end, login must succeed
                     without being able to ask for a password.`,
            },
            come: [
                { dove: "pc", testo: { it: "Copia soltanto la pubblica sul server:", en: "Copy only the public key to the server:" }, cmd: "ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@10.10.0.2" },
                { dove: "pc", testo: { it: "Inserisci <code>lab</code> quando viene chiesta la password. Non comparira' mentre scrivi.", en: "Enter <code>lab</code> when asked for the password. It will not be displayed while you type." } },
                { dove: "pc", testo: { it: "Prova il risultato vietando ogni domanda interattiva:", en: "Test the result while forbidding every interactive prompt:" }, cmd: "ssh -o BatchMode=yes deploy@10.10.0.2 'id -un'" },
            ],
            nota: {
                it: "La verifica confronta le impronte fra pc e server e poi apre una sessione vera con BatchMode. La riga nel file da sola non basta.",
                en: "The check compares fingerprints between pc and server, then opens a real session with BatchMode. The line in the file alone is not enough.",
            },
            checks: [
                { id: "pubblica-sul-server",
                  why: { it: "Nell'authorized_keys di deploy non c'e' la stessa impronta della pubblica del pc.", en: "Deploy's authorized_keys does not contain the same fingerprint as the pc's public key." },
                  nudge: { it: "Sul server controlla <code>ls -la ~/.ssh</code> e <code>ssh-keygen -lf ~/.ssh/authorized_keys</code>. Guarda il prompt prima di farlo.", en: "On the server, inspect <code>ls -la ~/.ssh</code> and <code>ssh-keygen -lf ~/.ssh/authorized_keys</code>. Check the prompt first." } },
                { id: "login-senza-password",
                  why: { it: "La riga puo' esserci, ma un login reale in BatchMode non riesce.", en: "The line may be present, but a real BatchMode login does not succeed." },
                  nudge: { it: "Dal pc prova <code>ssh -o BatchMode=yes deploy@10.10.0.2 'id -un'</code>; poi leggi l'ultima riga di sshd sul server.", en: "From the pc, try <code>ssh -o BatchMode=yes deploy@10.10.0.2 'id -un'</code>; then read sshd's last line on the server." } },
            ],
            hints: [
                { it: "L'autorizzazione va nella home dell'utente remoto, non nella tua.", en: "The authorisation belongs in the remote user's home, not yours." },
                { it: "<code>ssh-copy-id</code> sa creare cartella e file con i permessi adatti e aggiunge la pubblica senza sovrascrivere le altre.", en: "<code>ssh-copy-id</code> can create the directory and file with suitable permissions, and appends the public key without overwriting others." },
                { it: "Esegui <code>ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@10.10.0.2</code> e usa la password <code>lab</code>.", en: "Run <code>ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@10.10.0.2</code> and use password <code>lab</code>." },
            ],
        },
        {
            id: "e2", tipo: "risposta",
            brief: {
                it: `La chiave e' gia' autorizzata. Dal <strong>pc</strong> entra una volta
                     come <code>deploy</code>, poi sul <strong>server</strong> leggi l'ultima
                     riga <code>Accepted publickey</code>. Consegna l'impronta SHA256 che
                     <code>sshd</code> dice di aver accettato.`,
                en: `The key is already authorised. From the <strong>pc</strong>, log in once
                     as <code>deploy</code>, then on the <strong>server</strong> read the latest
                     <code>Accepted publickey</code> line. Submit the SHA256 fingerprint that
                     <code>sshd</code> says it accepted.`,
            },
            come: [
                { dove: "pc", testo: { it: "Apri una sessione non interattiva, cosi' resta una prova nel registro:", en: "Open a non-interactive session so it leaves evidence in the log:" }, cmd: "ssh -o BatchMode=yes deploy@10.10.0.2 'id -un'" },
                { dove: "server", testo: { it: "Chiedi al registro del server quale pubblica ha accettato, limitandoti alle righe scritte da sshd:", en: "Ask the server log which public key it accepted, restricting the output to lines written by sshd:" }, cmd: "sudo awk '$6 ~ /^sshd/ && /Accepted publickey/' /var/log/messages | tail -1" },
                { dove: "pc", testo: { it: "Consegna il campo che comincia con SHA256:", en: "Submit the field beginning with SHA256:" }, cmd: "lab answer SHA256:..." },
            ],
            nota: {
                it: "Non basta calcolare l'impronta della chiave sul pc. Il check pretende una riga Accepted nel registro e confronta la risposta con cio' che il server ha accettato davvero.",
                en: "Computing the key fingerprint on the pc is not enough. The check requires an Accepted line in the log and compares the answer with what the server actually accepted.",
            },
            checks: [
                { id: "accesso-publickey-avvenuto",
                  why: { it: "Nel registro del server non c'e' ancora un accesso riuscito con chiave pubblica.", en: "The server log does not yet contain a successful public-key login." },
                  nudge: { it: "Dal pc esegui <code>ssh -o BatchMode=yes deploy@10.10.0.2 'id -un'</code>. Deve stampare <code>deploy</code>.", en: "From the pc, run <code>ssh -o BatchMode=yes deploy@10.10.0.2 'id -un'</code>. It must print <code>deploy</code>." } },
                { id: "impronta-accettata",
                  why: { it: "L'impronta consegnata non compare nell'ultima riga Accepted publickey di sshd.", en: "The submitted fingerprint does not appear in sshd's latest Accepted publickey line." },
                  nudge: { it: "Sul server: <code>sudo awk '$6 ~ /^sshd/ &amp;&amp; /Accepted publickey/' /var/log/messages | tail -1</code>. Copia soltanto il campo SHA256.", en: "On the server: <code>sudo awk '$6 ~ /^sshd/ &amp;&amp; /Accepted publickey/' /var/log/messages | tail -1</code>. Copy only the SHA256 field." } },
            ],
            hints: [
                { it: "Il testimone non e' la history del pc. E' il processo che ha deciso di aprire la sessione: sshd.", en: "The witness is not the pc's history. It is the process that decided to open the session: sshd." },
                { it: "Il registro e' sul terminale di destra e deploy deve usare <code>sudo</code> per leggerlo. Filtra il campo del processo: una ricerca libera vedrebbe anche la riga scritta da sudo.", en: "The log is on the right-hand terminal, and deploy must use <code>sudo</code> to read it. Filter the process field: a free-text search would also see the line written by sudo." },
                { it: "Dopo il login, copia il valore <code>SHA256:...</code> dall'ultima riga Accepted e consegnalo dal pc.", en: "After the login, copy the <code>SHA256:...</code> value from the latest Accepted line and submit it from the pc." },
            ],
        },
    ],
};
