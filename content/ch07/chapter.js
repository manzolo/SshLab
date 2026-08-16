export default {
    id: "ch07", num: 7, requires: ["ch06"], draft: false,
    title: { it: "L'impronta e' cambiata", en: "The fingerprint changed" },
    oneLiner: { it: "L'allarme chiede un'indagine: cancellare la prova non e' una risposta.", en: "The warning demands an investigation: deleting the evidence is not an answer." },
    commands: ["ssh", "ssh-keygen -R", "known_hosts", "ssh-keygen -lf", "man ssh"],
    glossary: ["host key cambiata", "reinstallazione", "intercettazione", "annuncio", "rifiuto"],
    blocks: [
        { kind: "hook", html: { it: `<code>WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!</code>
            occupa mezzo schermo. La tentazione e' cercare il comando che lo faccia sparire.
            Ma quel muro dice una cosa precisa: oggi, allo stesso indirizzo, risponde una chiave
            diversa da quella che avevi verificato.`, en: `<code>WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!</code>
            fills half the screen. The temptation is to search for the command that makes it go
            away. But that wall says something precise: today, at the same address, a different
            key is answering from the one you verified.` } },
        { kind: "lead", html: { it: `Ci sono almeno due spiegazioni. Il server e' stato
            reinstallato, oppure non stai parlando con lui. <code>ssh</code> non puo' sapere
            quale sia vera. Cerca un annuncio su un canale indipendente e confronta l'impronta
            nuova. Senza conferma, la risposta corretta e' fermarsi.`, en: `There are at least
            two explanations. The server was reinstalled, or you are not talking to it.
            <code>ssh</code> cannot know which is true. Find an announcement over an independent
            channel and compare the new fingerprint. Without confirmation, stop.` } },
        { kind: "analogy", html: { it: `La serratura dell'ufficio e' cambiata durante la notte.
            Un avviso firmato dall'amministrazione puo' spiegarlo. Nessun avviso significa che
            non provi una chiave trovata per terra: torni indietro e verifichi.`, en: `The office
            lock changed overnight. A signed notice from the administrator may explain it. No
            notice means you do not try a key found on the ground: you step back and verify.` } },
        { kind: "shown", lines: [
            { cmd: "ssh deploy@10.10.0.2", out: "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!\nThe fingerprint for the ED25519 key sent by the remote host is\nSHA256:...", note: { it: "Leggi e annota la nuova impronta prima di modificare file.", en: "Read and record the new fingerprint before changing files." } },
            { cmd: "cat ~/lab/manutenzione.txt", out: "Manutenzione completata: reinstallazione del server.\nNuova impronta: SHA256:...", note: { it: "Un annuncio vale soltanto se esiste e se l'impronta combacia.", en: "An announcement matters only if it exists and its fingerprint matches." } },
            { cmd: "ssh-keygen -R 10.10.0.2", out: "Host 10.10.0.2 found: line 1\n/home/manzolo/.ssh/known_hosts updated.", note: { it: "Questo rimuove la vecchia prova. Fallo soltanto dopo una conferma.", en: "This removes the old evidence. Do it only after confirmation." } },
        ] },
        { kind: "pitfalls", items: [
            { it: `<strong>Copi <code>ssh-keygen -R</code> dal primo risultato di ricerca.</strong>
                Il login riparte, ma hai addestrato il client ad accettare proprio il cambio che
                avrebbe dovuto fermarlo.`, en: `<strong>You copy <code>ssh-keygen -R</code> from
                the first search result.</strong> Login works again, but you trained the client
                to accept the very change that should have stopped it.` },
            { it: `<strong>L'annuncio dice "manutenzione" e smetti di leggere.</strong> Deve
                riportare anche la nuova impronta. Senza quel confronto, un annuncio generico
                spiega qualunque chiave, compresa quella sbagliata.`, en: `<strong>The notice says
                "maintenance" and you stop reading.</strong> It must also report the new
                fingerprint. Without that comparison, a generic notice explains any key,
                including the wrong one.` },
        ] },
        { kind: "pro", html: { it: `<p>L'errore avviene prima dell'autenticazione utente. Il
            server ha gia' firmato lo scambio con una host key inattesa, quindi <code>ssh</code>
            rifiuta di mandare oltre credenziali. Per questo, nel mondo sospetto, il registro di
            <code>sshd</code> non deve contenere alcun <code>Accepted</code>.</p><p>La riga vecchia
            e' una prova utile. <code>ssh-keygen -R host</code> la rimuove correttamente anche se
            <code>known_hosts</code> usa nomi hashati, ma non decide se sia giusto farlo. Quella
            decisione resta fuori dal protocollo.</p>`, en: `<p>The error happens before user
            authentication. The server has already signed the exchange with an unexpected host
            key, so <code>ssh</code> refuses to send credentials further. Therefore, in the
            suspicious world, the <code>sshd</code> log must contain no <code>Accepted</code>.</p>
            <p>The old line is useful evidence. <code>ssh-keygen -R host</code> removes it
            correctly even when <code>known_hosts</code> uses hashed names, but it cannot decide
            whether removal is justified. That decision remains outside the protocol.</p>` } },
        { kind: "lab" },
        { kind: "recap", table: [
            { cmd: "ssh host", what: { it: "mostra l'impronta nuova nell'allarme", en: "show the new fingerprint in the warning" }, flag: { it: "non modificare ancora nulla", en: "do not change anything yet" } },
            { cmd: "canale indipendente", what: { it: "spiega il cambio e annuncia l'impronta", en: "explain the change and announce the fingerprint" }, flag: { it: "servono entrambe le cose", en: "both are required" } },
            { cmd: "ssh-keygen -R host", what: { it: "rimuove la vecchia associazione", en: "remove the old association" }, flag: { it: "solo dopo la verifica", en: "only after verification" } },
        ] },
    ],
    exercises: [
        { id: "e1", tipo: "risposta", brief: { it: `Provoca l'allarme con
            <code>ssh deploy@10.10.0.2</code>. Non cancellare nulla. Consegna l'impronta nuova
            mostrata nel muro giallo.`, en: `Trigger the warning with
            <code>ssh deploy@10.10.0.2</code>. Delete nothing. Submit the new fingerprint shown
            in the warning.` },
          come: [{ dove: "pc", testo: { it: "Leggi l'allarme fino alla riga SHA256:", en: "Read the warning through the SHA256 line:" }, cmd: "ssh deploy@10.10.0.2" }, { dove: "pc", testo: { it: "Consegna soltanto la nuova impronta:", en: "Submit only the new fingerprint:" }, cmd: "lab answer SHA256:..." }],
          nota: { it: "La vecchia impronta e' nel file; la nuova e' nel messaggio. Non sono intercambiabili.", en: "The old fingerprint is in the file; the new one is in the message. They are not interchangeable." },
          checks: [{ id: "impronta-nuova", why: { it: "La risposta non e' l'impronta che il server presenta adesso.", en: "The answer is not the fingerprint currently presented by the server." }, nudge: { it: "Nell'allarme cerca la riga subito dopo <code>sent by the remote host</code>.", en: "In the warning, find the line immediately after <code>sent by the remote host</code>." } }],
          hints: [{ it: "Non usare ancora ssh-keygen -R.", en: "Do not use ssh-keygen -R yet." }, { it: "La riga richiesta comincia con SHA256.", en: "The requested line begins with SHA256." }, { it: "Copia quel campo e usa <code>lab answer</code>.", en: "Copy that field and use <code>lab answer</code>." }] },
        { id: "e2", tipo: "stato", brief: { it: `Guarda se esiste
            <code>~/lab/manutenzione.txt</code>. Se annuncia una reinstallazione e la sua
            impronta combacia, rimuovi la voce vecchia, accetta la nuova ed entra. Se non c'e'
            alcun annuncio, non connetterti e consegna <code>lab answer no</code>.`, en: `Check
            whether <code>~/lab/manutenzione.txt</code> exists. If it announces a reinstall and
            its fingerprint matches, remove the old entry, accept the new one, and log in. If
            there is no notice, do not connect and submit <code>lab answer no</code>.` },
          come: [{ dove: "pc", testo: { it: "Cerca prima l'indizio fuori da SSH:", en: "First look for evidence outside SSH:" }, cmd: "cat ~/lab/manutenzione.txt" }, { dove: "server", testo: { it: "Nel mondo annunciato, confronta anche la console del server:", en: "In the announced world, also compare the server console:" }, cmd: "ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub" }, { dove: "pc", testo: { it: "Solo con una corrispondenza rimuovi la vecchia voce e ripeti il primo incontro. Senza annuncio, fermati e rispondi no.", en: "Only with a match remove the old entry and repeat the first encounter. Without a notice, stop and answer no." } }],
          nota: { it: "In circa meta' dei mondi non fare niente e' la soluzione completa.", en: "In about half the worlds, doing nothing is the complete solution." },
          checks: [
              { id: "decisione-coerente", why: { it: "La decisione non coincide con gli indizi di questo mondo.", en: "The decision does not match this world's evidence." }, nudge: { it: "Non partire dall'errore: parti da <code>ls -l ~/lab</code> e confronta le impronte.", en: "Do not start from the error: start with <code>ls -l ~/lab</code> and compare fingerprints." } },
              { id: "conseguenza-sicura", why: { it: "La conseguenza non e' sicura: nel mondo legittimo serve un login rigoroso; in quello sospetto nessun Accepted e risposta no.", en: "The outcome is unsafe: the legitimate world needs a strict login; the suspicious world needs no Accepted and answer no." }, nudge: { it: "Sul server controlla le righe Accepted solo se hai deciso di entrare.", en: "On the server, inspect Accepted lines only if you decided to log in." } },
          ],
          hints: [{ it: "L'esistenza dell'annuncio cambia la risposta corretta.", en: "The existence of the notice changes the correct answer." }, { it: "Nel mondo legittimo devono combaciare annuncio, console e nuovo muro.", en: "In the legitimate world, notice, console, and new warning must match." }, { it: "Senza annuncio non modificare known_hosts e usa <code>lab answer no</code>.", en: "Without a notice, do not modify known_hosts and use <code>lab answer no</code>." }] },
    ],
};
