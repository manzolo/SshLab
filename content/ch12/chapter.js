export default {
    id: "ch12", num: 12, requires: ["ch11"], draft: false,
    title: { it: "Ruotare senza chiudersi fuori", en: "Rotate without locking yourself out" },
    oneLiner: { it: "Aggiungi, prova la nuova da sola, e soltanto dopo ritira la vecchia.", en: "Add, test the new key alone, and only then retire the old one." },
    commands: ["ssh-keygen", "authorized_keys", "IdentitiesOnly", "ssh -i", "commento #"],
    glossary: ["rotazione additiva", "ritiro", "prova isolata", "rollback", "chiave fantasma"],
    blocks: [
        { kind: "hook", html: { it: `Devi sostituire una chiave che apre un server remoto. Se
            cancelli prima la vecchia e la nuova ha un errore, hai appena perso il canale con cui
            riparare. La rotazione sicura non e' una sostituzione istantanea. E' una sequenza con
            un periodo deliberato in cui funzionano entrambe.`, en: `You must replace a key that
            opens a remote server. If you delete the old one first and the new one is wrong, you
            just lost the channel needed to repair it. Safe rotation is not an instant
            replacement. It is a sequence with a deliberate period when both work.` } },
        { kind: "lead", html: { it: `L'ordine e' la protezione: fai una copia di sicurezza,
            genera la nuova, aggiungila accanto alla vecchia, provala isolando ogni altra
            identita', poi commenta la vecchia. Tieni aperta la sessione corrente finche' la
            prova non e' finita.`, en: `Order is the protection: make a backup, generate the new
            key, add it beside the old one, test it while isolating every other identity, then
            comment out the old one. Keep the current session open until testing is complete.` } },
        { kind: "analogy", html: { it: `Non getti il vecchio mazzo prima di aver provato la nuova
            chiave nella serratura, dalla parte esterna. Per qualche minuto porti entrambe. Solo
            quando la nuova apre davvero, segni la vecchia come ritirata.`, en: `You do not throw
            away the old keyring before trying the new key in the lock from outside. For a few
            minutes you carry both. Only after the new one actually opens do you mark the old
            one as retired.` } },
        { kind: "shown", lines: [
            { cmd: "ssh-keygen -t ed25519 -f ~/.ssh/id_nuova", out: "Generating public/private ed25519 key pair...", note: { it: "Una rotazione crea una coppia nuova, quindi un'impronta nuova.", en: "A rotation creates a new pair, hence a new fingerprint." } },
            { cmd: "ssh -o IdentitiesOnly=yes -i ~/.ssh/id_nuova deploy@10.10.0.2 true", out: "", note: { it: "La prova esclude agent e chiavi vecchie: sai quale ha firmato.", en: "The test excludes the agent and old keys: you know which one signed." } },
            { cmd: "# ssh-ed25519 AAAA... vecchia", out: "", note: { it: "Commentare revoca la riga ma conserva una traccia annullabile.", en: "Commenting revokes the line while keeping reversible evidence." } },
        ] },
        { kind: "pitfalls", items: [
            { it: `<strong>Cancelli la vecchia appena hai copiato la nuova.</strong> Copiare non
                dimostra che permessi, riga, file e privata siano coerenti. Prova un nuovo login
                mentre la vecchia e' ancora presente.`, en: `<strong>You delete the old key as
                soon as you copy the new one.</strong> Copying does not prove permissions, line,
                file, and private key agree. Test a fresh login while the old one remains.` },
            { it: `<strong>Provi con un semplice <code>ssh host</code>.</strong> L'agent o un nome
                predefinito puo' usare ancora la vecchia. Aggiungi <code>IdentitiesOnly=yes</code>
                e <code>-i id_nuova</code>; poi leggi l'impronta accettata da sshd.`, en: `<strong>
                You test with plain <code>ssh host</code>.</strong> The agent or a default name may
                still use the old key. Add <code>IdentitiesOnly=yes</code> and
                <code>-i id_nuova</code>; then read the fingerprint accepted by sshd.` },
        ] },
        { kind: "pro", html: { it: `<p><code>authorized_keys</code> e' un insieme additivo: due
            righe distinte autorizzano due firme distinte. Non esiste un comando di rotazione
            atomico nel protocollo SSH. La sicurezza operativa nasce dalla sovrapposizione e da
            una prova osservata dal server.</p><p>Toccare soltanto il config locale non ritira
            niente. La pubblica resta valida su ogni server che la contiene. In una ricognizione
            reale sono emerse <strong>14 chiavi fantasma su 5 macchine</strong>: 7 appartenevano a
            computer che non esistevano piu', e avevano ancora accesso root. Il ritiro si conclude
            sui server, non sul pc da cui partivi.</p>`, en: `<p><code>authorized_keys</code> is an
            additive set: two distinct lines authorise two distinct signatures. The SSH protocol
            has no atomic rotation command. Operational safety comes from overlap and a test
            witnessed by the server.</p><p>Changing only local config revokes nothing. The public
            key remains valid on every server containing it. A real audit uncovered
            <strong>14 ghost keys across 5 machines</strong>: 7 belonged to computers that no
            longer existed, and still had root access. Revocation ends on the servers, not on
            the pc where you started.</p>` } },
        { kind: "lab" },
        { kind: "recap", table: [
            { cmd: "1. aggiungi", what: { it: "affianca la nuova pubblica alla vecchia", en: "place the new public key beside the old one" }, flag: { it: "entrambe devono ancora entrare", en: "both must still log in" } },
            { cmd: "2. prova", what: { it: "isola la nuova con IdentitiesOnly e -i", en: "isolate the new key with IdentitiesOnly and -i" }, flag: { it: "controlla Accepted sul server", en: "inspect Accepted on the server" } },
            { cmd: "3. ritira", what: { it: "commenta la vecchia sul server", en: "comment out the old key on the server" }, flag: { it: "la nuova resta attiva", en: "the new key remains active" } },
        ] },
    ],
    exercises: [
        { id: "e1", tipo: "stato", brief: { it: `Genera
            <code>~/.ssh/id_nuova</code>. Aggiungi la sua pubblica a
            <code>authorized_keys</code> di deploy senza togliere la vecchia. Alla fine entrambe
            le private, usate esplicitamente, devono entrare.`, en: `Generate
            <code>~/.ssh/id_nuova</code>. Add its public key to deploy's
            <code>authorized_keys</code> without removing the old one. At the end both private
            keys, selected explicitly, must log in.` },
          come: [{ dove: "pc", testo: { it: "Genera una coppia nuova; nel lab puoi lasciare vuota la passphrase per concentrarti sulla sequenza:", en: "Generate a new pair; in the lab you may leave the passphrase empty to focus on the sequence:" }, cmd: "ssh-keygen -t ed25519 -f ~/.ssh/id_nuova" }, { dove: "pc", testo: { it: "Usa la vecchia sessione per appendere, non sovrascrivere, la nuova pubblica sul server.", en: "Use the old access to append, not overwrite, the new public key on the server." }, cmd: "cat ~/.ssh/id_nuova.pub | ssh -o IdentitiesOnly=yes -i ~/.ssh/id_vecchia deploy@10.10.0.2 'umask 077; cat >> ~/.ssh/authorized_keys'" }, { dove: "pc", testo: { it: "Prova entrambe con -i e IdentitiesOnly.", en: "Test both with -i and IdentitiesOnly." } }],
          nota: { it: "Il check conta due impronte distinte e apre due sessioni vere.", en: "The check counts two distinct fingerprints and opens two real sessions." },
          checks: [{ id: "due-autorizzazioni", why: { it: "authorized_keys non contiene due impronte distinte.", en: "authorized_keys does not contain two distinct fingerprints." }, nudge: { it: "Sul server usa <code>ssh-keygen -lf ~/.ssh/authorized_keys</code>. Hai usato >> oppure >?", en: "On the server use <code>ssh-keygen -lf ~/.ssh/authorized_keys</code>. Did you use >> or >?" } }, { id: "entrambe-entrano", why: { it: "Una delle due private non apre una sessione BatchMode.", en: "One of the two private keys does not open a BatchMode session." }, nudge: { it: "Provale separatamente con IdentitiesOnly e il rispettivo -i.", en: "Test each separately with IdentitiesOnly and its own -i." } }],
          hints: [{ it: "Non modificare la riga vecchia.", en: "Do not modify the old line." }, { it: "La pubblica nuova va aggiunta con >> sul server.", en: "Append the new public key with >> on the server." }, { it: "Genera id_nuova e inviane la .pub attraverso un login fatto con id_vecchia.", en: "Generate id_nuova and send its .pub through a login made with id_vecchia." }] },
        { id: "e2", tipo: "stato", brief: { it: `Entrambe le chiavi sono autorizzate. Prima di
            rimuovere qualunque riga, apri una nuova sessione usando soltanto
            <code>id_nuova</code>. La vecchia deve restare in <code>authorized_keys</code>.`, en: `Both
            keys are authorised. Before removing any line, open a fresh session using only
            <code>id_nuova</code>. The old key must remain in <code>authorized_keys</code>.` },
          come: [{ dove: "pc", testo: { it: "Escludi ogni identita' implicita:", en: "Exclude every implicit identity:" }, cmd: "ssh -o BatchMode=yes -o IdentitiesOnly=yes -i ~/.ssh/id_nuova deploy@10.10.0.2 true" }, { dove: "server", testo: { it: "Controlla che l'ultimo Accepted riporti l'impronta nuova e che entrambe le righe esistano ancora.", en: "Verify that the latest Accepted reports the new fingerprint and both lines still exist." } }],
          nota: { it: "Cancellare gia' la vecchia fa fallire questo passaggio, anche se la nuova funziona.", en: "Deleting the old key already fails this step, even if the new one works." },
          checks: [{ id: "nuova-provata", why: { it: "sshd non ha registrato un Accepted con l'impronta nuova.", en: "sshd has not recorded an Accepted with the new fingerprint." }, nudge: { it: "Usa insieme BatchMode, IdentitiesOnly e -i id_nuova; poi leggi il registro.", en: "Use BatchMode, IdentitiesOnly, and -i id_nuova together; then read the log." } }, { id: "vecchia-ancora-presente", why: { it: "La prova e' avvenuta dopo aver gia' tolto una delle due autorizzazioni.", en: "The test happened after one of the two authorisations had already been removed." }, nudge: { it: "authorized_keys deve ancora mostrare entrambe le impronte.", en: "authorized_keys must still show both fingerprints." } }],
          hints: [{ it: "Questo passo non modifica authorized_keys.", en: "This step does not modify authorized_keys." }, { it: "Un semplice ssh potrebbe usare la vecchia o l'agent.", en: "Plain ssh might use the old key or the agent." }, { it: "Esegui il comando con IdentitiesOnly=yes e -i ~/.ssh/id_nuova.", en: "Run the command with IdentitiesOnly=yes and -i ~/.ssh/id_nuova." }] },
        { id: "e3", tipo: "stato", brief: { it: `La nuova e' gia' stata provata. Sul server
            commenta la riga della vecchia con <code># </code>, senza cancellarla. Dimostra che
            la vecchia e' rifiutata e la nuova entra ancora.`, en: `The new key has already been
            tested. On the server, comment out the old line with <code># </code>, without deleting
            it. Prove that the old key is rejected and the new one still logs in.` },
          come: [{ dove: "server", testo: { it: "Fai prima una copia del file, riconosci la vecchia per impronta e aggiungi # davanti alla sua riga.", en: "First back up the file, identify the old key by fingerprint, and add # before its line." } }, { dove: "pc", testo: { it: "Prova separatamente la vecchia, che deve fallire, e la nuova, che deve riuscire.", en: "Test the old key separately, which must fail, and the new one, which must succeed." } }],
          nota: { it: "Il commento e' un ritiro effettivo ma annullabile. Il file non resta mai senza una chiave attiva.", en: "The comment is an effective but reversible revocation. The file never lacks an active key." },
          checks: [{ id: "vecchia-ritirata", why: { it: "La vecchia privata e' ancora accettata.", en: "The old private key is still accepted." }, nudge: { it: "Controlla che la riga con la sua impronta cominci davvero con #.", en: "Verify that the line with its fingerprint actually begins with #." } }, { id: "nuova-attiva", why: { it: "La nuova non apre piu' una sessione.", en: "The new key no longer opens a session." }, nudge: { it: "Non lasciare authorized_keys vuoto e non commentare la riga nuova.", en: "Do not leave authorized_keys empty or comment out the new line." } }, { id: "ritiro-annullabile", why: { it: "La vecchia riga e' stata cancellata invece che commentata, oppure non resta una chiave attiva.", en: "The old line was deleted rather than commented, or no active key remains." }, nudge: { it: "Ripristina dal backup e aggiungi esattamente <code># </code> davanti alla riga vecchia.", en: "Restore from backup and add exactly <code># </code> before the old line." } }],
          hints: [{ it: "Calcola le impronte delle due .pub sul pc e delle righe sul server.", en: "Fingerprint both .pub files on the pc and the server lines." }, { it: "Non cancellare: conserva la riga come commento.", en: "Do not delete: preserve the line as a comment." }, { it: "Aggiungi # davanti alla riga di id_vecchia, poi prova entrambe con IdentitiesOnly.", en: "Add # before the id_vecchia line, then test both with IdentitiesOnly." }] },
    ],
};
