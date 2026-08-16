export default {
    id: "ch06", num: 6, requires: ["ch05"], draft: false,
    title: { it: "known_hosts e la prima volta", en: "known_hosts and the first time" },
    oneLiner: { it: "Prima di fidarti di una macchina, confronta la sua impronta e ricordala.", en: "Before trusting a machine, compare its fingerprint and remember it." },
    commands: ["ssh", "ssh-keygen -lf", "known_hosts", "StrictHostKeyChecking", "man ssh_config"],
    glossary: ["host key", "TOFU", "known_hosts", "impronta", "StrictHostKeyChecking"],
    blocks: [
        { kind: "hook", html: { it: `Finora il server ha verificato te. Adesso il client deve
            verificare il server. Alla prima connessione <code>ssh</code> mostra un'impronta e
            chiede se vuoi continuare. Scrivere <code>yes</code> senza confrontarla significa
            fidarsi di chiunque abbia risposto a quell'indirizzo.`, en: `So far the server has
            verified you. Now the client must verify the server. On the first connection,
            <code>ssh</code> shows a fingerprint and asks whether to continue. Typing
            <code>yes</code> without comparing it means trusting whoever answered at that address.` } },
        { kind: "lead", html: { it: `Ottieni l'impronta da un canale indipendente: console,
            inventario o amministratore. Se combacia, accetti. <code>ssh</code> salva la host key
            in <code>~/.ssh/known_hosts</code>; dalla volta successiva pretende la stessa. Questo
            modello si chiama TOFU: <em>trust on first use</em>.`, en: `Get the fingerprint through
            an independent channel: console, inventory, or administrator. If it matches, accept.
            <code>ssh</code> stores the host key in <code>~/.ssh/known_hosts</code> and requires the
            same one next time. This model is called TOFU: trust on first use.` } },
        { kind: "analogy", html: { it: `E' come annotare la voce di una persona durante la prima
            telefonata. L'annotazione rende sospetta una voce diversa domani, ma non dimostra da
            sola che la prima chiamata fosse autentica.`, en: `It is like recording someone's
            voice during the first call. The record makes a different voice suspicious tomorrow,
            but does not prove by itself that the first call was authentic.` } },
        { kind: "shown", lines: [
            { cmd: "ssh deploy@10.10.0.2", out: "The authenticity of host '10.10.0.2' can't be established.\nED25519 key fingerprint is SHA256:...\nAre you sure you want to continue connecting (yes/no/[fingerprint])?", note: { it: "La domanda contiene il dato da confrontare, non la prova che sia giusto.", en: "The prompt contains the value to compare, not proof that it is correct." } },
            { cmd: "ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub", out: "256 SHA256:... root@server (ED25519)", note: { it: "Questo comando va eseguito sulla console del server, cioe' sull'altro canale.", en: "Run this command on the server console, which is the independent channel." } },
            { cmd: "ssh -o StrictHostKeyChecking=yes -o BatchMode=yes deploy@10.10.0.2 true", out: "", note: { it: "yes vieta host sconosciuti o cambiati; BatchMode vieta richieste di password.", en: "yes rejects unknown or changed hosts; BatchMode rejects password prompts." } },
        ] },
        { kind: "pitfalls", items: [
            { it: `<strong>Scrivi yes per far sparire la domanda.</strong> La domanda non e' un
                passaggio cerimoniale. Confronta l'impronta mostrata con una ottenuta altrove.`, en: `<strong>You type yes to dismiss the prompt.</strong> The prompt is not ceremonial. Compare the shown fingerprint with one obtained elsewhere.` },
            { it: `<strong>Usi <code>StrictHostKeyChecking=no</code> come soluzione stabile.</strong>
                Con <code>UserKnownHostsFile=/dev/null</code> il client dimentica ogni incontro:
                ogni connessione torna a essere la prima.`, en: `<strong>You use
                <code>StrictHostKeyChecking=no</code> as a permanent fix.</strong> Together with
                <code>UserKnownHostsFile=/dev/null</code>, the client forgets every encounter:
                every connection becomes the first one again.` },
        ] },
        { kind: "pro", html: { it: `<p><code>known_hosts</code> lega un nome o indirizzo alla
            chiave con cui il server firma lo scambio iniziale. Il file puo' contenere host
            hashati: <code>ssh-keygen -lf ~/.ssh/known_hosts</code> continua a leggerne le
            impronte senza doverlo parsare a mano.</p><p>TOFU protegge gli incontri successivi,
            non il primo. In reti amministrate si possono distribuire host key note o firmarle
            con una CA. Cerca <code>StrictHostKeyChecking</code> e <code>HashKnownHosts</code> in
            <code>man ssh_config</code>.</p>`, en: `<p><code>known_hosts</code> binds a name or
            address to the key used by the server to sign the initial exchange. The file may
            contain hashed hosts: <code>ssh-keygen -lf ~/.ssh/known_hosts</code> still reads their
            fingerprints without hand-parsing it.</p><p>TOFU protects later encounters, not the
            first one. Managed networks can distribute known host keys or sign them with a CA.
            Find <code>StrictHostKeyChecking</code> and <code>HashKnownHosts</code> in
            <code>man ssh_config</code>.</p>` } },
        { kind: "lab" },
        { kind: "recap", table: [
            { cmd: "ssh-keygen -lf hostkey.pub", what: { it: "calcola l'impronta dichiarata dal server", en: "compute the fingerprint declared by the server" }, flag: { it: "ottienila da un canale indipendente", en: "obtain it over an independent channel" } },
            { cmd: "~/.ssh/known_hosts", what: { it: "ricorda le identita' dei server", en: "remember server identities" }, flag: { it: "la prima fiducia resta una decisione umana", en: "initial trust remains a human decision" } },
            { cmd: "StrictHostKeyChecking=yes", what: { it: "accetta soltanto host gia' noti e coerenti", en: "allow only known, matching hosts" }, flag: { it: "fallisce sugli sconosciuti", en: "fails for unknown hosts" } },
        ] },
    ],
    exercises: [
        { id: "e1", tipo: "risposta",
          brief: { it: `Connettiti dal pc e leggi l'impronta proposta. Sul server calcola
              l'impronta di <code>/etc/ssh/ssh_host_ed25519_key.pub</code>. Solo se combaciano,
              rispondi <code>yes</code>. Poi consegna l'impronta con <code>lab answer</code>.`, en: `Connect from the pc and read the proposed fingerprint. On the server, fingerprint
              <code>/etc/ssh/ssh_host_ed25519_key.pub</code>. Only if they match, answer
              <code>yes</code>. Then submit the fingerprint with <code>lab answer</code>.` },
          come: [
              { dove: "pc", testo: { it: "Avvia la prima connessione e fermati sulla domanda:", en: "Start the first connection and stop at the prompt:" }, cmd: "ssh deploy@10.10.0.2" },
              { dove: "server", testo: { it: "Calcola l'impronta dal file del server:", en: "Compute the fingerprint from the server file:" }, cmd: "ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub" },
              { dove: "pc", testo: { it: "Se combacia, accetta e poi consegna il valore SHA256:", en: "If it matches, accept and then submit the SHA256 value:" }, cmd: "lab answer SHA256:..." },
          ],
          nota: { it: "La host key cambia col seme. La risposta non si puo' copiare dal capitolo.", en: "The host key changes with the seed. The answer cannot be copied from the chapter." },
          checks: [
              { id: "host-ricordato", why: { it: "known_hosts non contiene l'impronta servita dal server.", en: "known_hosts does not contain the fingerprint served by the server." }, nudge: { it: "Esegui <code>ssh-keygen -lf ~/.ssh/known_hosts</code> sul pc.", en: "Run <code>ssh-keygen -lf ~/.ssh/known_hosts</code> on the pc." } },
              { id: "impronta-confrontata", why: { it: "La risposta non e' l'impronta attuale del server.", en: "The answer is not the server's current fingerprint." }, nudge: { it: "Confronta il campo SHA256 sui due terminali, poi usa <code>lab answer</code> dal pc.", en: "Compare the SHA256 field in both terminals, then use <code>lab answer</code> on the pc." } },
          ],
          hints: [
              { it: "Non accettare prima di aver usato il terminale del server.", en: "Do not accept before using the server terminal." },
              { it: "L'impronta e' il campo che comincia con SHA256.", en: "The fingerprint is the field beginning with SHA256." },
              { it: "Dopo il confronto scrivi <code>yes</code>, esci dalla sessione e consegna l'impronta.", en: "After comparing, type <code>yes</code>, leave the session, and submit the fingerprint." },
          ] },
        { id: "e2", tipo: "stato",
          brief: { it: `Fai una prima connessione e accetta la host key dopo il confronto. Poi
              dimostra che la seconda connessione riesce con
              <code>StrictHostKeyChecking=yes</code> e <code>BatchMode=yes</code>.`, en: `Make a
              first connection and accept the host key after comparing it. Then prove that the
              second connection succeeds with <code>StrictHostKeyChecking=yes</code> and
              <code>BatchMode=yes</code>.` },
          come: [
              { dove: "pc", testo: { it: "Effettua e verifica il primo incontro come nell'esercizio precedente.", en: "Perform and verify the first encounter as in the previous exercise." } },
              { dove: "pc", testo: { it: "Pretendi ora una host key gia' nota e nessuna domanda:", en: "Now require an already known host key and no prompts:" }, cmd: "ssh -o StrictHostKeyChecking=yes -o BatchMode=yes deploy@10.10.0.2 'id -un'" },
          ],
          nota: { it: "La verifica apre davvero la seconda sessione in modalita' rigorosa.", en: "The check opens the second session in strict mode for real." },
          checks: [
              { id: "secondo-incontro", why: { it: "La connessione rigorosa non riconosce il server o non autentica il client.", en: "The strict connection does not recognise the server or authenticate the client." }, nudge: { it: "Controlla prima <code>ssh-keygen -lf ~/.ssh/known_hosts</code>, poi riprova il comando con <code>-v</code>.", en: "First inspect <code>ssh-keygen -lf ~/.ssh/known_hosts</code>, then retry with <code>-v</code>." } },
          ],
          hints: [
              { it: "Una connessione con host sconosciuto e StrictHostKeyChecking=yes deve fallire.", en: "A connection to an unknown host with StrictHostKeyChecking=yes must fail." },
              { it: "Il primo incontro deve scrivere una voce reale in known_hosts.", en: "The first encounter must write a real known_hosts entry." },
              { it: "Accetta una volta normalmente, poi riprova con entrambe le opzioni yes e BatchMode.", en: "Accept once normally, then retry with both yes and BatchMode options." },
          ] },
    ],
};
