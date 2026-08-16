export default {
    id: "ch11", num: 11, requires: ["ch10"], draft: false,
    title: { it: "Troppe chiavi", en: "Too many keys" },
    oneLiner: { it: "Avere la chiave giusta non basta se il server ti caccia prima che arrivi il suo turno.", en: "Having the right key is not enough if the server rejects you before its turn arrives." },
    commands: ["ssh-add -l", "IdentitiesOnly", "IdentityFile", "~/.ssh/config", "MaxAuthTries"],
    glossary: ["offerta", "Too many authentication failures", "IdentitiesOnly", "Host", "MaxAuthTries"],
    blocks: [
        { kind: "hook", html: { it: `La chiave giusta e' nell'agent, ma il server risponde
            <code>Too many authentication failures</code>. Non significa che tutte le tue chiavi
            siano sbagliate. Il client ne ha offerte troppe e il server ha chiuso la connessione
            prima di vedere quella buona.`, en: `The right key is in the agent, but the server
            replies <code>Too many authentication failures</code>. It does not mean all your keys
            are wrong. The client offered too many and the server closed the connection before
            seeing the right one.` } },
        { kind: "lead", html: { it: `L'agent puo' contenere identita' per molti ambienti.
            <code>ssh</code> le offre in sequenza; ogni rifiuto consuma un tentativo.
            <code>IdentitiesOnly yes</code> dice al client di usare soltanto le identita'
            configurate esplicitamente. La cura e' restringere le offerte, non allargare il
            limite del server.`, en: `The agent may contain identities for many environments.
            <code>ssh</code> offers them in sequence; each rejection consumes an attempt.
            <code>IdentitiesOnly yes</code> tells the client to use only explicitly configured
            identities. The fix is to narrow the offers, not widen the server's limit.` } },
        { kind: "analogy", html: { it: `Hai sei badge e li provi uno dopo l'altro. Dopo il terzo
            errore la guardia ti accompagna fuori, anche se il sesto era valido. Dire subito
            quale badge usare evita sia il rumore sia il blocco.`, en: `You have six badges and
            try them one by one. After the third failure the guard escorts you out, even though
            the sixth was valid. Selecting the badge immediately avoids both noise and lockout.` } },
        { kind: "shown", lines: [
            { cmd: ". ~/lab/agent.env; ssh-add -l", out: "256 SHA256:... chiave-1\n...\n256 SHA256:... chiave-6", note: { it: "L'ordine dell'agent e' l'ordine delle possibili offerte.", en: "Agent order is the order of possible offers." } },
            { cmd: "ssh -o IdentitiesOnly=yes -i ~/lab/identita/chiave-6 deploy@10.10.0.2 true", out: "", note: { it: "Il client propone soltanto l'identita' scelta.", en: "The client offers only the selected identity." } },
            { cmd: "ssh -G lab | grep -E '^(hostname|user|identityfile|identitiesonly) '", out: "hostname 10.10.0.2\nuser deploy\nidentityfile ~/lab/identita/chiave-6\nidentitiesonly yes", note: { it: "-G mostra la configurazione finale che ssh usera'.", en: "-G shows the final configuration ssh will use." } },
        ] },
        { kind: "pitfalls", items: [
            { it: `<strong>Alzi <code>MaxAuthTries</code>.</strong> Sul server altrui non puoi
                farlo. Sul tuo allarghi una protezione per compensare un client che non sa quale
                identita' vuole usare.`, en: `<strong>You raise <code>MaxAuthTries</code>.</strong>
                You cannot do that on somebody else's server. On your own, you weaken a
                protection to compensate for a client that does not know which identity to use.` },
            { it: `<strong>Aggiungi solo <code>-i</code>.</strong> La chiave indicata entra fra le
                candidate, ma quelle dell'agent possono ancora essere offerte. Abbinala a
                <code>IdentitiesOnly=yes</code>.`, en: `<strong>You add only <code>-i</code>.</strong>
                The selected key joins the candidates, but agent keys may still be offered.
                Pair it with <code>IdentitiesOnly=yes</code>.` },
        ] },
        { kind: "pro", html: { it: `<p>Il server non vede la configurazione del client. Vede
            richieste di autenticazione publickey e conta i fallimenti della stessa connessione.
            Per questo il check legge il registro e misura quante offerte precedono l'ultimo
            <code>Accepted</code>: accetta un comando esplicito, un blocco Host o un agent
            ripulito se producono lo stesso comportamento.</p><p><code>IdentitiesOnly</code> non
            significa "ignora l'agent" in assoluto: limita l'uso alle identita' dichiarate, che
            l'agent puo' comunque eseguire. Leggi le sezioni <code>IdentityFile</code> e
            <code>IdentitiesOnly</code> in <code>man ssh_config</code>.</p>`, en: `<p>The server
            cannot see client configuration. It sees public-key authentication requests and
            counts failures within one connection. The check therefore reads the log and counts
            offers before the latest <code>Accepted</code>: an explicit command, a Host block, or
            a cleared agent are all valid if they produce the same behaviour.</p><p>
            <code>IdentitiesOnly</code> does not mean "ignore the agent" absolutely: it limits
            use to declared identities, which the agent may still perform. Read
            <code>IdentityFile</code> and <code>IdentitiesOnly</code> in
            <code>man ssh_config</code>.</p>` } },
        { kind: "lab" },
        { kind: "recap", table: [
            { cmd: "ssh -o IdentitiesOnly=yes -i FILE host", what: { it: "limita una connessione alla chiave scelta", en: "limit one connection to the chosen key" }, flag: { it: "-i da solo non basta sempre", en: "-i alone is not always enough" } },
            { cmd: "Host lab", what: { it: "rende persistente una destinazione", en: "make a destination persistent" }, flag: { it: "abbina HostName, User, IdentityFile", en: "pair HostName, User, IdentityFile" } },
            { cmd: "ssh -G host", what: { it: "mostra il config risolto", en: "show resolved configuration" }, flag: { it: "non apre una connessione", en: "does not open a connection" } },
        ] },
    ],
    exercises: [
        { id: "e1", tipo: "stato", brief: { it: `L'agent contiene sei chiavi; soltanto una
            delle pubbliche in <code>~/lab/identita</code> e' autorizzata sul server, ed e'
            l'ultima nell'agent. Entra facendo arrivare la chiave giusta entro due offerte
            fallite. Non cambiare il server.`, en: `The agent contains six keys; only one public
            key in <code>~/lab/identita</code> is authorised on the server, and it is last in the
            agent. Log in while making the right key arrive within two failed offers. Do not
            change the server.` },
          come: [{ dove: "pc", testo: { it: "Importa il socket e osserva le sei impronte:", en: "Source the socket and inspect the six fingerprints:" }, cmd: ". ~/lab/agent.env; ssh-add -l" }, { dove: "server", testo: { it: "Confronta l'impronta in authorized_keys.", en: "Compare the fingerprint in authorized_keys." } }, { dove: "pc", testo: { it: "Scegli il file corrispondente e limita le offerte con IdentitiesOnly.", en: "Select the matching file and limit offers with IdentitiesOnly." } }],
          nota: { it: "Il check conta i Failed publickey prima dell'ultimo Accepted e accetta qualunque strategia che resti entro due.", en: "The check counts Failed publickey lines before the latest Accepted and accepts any strategy staying within two." },
          checks: [{ id: "login-mirato", why: { it: "sshd non ha ancora accettato una chiave.", en: "sshd has not accepted a key yet." }, nudge: { it: "Trova l'impronta autorizzata sul server e il file uguale sul pc.", en: "Find the authorised fingerprint on the server and its matching file on the pc." } }, { id: "poche-offerte", why: { it: "Il server ha visto troppe chiavi sbagliate prima di quella giusta.", en: "The server saw too many wrong keys before the right one." }, nudge: { it: "Usa insieme <code>IdentitiesOnly=yes</code> e <code>-i</code>, oppure ripulisci l'agent.", en: "Use <code>IdentitiesOnly=yes</code> with <code>-i</code>, or clear the agent." } }, { id: "limite-intatto", why: { it: "MaxAuthTries o un'altra parte del config server e' cambiata.", en: "MaxAuthTries or another server setting changed." }, nudge: { it: "Ripristina sshd_config: devi ridurre le offerte dal client.", en: "Restore sshd_config: reduce offers from the client." } }],
          hints: [{ it: "Confronta impronte, non nomi chiave-1...chiave-6.", en: "Compare fingerprints, not names key-1...key-6." }, { it: "-i aggiunge una candidata; IdentitiesOnly limita l'insieme.", en: "-i adds a candidate; IdentitiesOnly limits the set." }, { it: "Usa <code>ssh -o IdentitiesOnly=yes -i ~/lab/identita/chiave-N deploy@10.10.0.2</code> con il file trovato.", en: "Use <code>ssh -o IdentitiesOnly=yes -i ~/lab/identita/key-N deploy@10.10.0.2</code> with the matching file." }] },
        { id: "e2", tipo: "stato", brief: { it: `Rendi la scelta persistente. Crea un blocco
            <code>Host lab</code> in <code>~/.ssh/config</code> con HostName, User, IdentityFile e
            <code>IdentitiesOnly yes</code>. Alla fine il solo comando <code>ssh lab</code> deve
            entrare con poche offerte.`, en: `Make the choice persistent. Create a
            <code>Host lab</code> block in <code>~/.ssh/config</code> with HostName, User,
            IdentityFile, and <code>IdentitiesOnly yes</code>. Then <code>ssh lab</code> alone
            must log in with few offers.` },
          come: [{ dove: "pc", testo: { it: "Importa prima l'agent e identifica la chiave autorizzata come nell'esercizio precedente.", en: "First source the agent and identify the authorised key as in the previous exercise." } }, { dove: "pc", testo: { it: "Scrivi il blocco in ~/.ssh/config e proteggi il file con modo 600.", en: "Write the block in ~/.ssh/config and protect the file with mode 600." } }, { dove: "pc", testo: { it: "Controlla il risultato risolto e poi entra:", en: "Inspect the resolved result and then log in:" }, cmd: "ssh -G lab | grep -E '^(hostname|user|identityfile|identitiesonly) '; ssh lab" }],
          nota: { it: "Il nome corto funziona solo se il blocco contiene tutta la destinazione, non soltanto la chiave.", en: "The short name works only if the block contains the whole destination, not just the key." },
          checks: [{ id: "alias-funziona", why: { it: "<code>ssh lab</code> non entra come deploy.", en: "<code>ssh lab</code> does not log in as deploy." }, nudge: { it: "Usa <code>ssh -G lab</code> e controlla HostName, User e IdentityFile.", en: "Use <code>ssh -G lab</code> and inspect HostName, User, and IdentityFile." } }, { id: "alias-mirato", why: { it: "Il blocco lascia offrire troppe identita'.", en: "The block allows too many identities to be offered." }, nudge: { it: "Nel blocco manca o non vale <code>IdentitiesOnly yes</code>.", en: "The block is missing <code>IdentitiesOnly yes</code> or it is ineffective." } }, { id: "limite-intatto", why: { it: "La configurazione del server e' stata allargata.", en: "The server configuration was widened." }, nudge: { it: "La soluzione vive interamente in ~/.ssh/config sul pc.", en: "The solution lives entirely in ~/.ssh/config on the pc." } }],
          hints: [{ it: "Host lab definisce un soprannome locale.", en: "Host lab defines a local nickname." }, { it: "HostName e' 10.10.0.2, User e' deploy.", en: "HostName is 10.10.0.2, User is deploy." }, { it: "Aggiungi IdentityFile col file trovato e IdentitiesOnly yes, poi chmod 600 al config.", en: "Add IdentityFile with the matching file and IdentitiesOnly yes, then chmod 600 the config." }] },
    ],
};
