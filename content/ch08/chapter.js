export default {
    id: "ch08", num: 8, requires: ["ch07"], draft: false,
    title: { it: "Permessi: cosa pretende sshd", en: "Permissions: what sshd demands" },
    oneLiner: { it: "Una chiave scrivibile o leggibile da altri non e' piu' sotto il tuo controllo.", en: "A key writable or readable by others is no longer under your control." },
    commands: ["chmod", "stat", "ls -ld", "ssh -v", "man sshd_config"],
    glossary: ["modo", "proprietario", "StrictModes", "600", "700"],
    blocks: [
        { kind: "hook", html: { it: `La chiave e' quella giusta, ma il login viene rifiutato.
            Sul pc <code>ssh</code> puo' ignorare una privata leggibile da altri. Sul server
            <code>sshd</code> puo' ignorare un <code>authorized_keys</code> che altri potrebbero
            riscrivere. Sono due controlli distinti e il messaggio utile spesso e' sull'altro
            terminale.`, en: `The key is correct, but login is rejected. On the pc,
            <code>ssh</code> may ignore a private key readable by others. On the server,
            <code>sshd</code> may ignore an <code>authorized_keys</code> others could rewrite.
            These are separate checks, and the useful message is often in the other terminal.` } },
        { kind: "lead", html: { it: `La privata deve essere leggibile solo dal proprietario:
            <code>600</code>. Sul server, <code>~/.ssh</code> deve essere <code>700</code> e
            <code>authorized_keys</code> <code>600</code>. Anche la home non deve essere scrivibile
            da gruppo o altri. Prima trovi il lato che rifiuta, poi sistemi il percorso preciso.`, en: `The private key must be readable only by its owner: <code>600</code>. On the server,
            <code>~/.ssh</code> must be <code>700</code> and <code>authorized_keys</code>
            <code>600</code>. The home directory must not be group- or world-writable either.
            First find which side rejects the key, then fix the exact path.` } },
        { kind: "analogy", html: { it: `Una lista degli invitati corretta non vale se chiunque
            nel corridoio puo' sostituirla. Una chiave privata forte non vale se chiunque sul pc
            puo' leggerla. I permessi dicono chi controlla davvero quei due oggetti.`, en: `A
            correct guest list is worthless if anyone in the corridor can replace it. A strong
            private key is worthless if anyone on the pc can read it. Permissions say who
            actually controls those two objects.` } },
        { kind: "shown", lines: [
            { cmd: "stat -c '%a %n' ~/.ssh/id_ed25519", out: "644 /home/manzolo/.ssh/id_ed25519", note: { it: "644 va bene per una pubblica, non per una privata.", en: "644 is fine for a public key, not a private one." } },
            { cmd: "sudo awk '$6 ~ /^sshd/ && /bad ownership or modes/' /var/log/messages | tail -1", out: "sshd[...] Authentication refused: bad ownership or modes for file /home/deploy/.ssh/authorized_keys", note: { it: "Il server nomina il percorso che ha rifiutato.", en: "The server names the path it rejected." } },
            { cmd: "chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys", out: "", note: { it: "Eseguilo come deploy sul server quando il guasto e' li'.", en: "Run this as deploy on the server when the fault is there." } },
        ] },
        { kind: "pitfalls", items: [
            { it: `<strong>Metti <code>chmod 777</code> per escludere un problema di permessi.</strong>
                Hai escluso la protezione, non il problema. Per SSH, piu' accesso puo' significare
                meno fiducia e quindi un rifiuto.`, en: `<strong>You set <code>chmod 777</code> to
                rule out a permission problem.</strong> You removed protection, not the problem.
                For SSH, more access may mean less trust and therefore rejection.` },
            { it: `<strong>Aggiungi <code>StrictModes no</code> al server.</strong> Il login puo'
                ripartire, ma ora <code>sshd</code> accetta autorizzazioni riscrivibili da altri.
                Hai nascosto la causa ampliando chi puo' entrare.`, en: `<strong>You add
                <code>StrictModes no</code> to the server.</strong> Login may work again, but
                <code>sshd</code> now accepts authorisations others can rewrite. You hid the
                cause by widening who can log in.` },
        ] },
        { kind: "pro", html: { it: `<p><code>StrictModes</code> controlla proprietario e modi
            dei file dell'utente prima di accettare un login. Il controllo arriva alla home:
            se un altro utente puo' rinominare <code>.ssh</code>, puo' sostituirla con una
            cartella che contiene la propria pubblica.</p><p>Il controllo della privata e'
            invece nel client. Per questo devi leggere entrambi: <code>ssh -v</code> sul pc e il
            registro di <code>sshd</code> sul server. Cerca <code>StrictModes</code> in
            <code>man sshd_config</code>.</p>`, en: `<p><code>StrictModes</code> checks ownership
            and modes of user files before accepting login. The check reaches the home
            directory: if another user can rename <code>.ssh</code>, they can replace it with a
            directory containing their own public key.</p><p>The private-key check instead lives
            in the client. That is why you must read both sides: <code>ssh -v</code> on the pc
            and the <code>sshd</code> log on the server. Find <code>StrictModes</code> in
            <code>man sshd_config</code>.</p>` } },
        { kind: "lab" },
        { kind: "recap", table: [
            { cmd: "chmod 600 privata", what: { it: "limita la privata al proprietario", en: "limit the private key to its owner" }, flag: { it: "controllo del client", en: "client-side check" } },
            { cmd: "chmod 700 ~/.ssh", what: { it: "protegge la cartella delle autorizzazioni", en: "protect the authorisation directory" }, flag: { it: "sul server per l'utente remoto", en: "on the server for the remote user" } },
            { cmd: "chmod 600 authorized_keys", what: { it: "impedisce ad altri di autorizzarsi", en: "prevent others from authorising themselves" }, flag: { it: "non spegnere StrictModes", en: "do not disable StrictModes" } },
        ] },
    ],
    exercises: [
        { id: "e1", tipo: "stato", brief: { it: `Una sola cosa ha permessi sbagliati: la
            privata sul pc, la home di deploy, <code>.ssh</code> o
            <code>authorized_keys</code> sul server. Trovala dai messaggi e ripristina modi
            sicuri. Non modificare <code>sshd_config</code>.`, en: `Exactly one item has wrong
            permissions: the private key on the pc, deploy's home, <code>.ssh</code>, or
            <code>authorized_keys</code> on the server. Find it from the messages and restore
            safe modes. Do not change <code>sshd_config</code>.` },
          come: [{ dove: "pc", testo: { it: "Prova il login con <code>ssh -v</code> e leggi chi rifiuta.", en: "Try login with <code>ssh -v</code> and identify who rejects it." } }, { dove: "server", testo: { it: "Se il client ha offerto la chiave, leggi le ultime righe di sshd.", en: "If the client offered the key, read sshd's latest lines." } }, { dove: "pc", testo: { it: "Controlla i quattro percorsi con <code>stat -c '%a %n'</code>, sul terminale giusto.", en: "Inspect all four paths with <code>stat -c '%a %n'</code>, in the correct terminal." } }],
          nota: { it: "Il check pretende login vero, modi finali e configurazione di sshd intatta.", en: "The check requires a real login, final modes, and unchanged sshd configuration." },
          checks: [{ id: "login-ripristinato", why: { it: "La chiave non apre ancora una sessione.", en: "The key still does not open a session." }, nudge: { it: "Confronta <code>ssh -v</code> con il registro del server.", en: "Compare <code>ssh -v</code> with the server log." } }, { id: "modi-sicuri", why: { it: "Uno dei percorsi non ha ancora il modo atteso.", en: "One path still lacks the expected mode." }, nudge: { it: "Attesi: privata 600, .ssh 700, authorized_keys 600, home 755.", en: "Expected: private key 600, .ssh 700, authorized_keys 600, home 755." } }, { id: "strictmodes-intatto", why: { it: "La configurazione di sshd e' stata modificata.", en: "sshd configuration was changed." }, nudge: { it: "Ripristina il config: la soluzione e' nei modi dei file.", en: "Restore the config: the solution is in file modes." } }],
          hints: [{ it: "Se il client rifiuta la privata, il server non puo' spiegarlo.", en: "If the client rejects the private key, the server cannot explain it." }, { it: "Sul server cerca <code>bad ownership or modes</code>.", en: "On the server, search for <code>bad ownership or modes</code>." }, { it: "Applica 600 alla privata e ad authorized_keys, 700 a .ssh e 755 alla home.", en: "Apply 600 to the private key and authorized_keys, 700 to .ssh, and 755 to the home." }] },
        { id: "e2", tipo: "risposta", brief: { it: `Il guasto questa volta e' sul server.
            Provoca un login fallito e leggi il registro di sshd. Consegna uno fra
            <code>home</code>, <code>.ssh</code> e <code>authorized_keys</code>: il percorso che
            il server considera insicuro.`, en: `This time the fault is on the server. Trigger a
            failed login and read the sshd log. Submit one of <code>home</code>,
            <code>.ssh</code>, and <code>authorized_keys</code>: the path the server considers
            unsafe.` },
          come: [{ dove: "server", testo: { it: "Filtra le righe di sshd che contengono <code>bad ownership or modes</code>.", en: "Filter sshd lines containing <code>bad ownership or modes</code>." } }, { dove: "pc", testo: { it: "Consegna il nome breve del percorso indicato:", en: "Submit the short name of the indicated path:" }, cmd: "lab answer authorized_keys" }],
          nota: { it: "Il colpevole cambia col seme; guardare soltanto i modi e' possibile, ma il registro dice perche' sshd li rifiuta.", en: "The culprit changes with the seed; inspecting modes works, but the log says why sshd rejects them." },
          checks: [{ id: "colpevole", why: { it: "La risposta non identifica il percorso rotto in questo mondo.", en: "The answer does not identify the broken path in this world." }, nudge: { it: "Leggi l'ultima riga <code>Authentication refused</code> scritta da sshd.", en: "Read the latest <code>Authentication refused</code> line written by sshd." } }],
          hints: [{ it: "Il messaggio e' nel terminale del server.", en: "The message is in the server terminal." }, { it: "Non usare un grep libero: limita il campo del processo a sshd.", en: "Do not use a free grep: restrict the process field to sshd." }, { it: "Consegna esattamente home, .ssh oppure authorized_keys.", en: "Submit exactly home, .ssh, or authorized_keys." }] },
    ],
};
