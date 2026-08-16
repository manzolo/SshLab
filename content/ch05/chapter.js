export default {
    id: "ch05", num: 5, requires: ["ch04"], draft: false,
    title: { it: "Chi firma cosa", en: "Who signs what" },
    oneLiner: {
        it: "Essere autorizzati non basta: senza la privata non c'e' nessuno che possa firmare.",
        en: "Being authorised is not enough: without the private key, nobody can sign.",
    },
    commands: ["mv", "ssh -i", "ssh -o BatchMode=yes", "authorized_keys", "man ssh"],
    glossary: ["firma", "chiave privata", "chiave pubblica", "identita'", "offerta"],

    blocks: [
        { kind: "hook", html: {
            it: `La pubblica e' ancora in <code>authorized_keys</code>. I permessi sono giusti.
                 Eppure il login fallisce appena la privata sparisce dal pc. Il server non
                 conserva una scorciatoia per riconoscerti: aspetta una prova che solo quella
                 privata puo' produrre.`,
            en: `The public key is still in <code>authorized_keys</code>. Permissions are
                 correct. Yet login fails as soon as the private key disappears from the pc.
                 The server keeps no shortcut for recognising you: it expects proof that only
                 that private key can produce.` } },
        { kind: "lead", html: {
            it: `<code>authorized_keys</code> dice quali pubbliche sono ammesse. Il client deve
                 ancora trovare la privata corrispondente e firmare i dati della sessione.
                 Spostare il file non rompe la coppia: cambia soltanto dove <code>ssh</code>
                 deve cercarlo.`,
            en: `<code>authorized_keys</code> says which public keys are allowed. The client
                 must still find the matching private key and sign the session data. Moving
                 the file does not break the pair: it only changes where <code>ssh</code> must
                 look for it.` } },
        { kind: "analogy", html: {
            it: `Il server ha un campione della tua firma, non una copia della tua penna. Se
                 lasci la penna in un cassetto diverso, il campione resta valido ma tu non puoi
                 firmare finche' non dici dove trovarla.`,
            en: `The server has a sample of your signature, not a copy of your pen. If you
                 leave the pen in another drawer, the sample remains valid but you cannot sign
                 until you say where to find it.` } },
        { kind: "shown", lines: [
            { cmd: "mv ~/.ssh/id_ed25519 ~/lab/chiave-spostata", out: "",
              note: { it: "Sul server non cambia nulla. E' il client ad aver perso il percorso predefinito.", en: "Nothing changes on the server. The client has lost the default path." } },
            { cmd: "ssh -o BatchMode=yes deploy@10.10.0.2 true", out: "deploy@10.10.0.2: Permission denied (publickey,password,keyboard-interactive).",
              note: { it: "BatchMode trasforma l'assenza della privata in un fallimento osservabile.", en: "BatchMode turns the missing private key into an observable failure." } },
            { cmd: "ssh -o IdentitiesOnly=yes -i ~/lab/chiave-spostata deploy@10.10.0.2 true", out: "",
              note: { it: "-i indica il file; IdentitiesOnly limita la prova all'identita' scelta.", en: "-i selects the file; IdentitiesOnly limits the attempt to the chosen identity." } },
        ] },
        { kind: "pitfalls", items: [
            { it: `<strong>Cancelli la riga sul server per far fallire il login.</strong> Hai
                    dimostrato che l'autorizzazione serve, non che serve anche la privata. In
                    questo esercizio <code>authorized_keys</code> deve restare identico.`,
              en: `<strong>You delete the server entry to make login fail.</strong> You proved
                    that authorisation matters, not that the private key is also required. In
                    this exercise <code>authorized_keys</code> must remain unchanged.` },
            { it: `<strong>Rimetti la chiave nel nome predefinito.</strong> Funziona, ma evita la
                    domanda utile: come si usa una privata che vive altrove? La risposta e'
                    <code>-i</code>, oppure <code>IdentityFile</code> nel config.`,
              en: `<strong>You put the key back under its default name.</strong> It works, but
                    avoids the useful question: how do you use a private key stored elsewhere?
                    The answer is <code>-i</code>, or <code>IdentityFile</code> in config.` },
        ] },
        { kind: "pro", html: {
            it: `<p>Il client manda prima la pubblica: in sostanza chiede a <code>sshd</code>
                 "questa ti interessa?". Se il server la trova fra le autorizzate, il client
                 firma i dati della sessione e il server verifica la firma. La privata non
                 attraversa mai il cavo, nemmeno cifrata.</p><p>Questo evita firme inutili e
                 permette a token hardware e agent di firmare senza consegnare il segreto a
                 <code>ssh</code>. In <code>man ssh</code>, cerca <code>IDENTITY FILES</code> per
                 vedere i percorsi predefiniti e <code>-i</code> per sovrascriverli.</p>`,
            en: `<p>The client sends the public key first: it effectively asks
                 <code>sshd</code>, "are you interested in this one?". If the server finds it
                 among the authorised keys, the client signs the session data and the server
                 verifies the signature. The private key never crosses the wire, even
                 encrypted.</p><p>This avoids needless signatures and lets hardware tokens and
                 agents sign without handing the secret to <code>ssh</code>. In
                 <code>man ssh</code>, find <code>IDENTITY FILES</code> for the default paths and
                 <code>-i</code> for overriding them.</p>` } },
        { kind: "lab" },
        { kind: "recap", table: [
            { cmd: "ssh -i FILE utente@host", what: { it: "usa una privata in un percorso esplicito", en: "use a private key at an explicit path" }, flag: { it: "il file resta sul client", en: "the file stays on the client" } },
            { cmd: "ssh -o BatchMode=yes ...", what: { it: "prova senza poter chiedere una password", en: "test without being able to ask for a password" }, flag: { it: "rende misurabile il rifiuto", en: "makes rejection measurable" } },
            { cmd: "authorized_keys", what: { it: "elenca le pubbliche ammesse", en: "list allowed public keys" }, flag: { it: "autorizza; non puo' firmare", en: "authorises; it cannot sign" } },
        ] },
    ],

    exercises: [
        { id: "e1", tipo: "stato",
          brief: { it: `Sposta <code>~/.ssh/id_ed25519</code> in
                    <code>~/lab/chiave-spostata</code>, senza toccare il server. Poi prova un
                    login con <code>BatchMode=yes</code>: deve essere rifiutato.`,
                   en: `Move <code>~/.ssh/id_ed25519</code> to
                    <code>~/lab/moved-key</code>, without touching the server. Then attempt a
                    login with <code>BatchMode=yes</code>: it must be rejected.` },
          come: [
              { dove: "pc", testo: { it: "Sposta soltanto la privata:", en: "Move only the private key:" }, cmd: "mv ~/.ssh/id_ed25519 ~/lab/chiave-spostata" },
              { dove: "pc", testo: { it: "Prova il login senza domande interattive:", en: "Try the login without interactive prompts:" }, cmd: "ssh -o BatchMode=yes deploy@10.10.0.2 true" },
          ],
          nota: { it: "La verifica pretende insieme un rifiuto vero e la stessa impronta ancora autorizzata sul server.", en: "The check requires both a real rejection and the same fingerprint still authorised on the server." },
          checks: [
              { id: "privata-assente", why: { it: "La privata e' ancora nel percorso predefinito.", en: "The private key is still at its default path." }, nudge: { it: "Guarda <code>ls -l ~/.ssh/id_ed25519 ~/lab/chiave-spostata</code>.", en: "Inspect <code>ls -l ~/.ssh/id_ed25519 ~/lab/moved-key</code>." } },
              { id: "autorizzazione-intatta", why: { it: "La pubblica autorizzata sul server e' stata tolta o sostituita.", en: "The authorised public key on the server was removed or replaced." }, nudge: { it: "Sul server calcola l'impronta di <code>~/.ssh/authorized_keys</code>.", en: "On the server, fingerprint <code>~/.ssh/authorized_keys</code>." } },
              { id: "login-rifiutato", why: { it: "Il login non e' stato rifiutato per autenticazione.", en: "The login was not rejected during authentication." }, nudge: { it: "Usa <code>BatchMode=yes</code>; poi leggi il registro di sshd sul server.", en: "Use <code>BatchMode=yes</code>; then read sshd's log on the server." } },
          ],
          hints: [
              { it: "Non modificare nulla sul terminale del server.", en: "Do not change anything in the server terminal." },
              { it: "Crea il nuovo percorso con <code>mv</code>, non con una copia.", en: "Create the new path with <code>mv</code>, not a copy." },
              { it: "Esegui <code>mv ~/.ssh/id_ed25519 ~/lab/chiave-spostata</code> e prova con BatchMode.", en: "Run <code>mv ~/.ssh/id_ed25519 ~/lab/moved-key</code> and test with BatchMode." },
          ] },
        { id: "e2", tipo: "stato",
          brief: { it: `La privata e' gia' in <code>~/lab/chiave-spostata</code>. Entra come
                    deploy indicando quel file con <code>-i</code>. Non rimetterlo in
                    <code>~/.ssh</code>.`,
                   en: `The private key is already at <code>~/lab/moved-key</code>. Log in as
                    deploy by selecting that file with <code>-i</code>. Do not put it back in
                    <code>~/.ssh</code>.` },
          come: [
              { dove: "pc", testo: { it: "Scegli solo la privata spostata e impedisci richieste di password:", en: "Select only the moved private key and prevent password prompts:" }, cmd: "ssh -o BatchMode=yes -o IdentitiesOnly=yes -i ~/lab/chiave-spostata deploy@10.10.0.2 'id -un'" },
          ],
          nota: { it: "Il check ripete quel login e controlla che il percorso predefinito sia ancora vuoto.", en: "The check repeats that login and verifies that the default path is still empty." },
          checks: [
              { id: "percorso-esplicito", why: { it: "La privata spostata non apre una sessione vera.", en: "The moved private key does not open a real session." }, nudge: { it: "Aggiungi <code>-vv</code> e cerca quale identity file viene offerto.", en: "Add <code>-vv</code> and find which identity file is offered." } },
              { id: "privata-non-rimessa", why: { it: "La privata e' tornata nel percorso predefinito.", en: "The private key was put back at its default path." }, nudge: { it: "Controlla <code>ls -l ~/.ssh/id_ed25519 ~/lab/chiave-spostata</code>.", en: "Inspect <code>ls -l ~/.ssh/id_ed25519 ~/lab/moved-key</code>." } },
          ],
          hints: [
              { it: "L'opzione che sceglie un file di identita' e' <code>-i</code>.", en: "The option selecting an identity file is <code>-i</code>." },
              { it: "Aggiungi <code>IdentitiesOnly=yes</code> per non offrire altre chiavi.", en: "Add <code>IdentitiesOnly=yes</code> to avoid offering other keys." },
              { it: "Usa <code>ssh -o IdentitiesOnly=yes -i ~/lab/chiave-spostata deploy@10.10.0.2</code>.", en: "Use <code>ssh -o IdentitiesOnly=yes -i ~/lab/moved-key deploy@10.10.0.2</code>." },
          ] },
    ],
};
