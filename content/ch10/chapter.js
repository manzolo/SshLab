export default {
    id: "ch10", num: 10, requires: ["ch09"], draft: false,
    title: { it: "ssh-agent", en: "ssh-agent" },
    oneLiner: { it: "Sblocca la privata una volta; un processo firma per te senza consegnarla.", en: "Unlock the private key once; a process signs for you without handing it over." },
    commands: ["ssh-agent", "ssh-add", "ssh-add -l", "ssh-add -L", "IdentityAgent"],
    glossary: ["agent", "socket", "SSH_AUTH_SOCK", "identita' caricata", "firma"],
    blocks: [
        { kind: "hook", html: { it: `Hai protetto la privata e ora ogni collegamento chiede la
            passphrase. Nei comandi non interattivi non c'e' neppure qualcuno a cui chiederla.
            <code>ssh-agent</code> tiene in memoria una chiave gia' sbloccata e firma quando il
            client glielo domanda.`, en: `You protected the private key and now every connection
            asks for its passphrase. In non-interactive commands there is nobody to ask.
            <code>ssh-agent</code> keeps an unlocked key in memory and signs when the client asks.` } },
        { kind: "lead", html: { it: `Avvii il processo, esporti il percorso del suo socket e
            carichi la chiave con <code>ssh-add</code>. Digiti la passphrase una volta. Da quel
            momento il client parla con l'agent attraverso <code>SSH_AUTH_SOCK</code>; la privata
            non viene copiata nei client che la usano.`, en: `Start the process, export its socket
            path, and load the key with <code>ssh-add</code>. Enter the passphrase once. From then
            on, clients talk to the agent through <code>SSH_AUTH_SOCK</code>; the private key is
            not copied into the clients that use it.` } },
        { kind: "analogy", html: { it: `Non e' un quaderno di password. E' una persona chiusa
            in una stanza che sa usare il timbro. Le passi il foglio dal piccolo sportello; ti
            restituisce la firma, mai il timbro.`, en: `It is not a password notebook. It is a
            person locked in a room who can use the stamp. You pass a document through a small
            hatch; they return the signature, never the stamp.` } },
        { kind: "shown", lines: [
            { cmd: "eval $(ssh-agent -s)", out: "Agent pid 123", note: { it: "eval importa SSH_AUTH_SOCK nella shell corrente.", en: "eval imports SSH_AUTH_SOCK into the current shell." } },
            { cmd: "ssh-add ~/.ssh/id_ed25519", out: "Enter passphrase for ...:\nIdentity added: ...", note: { it: "Qui la privata viene decifrata e caricata in memoria.", en: "Here the private key is decrypted and loaded into memory." } },
            { cmd: "ssh-add -l", out: "256 SHA256:... ... (ED25519)", note: { it: "-l elenca impronte; -L stampa righe pubbliche complete.", en: "-l lists fingerprints; -L prints complete public-key lines." } },
        ] },
        { kind: "pitfalls", items: [
            { it: `<strong>Avvii l'agent in un terminale e usi ssh in un altro.</strong> Il processo
                esiste, ma la nuova shell non conosce il suo socket. Controlla
                <code>echo $SSH_AUTH_SOCK</code>.`, en: `<strong>You start the agent in one terminal
                and use ssh in another.</strong> The process exists, but the new shell does not
                know its socket. Check <code>echo $SSH_AUTH_SOCK</code>.` },
            { it: `<strong>Scambi <code>-l</code> e <code>-L</code>.</strong> La elle minuscola
                mostra impronte utili a riconoscere; la maiuscola produce le righe pubbliche da
                mettere in <code>authorized_keys</code>.`, en: `<strong>You confuse <code>-l</code>
                and <code>-L</code>.</strong> Lowercase l shows fingerprints for identification;
                uppercase L emits public-key lines suitable for <code>authorized_keys</code>.` },
        ] },
        { kind: "pro", html: { it: `<p>Il protocollo dell'agent espone operazioni come
            "elenca identita'" e "firma questi byte" su un socket Unix. Non espone un comando
            per estrarre la privata. Chi puo' usare il socket puo' pero' chiedere firme finche'
            l'identita' resta caricata: a fine lavoro usa <code>ssh-add -D</code>.</p><p>
            <code>ssh</code> puo' trovare un socket anche tramite <code>IdentityAgent</code> nel
            config. <code>ssh-add</code> no: legge soltanto <code>SSH_AUTH_SOCK</code>. Percio'
            <code>ssh</code> puo' funzionare mentre <code>ssh-add -l</code> risponde "Could not open
            a connection". Non e' una contraddizione; sono due meccanismi di scoperta diversi.</p>`, en: `<p>The agent protocol exposes operations such as "list identities" and "sign these
            bytes" over a Unix socket. It exposes no operation for extracting the private key.
            Anyone able to use the socket can nevertheless request signatures while the identity
            remains loaded: use <code>ssh-add -D</code> when finished.</p><p><code>ssh</code> can find
            a socket through <code>IdentityAgent</code> in config. <code>ssh-add</code> cannot: it
            reads only <code>SSH_AUTH_SOCK</code>. Therefore <code>ssh</code> may work while
            <code>ssh-add -l</code> says "Could not open a connection". These are different
            discovery mechanisms.</p>` } },
        { kind: "lab" },
        { kind: "recap", table: [
            { cmd: "eval $(ssh-agent -s)", what: { it: "avvia l'agent e collega la shell", en: "start the agent and connect the shell" }, flag: { it: "la variabile vale per quella shell", en: "the variable applies to that shell" } },
            { cmd: "ssh-add privata", what: { it: "carica una chiave sbloccata", en: "load an unlocked key" }, flag: { it: "chiede la passphrase una volta", en: "asks for the passphrase once" } },
            { cmd: "ssh-add -d pubblica / -D", what: { it: "rimuove una identita' / tutte", en: "remove one identity / all" }, flag: { it: "non cancella file dal disco", en: "does not delete files from disk" } },
        ] },
    ],
    exercises: [
        { id: "e1", tipo: "stato", brief: { it: `Avvia un agent nella shell del pc e carica
            <code>~/.ssh/id_ed25519</code>. La passphrase e' <code>lab</code>. Lascia l'agent vivo:
            la verifica deve trovarne il socket, l'impronta e usarlo per un login senza domande.`, en: `Start an agent in the pc shell and load
            <code>~/.ssh/id_ed25519</code>. The passphrase is <code>lab</code>. Leave the agent
            running: the check must find its socket and fingerprint and use it for a prompt-free
            login.` },
          come: [{ dove: "pc", testo: { it: "Avvia l'agent nella shell corrente:", en: "Start the agent in the current shell:" }, cmd: "eval $(ssh-agent -s)" }, { dove: "pc", testo: { it: "Carica la privata e inserisci <code>lab</code>:", en: "Load the private key and enter <code>lab</code>:" }, cmd: "ssh-add ~/.ssh/id_ed25519" }, { dove: "pc", testo: { it: "Controlla l'impronta caricata e prova il login:", en: "Inspect the loaded fingerprint and test login:" }, cmd: "ssh-add -l && ssh -o BatchMode=yes deploy@10.10.0.2 true" }],
          nota: { it: "Il check gira in un altro processo: trova il socket sul disco invece di fingere di ereditarlo.", en: "The check runs in another process: it finds the socket on disk instead of pretending to inherit it." },
          checks: [{ id: "agent-vivo", why: { it: "Non c'e' un socket agent vivo appartenente a manzolo.", en: "There is no live agent socket owned by manzolo." }, nudge: { it: "Controlla <code>echo $SSH_AUTH_SOCK</code> e <code>test -S $SSH_AUTH_SOCK</code>.", en: "Check <code>echo $SSH_AUTH_SOCK</code> and <code>test -S $SSH_AUTH_SOCK</code>." } }, { id: "chiave-caricata", why: { it: "L'agent non contiene l'impronta attesa.", en: "The agent does not contain the expected fingerprint." }, nudge: { it: "Esegui <code>ssh-add -l</code> nella stessa shell.", en: "Run <code>ssh-add -l</code> in the same shell." } }, { id: "firma-in-memoria", why: { it: "La chiave caricata non completa un login BatchMode.", en: "The loaded key does not complete a BatchMode login." }, nudge: { it: "Prova <code>ssh -o BatchMode=yes</code>; non deve chiedere la passphrase.", en: "Try <code>ssh -o BatchMode=yes</code>; it must not ask for the passphrase." } }],
          hints: [{ it: "Non basta eseguire ssh-agent: devi importare le variabili che stampa.", en: "Running ssh-agent is not enough: import the variables it prints." }, { it: "ssh-add deve vedere lo stesso SSH_AUTH_SOCK.", en: "ssh-add must see the same SSH_AUTH_SOCK." }, { it: "Esegui <code>eval $(ssh-agent -s)</code>, poi <code>ssh-add ~/.ssh/id_ed25519</code>.", en: "Run <code>eval $(ssh-agent -s)</code>, then <code>ssh-add ~/.ssh/id_ed25519</code>." }] },
        { id: "e2", tipo: "risposta", brief: { it: `Un agent e' gia' attivo. Importa
            <code>~/lab/agent.env</code>, usa <code>ssh-add -l</code> e consegna l'impronta. Poi
            rimuovi proprio quella identita' con <code>ssh-add -d</code>, senza cancellare file.`, en: `An agent is already running. Source <code>~/lab/agent.env</code>, use
            <code>ssh-add -l</code>, and submit the fingerprint. Then remove that identity with
            <code>ssh-add -d</code>, without deleting files.` },
          come: [{ dove: "pc", testo: { it: "Collega questa shell al socket seminato:", en: "Connect this shell to the seeded socket:" }, cmd: ". ~/lab/agent.env" }, { dove: "pc", testo: { it: "Leggi l'impronta e confronta la riga pubblica:", en: "Read the fingerprint and compare the public line:" }, cmd: "ssh-add -l; ssh-add -L" }, { dove: "pc", testo: { it: "Consegna l'impronta, poi rimuovi l'identita':", en: "Submit the fingerprint, then remove the identity:" }, cmd: "lab answer SHA256:...; ssh-add -d ~/.ssh/id_ed25519.pub" }],
          nota: { it: "-d cambia la memoria dell'agent. Il file privato resta cifrato sul disco.", en: "-d changes agent memory. The private file remains encrypted on disk." },
          checks: [{ id: "impronta-letta", why: { it: "La risposta non e' l'impronta caricata.", en: "The answer is not the loaded fingerprint." }, nudge: { it: "In <code>ssh-add -l</code> copia il campo SHA256.", en: "Copy the SHA256 field from <code>ssh-add -l</code>." } }, { id: "chiave-rimossa", why: { it: "L'identita' e' ancora caricata nell'agent.", en: "The identity is still loaded in the agent." }, nudge: { it: "Usa <code>ssh-add -d ~/.ssh/id_ed25519.pub</code>; poi <code>ssh-add -l</code> deve dire che non ci sono identita'.", en: "Use <code>ssh-add -d ~/.ssh/id_ed25519.pub</code>; then <code>ssh-add -l</code> must report no identities." } }],
          hints: [{ it: "Prima importa agent.env nella shell corrente.", en: "First source agent.env into the current shell." }, { it: "-l mostra impronte; -L mostra chiavi pubbliche complete.", en: "-l shows fingerprints; -L shows complete public keys." }, { it: "Consegna il secondo campo di -l e rimuovi con -d seguito dal file .pub.", en: "Submit the second field from -l and remove with -d followed by the .pub file." }] },
    ],
};
