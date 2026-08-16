export default {
    id: "ch02", num: 2, requires: ["ch01"], draft: false,
    title: { it: "La coppia di chiavi", en: "The key pair" },
    oneLiner: {
        it: "Due file condividono un'identita'. Solo uno puo' lasciare il tuo computer.",
        en: "Two files share one identity. Only one may leave your computer.",
    },
    commands: ["ssh-keygen", "ssh-keygen -lf", "ssh-keygen -y", "ls -l ~/.ssh"],
    glossary: ["chiave privata", "chiave pubblica", "coppia", "commento", "ed25519"],

    blocks: [
        { kind: "hook", html: {
            it: `Devi entrare su un server senza scrivere la password ogni volta. Il gesto
                 facile e' copiare "la chiave" di la'. Ma una chiave SSH nasce in
                 <strong>due file</strong>, e copiarne quello sbagliato significa consegnare
                 a un'altra macchina il potere di presentarsi al posto tuo. Prima di muovere
                 qualcosa, devi sapere quale dei due resta a casa.`,
            en: `You need to log in to a server without typing your password every time. The
                 easy instruction is to copy “the key” over there. But an SSH key is born as
                 <strong>two files</strong>, and copying the wrong one gives another machine
                 the power to impersonate you. Before moving anything, you need to know which
                 of the two stays home.` } },

        { kind: "lead", html: {
            it: `<code>ssh-keygen</code> crea una coppia. <code>id_ed25519</code> e' la
                 <strong>privata</strong>: non si pubblica, non si allega, non si copia sul
                 server. <code>id_ed25519.pub</code> e' la <strong>pubblica</strong>: andra'
                 proprio sul server. Se perdi la pubblica, la ricavi di nuovo dalla privata.
                 Il contrario non esiste.`,
            en: `<code>ssh-keygen</code> creates a pair. <code>id_ed25519</code> is the
                 <strong>private</strong> key: do not publish it, attach it, or copy it to the
                 server. <code>id_ed25519.pub</code> is the <strong>public</strong> key: that is
                 the one that will go to the server. If you lose the public key, you can derive
                 it again from the private one. The reverse is impossible.` } },

        { kind: "analogy", html: {
            it: `Pensa a un timbro che solo tu possiedi e a un campione della sua impronta.
                 Il timbro e' la privata: produce una prova e resta nella tua scrivania. Il
                 campione e' la pubblica: puoi lasciarlo a ogni portineria che dovra'
                 riconoscere le tue prove. Dal timbro puoi ottenere altri campioni; da un
                 campione non ricostruisci il timbro.`,
            en: `Think of a stamp that only you own and a sample of its mark. The stamp is the
                 private key: it produces evidence and stays in your desk. The sample is the
                 public key: you can leave it with every front desk that must recognise your
                 evidence. You can make more samples from the stamp; a sample cannot recreate
                 the stamp.` } },

        { kind: "shown", lines: [
            { cmd: "ssh-keygen -t ed25519 -C \"manzolo@pc\"", out: "Your identification has been saved in /home/manzolo/.ssh/id_ed25519\nYour public key has been saved in /home/manzolo/.ssh/id_ed25519.pub",
              note: { it: "Una sola operazione, due file. Accetta il percorso proposto e, per ora, lascia vuota la passphrase.",
                      en: "One operation, two files. Accept the proposed path and, for now, leave the passphrase empty." } },
            { cmd: "ls -l ~/.ssh/id_ed25519*", out: "-rw------- 1 manzolo manzolo 411 ... id_ed25519\n-rw-r--r-- 1 manzolo manzolo  98 ... id_ed25519.pub",
              note: { it: "La privata e' protetta dal modo 600. Il suffisso <code>.pub</code> indica quella pubblicabile.",
                      en: "The private key is protected by mode 600. The <code>.pub</code> suffix marks the publishable one." } },
            { cmd: "ssh-keygen -lf ~/.ssh/id_ed25519.pub", out: "256 SHA256:... manzolo@pc (ED25519)",
              note: { it: "Il commento ti aiutera' a riconoscerla. L'identita' vera della chiave e' l'impronta, che vedrai nel prossimo capitolo.",
                      en: "The comment will help you recognise it. The key's real identity is its fingerprint, which you will meet in the next chapter." } },
        ] },

        { kind: "pitfalls", items: [
            { it: `<strong>Scrivi <code>ssh-keygen</code>, premi Invio per abitudine e scopri
                    che propone un file gia' esistente.</strong> La domanda sull'overwrite arriva
                    una volta sola. Un si' distratto sostituisce la privata; le copie della
                    vecchia pubblica sui server non serviranno piu'. Leggi il percorso prima di
                    confermare, oppure usa sempre <code>-f</code>.`,
              en: `<strong>You type <code>ssh-keygen</code>, press Enter by habit, and find it
                    proposing an existing file.</strong> The overwrite question comes only once.
                    A distracted yes replaces the private key; copies of the old public key on
                    servers will no longer help. Read the path before confirming, or always use
                    <code>-f</code>.` },
            { it: `<strong>Incolli la privata in una chat perche' "serve la chiave".</strong>
                    La pubblica e' una sola riga che comincia con <code>ssh-ed25519</code>. La
                    privata e' un blocco che comincia con <code>BEGIN OPENSSH PRIVATE KEY</code>.
                    Se vedi quella scritta fuori dal tuo pc, considera la chiave compromessa.`,
              en: `<strong>You paste the private key into a chat because somebody “needs the
                    key”.</strong> The public key is one line beginning with
                    <code>ssh-ed25519</code>. The private key is a block beginning with
                    <code>BEGIN OPENSSH PRIVATE KEY</code>. If you see that text outside your
                    computer, treat the key as compromised.` },
            { it: `<strong>Lasci il commento vuoto perche' sembra decorativo.</strong> Sei mesi
                    dopo <code>authorized_keys</code> contiene dodici righe e non sai quale
                    ritirare. <code>-C "persona@macchina"</code> non protegge la chiave, ma rende
                    possibile amministrarla.`,
              en: `<strong>You leave the comment empty because it looks decorative.</strong> Six
                    months later <code>authorized_keys</code> contains twelve lines and you do
                    not know which one to revoke. <code>-C "person@machine"</code> does not
                    protect the key, but it makes the key manageable.` },
        ] },

        { kind: "pro", html: {
            it: `<p>Perche' ed25519? Non devi scegliere una lunghezza, la firma e' veloce e i
                 file sono piccoli. Nell'immagine di questo lab una pubblica ed25519 occupa
                 98 byte; una RSA-4096 ne occupa 739. Non e' solo spazio: su una CPU emulata
                 generare RSA-4096 costa abbastanza da interrompere la lezione.</p>
                 <p>Il limite va detto: apparati vecchi possono non conoscere ed25519. Un NAS
                 del 2006 puo' costringerti a usare RSA. Non significa scegliere RSA ovunque;
                 significa verificare cosa accetta il server e tenere l'eccezione confinata.
                 Le opzioni e i tipi supportati sono documentati in <code>man ssh-keygen</code>,
                 disponibile anche dentro questo lab.</p>`,
            en: `<p>Why ed25519? There is no length to choose, signing is fast, and the files
                 are small. In this lab's image an ed25519 public key takes 98 bytes; an RSA-4096
                 one takes 739. This is not only about storage: on an emulated CPU, generating
                 RSA-4096 is slow enough to interrupt the lesson.</p>
                 <p>The limit must be stated: old appliances may not know ed25519. A NAS from
                 2006 may force you to use RSA. That does not mean choosing RSA everywhere; it
                 means checking what the server accepts and keeping the exception contained.
                 Supported options and key types are documented in <code>man ssh-keygen</code>,
                 available inside this lab too.</p>` } },

        { kind: "lab" },

        { kind: "recap", table: [
            { cmd: "ssh-keygen -t ed25519", what: { it: "crea privata e pubblica", en: "create private and public keys" },
              flag: { it: "<code>-C</code>: commento leggibile", en: "<code>-C</code>: readable comment" } },
            { cmd: "ssh-keygen -lf file", what: { it: "mostra l'impronta di una chiave", en: "show a key's fingerprint" },
              flag: { it: "funziona sulla privata e sulla pubblica", en: "works on private and public keys" } },
            { cmd: "ssh-keygen -y -f privata", what: { it: "ricava la pubblica dalla privata", en: "derive the public key from the private one" },
              flag: { it: "<code>&gt; nuova.pub</code> per salvarla", en: "<code>&gt; new.pub</code> to save it" } },
            { cmd: "chmod 600 privata", what: { it: "rende la privata leggibile solo da te", en: "make the private key readable only by you" },
              flag: { it: "SSH rifiuta private troppo aperte", en: "SSH rejects overly open private keys" } },
        ] },
    ],

    exercises: [
        {
            id: "e1", tipo: "stato",
            brief: {
                it: `Sul <strong>pc</strong>, genera <code>~/.ssh/id_ed25519</code> con il
                     commento <code>manzolo@pc</code>. Lascia vuota la passphrase: la
                     proteggeremo piu' avanti. Alla fine devono esserci una privata protetta
                     e la sua vera pubblica, non soltanto due file con i nomi giusti.`,
                en: `On the <strong>pc</strong>, generate <code>~/.ssh/id_ed25519</code> with
                     the comment <code>manzolo@pc</code>. Leave the passphrase empty: we will
                     protect it later. At the end there must be a protected private key and its
                     actual public key, not merely two files with the right names.`,
            },
            come: [
                { dove: "pc", testo: { it: "Genera la coppia nel percorso richiesto:", en: "Generate the pair at the requested path:" },
                  cmd: "ssh-keygen -t ed25519 -C \"manzolo@pc\" -f ~/.ssh/id_ed25519" },
                { dove: "pc", testo: { it: "Controlla nomi, proprietario e permessi:", en: "Check names, owner, and permissions:" },
                  cmd: "ls -l ~/.ssh/id_ed25519*" },
                { dove: "pc", testo: { it: "Chiedi l'impronta a entrambi i file: deve essere la stessa.", en: "Ask both files for their fingerprint: it must be the same." },
                  cmd: "ssh-keygen -lf ~/.ssh/id_ed25519; ssh-keygen -lf ~/.ssh/id_ed25519.pub" },
            ],
            nota: {
                it: "La verifica legge entrambe le chiavi e ne confronta le impronte. Creare due file a mano non basta: devono essere davvero una coppia.",
                en: "The check reads both keys and compares their fingerprints. Creating two files by hand is not enough: they must really be a pair.",
            },
            checks: [
                { id: "privata-protetta",
                  why: { it: "La privata manca, non e' leggibile come chiave o non ha modo 600.", en: "The private key is missing, cannot be read as a key, or is not mode 600." },
                  nudge: { it: "Guarda <code>ls -l ~/.ssh/id_ed25519</code> e prova <code>ssh-keygen -lf</code> sul file.", en: "Look at <code>ls -l ~/.ssh/id_ed25519</code> and try <code>ssh-keygen -lf</code> on the file." } },
                { id: "pubblica-presente",
                  why: { it: "La pubblica manca o non e' una chiave leggibile.", en: "The public key is missing or is not a readable key." },
                  nudge: { it: "Il file deve chiamarsi <code>id_ed25519.pub</code>. Se hai la privata, puoi ricavarlo con <code>ssh-keygen -y</code>.", en: "The file must be named <code>id_ed25519.pub</code>. If you have the private key, you can derive it with <code>ssh-keygen -y</code>." } },
                { id: "stessa-impronta",
                  why: { it: "I due file esistono, ma non appartengono alla stessa coppia.", en: "Both files exist, but they do not belong to the same pair." },
                  nudge: { it: "Esegui <code>ssh-keygen -lf</code> su entrambi. Se le impronte differiscono, ricava di nuovo la pubblica dalla privata.", en: "Run <code>ssh-keygen -lf</code> on both. If the fingerprints differ, derive the public key from the private key again." } },
            ],
            hints: [
                { it: "<code>ssh-keygen</code> crea entrambi i file in una sola volta.", en: "<code>ssh-keygen</code> creates both files in one operation." },
                { it: "Servono tipo <code>ed25519</code>, commento <code>manzolo@pc</code> e percorso <code>~/.ssh/id_ed25519</code>.", en: "You need type <code>ed25519</code>, comment <code>manzolo@pc</code>, and path <code>~/.ssh/id_ed25519</code>." },
                { it: "<code>ssh-keygen -t ed25519 -C \"manzolo@pc\" -f ~/.ssh/id_ed25519</code>; premi Invio due volte per la passphrase vuota.", en: "<code>ssh-keygen -t ed25519 -C \"manzolo@pc\" -f ~/.ssh/id_ed25519</code>; press Enter twice for an empty passphrase." },
            ],
        },
        {
            id: "e2", tipo: "risposta",
            brief: {
                it: `In <code>~/lab/chiavi/</code> trovi una privata e quattro pubbliche dai
                     nomi casuali. Scopri quale pubblica appartiene alla privata e consegna
                     <strong>solo il nome del file</strong> con <code>lab answer &lt;nome.pub&gt;</code>.`,
                en: `In <code>~/lab/chiavi/</code> you will find one private key and four public
                     keys with random names. Find which public key belongs to the private one and
                     hand in <strong>only the filename</strong> with <code>lab answer &lt;name.pub&gt;</code>.`,
            },
            come: [
                { dove: "pc", testo: { it: "Guarda cosa c'e' nella cartella:", en: "Look at what is in the directory:" },
                  cmd: "ls -l ~/lab/chiavi" },
                { dove: "pc", testo: { it: "Leggi l'impronta della privata e delle quattro pubbliche:", en: "Read the fingerprint of the private key and of all four public keys:" },
                  cmd: "cd ~/lab/chiavi; for f in privata *.pub; do printf '%-16s ' \"$f\"; ssh-keygen -lf \"$f\"; done" },
                { dove: "pc", testo: { it: "Consegna il nome accanto all'impronta uguale:", en: "Hand in the name next to the matching fingerprint:" },
                  cmd: "lab answer <nome.pub>" },
            ],
            nota: {
                it: "Il nome cambia a ogni mondo. La verifica accetta soltanto uno dei quattro file presenti e confronta la sua impronta con quella della privata.",
                en: "The name changes in every world. The check accepts only one of the four files present and compares its fingerprint with that of the private key.",
            },
            checks: [
                { id: "pubblica-giusta",
                  why: { it: "Il file consegnato non e' una delle quattro candidate oppure la sua impronta non coincide con la privata.", en: "The submitted file is not one of the four candidates, or its fingerprint does not match the private key." },
                  nudge: { it: "Entra in <code>~/lab/chiavi</code> e stampa nome e impronta insieme: <code>for f in privata *.pub; do echo $f; ssh-keygen -lf $f; done</code>.", en: "Enter <code>~/lab/chiavi</code> and print name and fingerprint together: <code>for f in privata *.pub; do echo $f; ssh-keygen -lf $f; done</code>." } },
            ],
            hints: [
                { it: "Il suffisso e il commento non provano la parentela. Cerca un valore che non dipenda dal nome.", en: "The suffix and comment do not prove a relationship. Look for a value that does not depend on the name." },
                { it: "<code>ssh-keygen -lf</code> sa leggere sia una privata sia una pubblica.", en: "<code>ssh-keygen -lf</code> can read both private and public keys." },
                { it: "Stampa le cinque impronte, trova le due uguali e consegna il basename della pubblica con <code>lab answer</code>.", en: "Print all five fingerprints, find the two equal ones, and submit the public key's basename with <code>lab answer</code>." },
            ],
        },
    ],
};
