export default {
    id: "ch01", num: 1, draft: false,
    title: { it: "Due macchine e un cavo", en: "Two machines and a cable" },
    oneLiner: {
        it: "SSH non è un comando: è una conversazione fra due computer. Qui ce ne sono due davvero.",
        en: "SSH is not a command: it is a conversation between two computers. Here there are really two.",
    },
    commands: ["ssh", "ip -4 addr", "ping", "hostname", "id -un", "ss -tln"],
    glossary: ["host", "indirizzo IP", "porta 22", "sshd", "namespace"],

    blocks: [
        { kind: "hook", html: {
            it: `Quasi tutti i tutorial su SSH ti fanno guardare <strong>una</strong> macchina.
                 Ma ogni singola cosa che devi capire — dove sta la chiave privata, chi mostra
                 l'impronta, chi decide se ti fa entrare — è una relazione <strong>fra due</strong>.
                 Con una macchina sola impari la sintassi. Con due impari il modello.`,
            en: `Almost every SSH tutorial has you look at <strong>one</strong> machine. But every
                 single thing you need to understand — where the private key lives, who shows the
                 fingerprint, who decides whether to let you in — is a relationship
                 <strong>between two</strong>. With one machine you learn the syntax. With two you
                 learn the model.` } },

        { kind: "lead", html: {
            it: `Qui sotto ci sono due terminali. Quello a sinistra, in ciano, è
                 <strong>il tuo computer</strong>: si chiama <code>pc</code> e tu sei
                 <code>andrea</code>. Quello a destra, in ambra, è <strong>una macchina
                 remota</strong>: si chiama <code>server</code> e lì tu saresti
                 <code>deploy</code>. Hanno due indirizzi diversi e fra loro c'è una rete.
                 Provale: scrivi in tutti e due.`,
            en: `Below there are two terminals. The one on the left, in cyan, is <strong>your
                 computer</strong>: it is called <code>pc</code> and you are <code>andrea</code>.
                 The one on the right, in amber, is <strong>a remote machine</strong>: it is called
                 <code>server</code> and there you would be <code>deploy</code>. They have two
                 different addresses and there is a network between them. Try them: type in both.` } },

        { kind: "analogy", html: {
            it: `Un indirizzo IP è il numero civico, la <strong>porta</strong> è il campanello.
                 Sul server c'è un programma, <code>sshd</code>, che sta seduto accanto al
                 campanello numero <strong>22</strong> e aspetta. <code>ssh</code>, sul tuo
                 computer, è quello che suona. Tutto il resto del corso è la conversazione che i
                 due fanno <em>dopo</em> che qualcuno ha aperto.`,
            en: `An IP address is the street number, the <strong>port</strong> is the doorbell. On
                 the server there is a program, <code>sshd</code>, sitting next to doorbell number
                 <strong>22</strong>, waiting. <code>ssh</code>, on your computer, is the one who
                 rings. Everything else in this course is the conversation the two have
                 <em>after</em> somebody opens the door.` } },

        { kind: "shown", lines: [
            { cmd: "ip -4 addr show veth-pc", out: "inet 10.10.0.1/24 scope global veth-pc",
              note: { it: "Sul pc: questo è il tuo indirizzo.", en: "On the pc: this is your address." } },
            { cmd: "ping -c 1 10.10.0.2", out: "64 bytes from 10.10.0.2: seq=0 ttl=64 time=2.7 ms",
              note: { it: "Il server risponde: il cavo c'è davvero.", en: "The server answers: the cable is really there." } },
            { cmd: "ssh deploy@10.10.0.2", out: "deploy@10.10.0.2's password:",
              note: { it: "Il campanello ha suonato, e qualcuno ha risposto chiedendo chi sei. Per ora la password è <code>lab</code>.",
                      en: "The doorbell rang, and somebody answered asking who you are. For now the password is <code>lab</code>." } },
        ] },

        { kind: "pitfalls", items: [
            { it: "<strong>«Connection refused» non è «Connection timed out».</strong> Il primo vuol dire che qualcuno c'era e ha detto di no: la macchina è viva, ma su quella porta non ascolta nessuno. Il secondo vuol dire che non ha risposto nessuno: macchina spenta, indirizzo sbagliato, o un firewall che butta via i pacchetti in silenzio. Sono due diagnosi diverse, e si confondono per anni.",
              en: "<strong>“Connection refused” is not “Connection timed out”.</strong> The first means somebody was there and said no: the machine is alive, but nobody is listening on that port. The second means nobody answered at all: machine off, wrong address, or a firewall silently dropping packets. Two different diagnoses, confused for years." },
            { it: "<strong>Dopo <code>ssh</code>, il terminale di sinistra non è più il pc.</strong> È sempre la stessa finestra, ma i comandi che scrivi ora li esegue il server. Il prompt te lo dice — ed è l'unica cosa che te lo dice. Chi non ci fa caso finisce per cancellare file sulla macchina sbagliata.",
              en: "<strong>After <code>ssh</code>, the left terminal is no longer the pc.</strong> Same window, but the commands you type now run on the server. The prompt tells you — and it is the only thing that does. People who miss it end up deleting files on the wrong machine." },
            { it: "<strong>Non confondere l'utente con la macchina.</strong> <code>andrea</code> esiste sul pc, <code>deploy</code> sul server: <code>ssh 10.10.0.2</code> senza dire chi sei prova a entrare come <code>andrea</code>, e su quel server <code>andrea</code> non c'è.",
              en: "<strong>Do not confuse the user with the machine.</strong> <code>andrea</code> exists on the pc, <code>deploy</code> on the server: <code>ssh 10.10.0.2</code> without saying who you are tries to log in as <code>andrea</code>, and on that server there is no <code>andrea</code>." },
        ] },

        { kind: "pro", html: {
            it: `<p>Onestà su cosa sono davvero queste due macchine: <strong>non sono due
                 computer</strong>. Sono un kernel solo, con due <em>network namespace</em>
                 collegati da una coppia di interfacce virtuali. Le pile di rete sono due davvero
                 — due indirizzi, due tabelle di routing, un cavo in mezzo — ma il disco è lo
                 stesso e i processi si vedono fra loro.</p>
                 <p>Non è una scorciatoia per finta: <strong>è esattamente quello che è un
                 container.</strong> Quando avvii un container Docker, quello che ottieni è
                 questo. E il motivo per cui qui ci sono due <em>utenti</em> diversi,
                 <code>andrea</code> e <code>deploy</code>, non è cosmetico: siccome il disco è
                 condiviso, è l'unico modo perché <code>~/.ssh</code> sia davvero un altro file
                 sull'altra macchina. Senza quello, «copiare la chiave sul server» non vorrebbe
                 dire niente.</p>`,
            en: `<p>Being honest about what these two machines really are: <strong>they are not two
                 computers</strong>. They are a single kernel with two <em>network namespaces</em>
                 joined by a pair of virtual interfaces. The network stacks really are two — two
                 addresses, two routing tables, a cable in between — but the disk is the same and
                 the processes can see each other.</p>
                 <p>This is not a fake shortcut: <strong>it is exactly what a container is.</strong>
                 When you start a Docker container, this is what you get. And the reason there are
                 two different <em>users</em> here, <code>andrea</code> and <code>deploy</code>, is
                 not cosmetic: since the disk is shared, that is the only way <code>~/.ssh</code>
                 is really a different file on the other machine. Without it, “copying the key to
                 the server” would mean nothing.</p>` } },

        { kind: "lab" },

        { kind: "recap", table: [
            { cmd: "ip -4 addr", what: { it: "gli indirizzi di questa macchina", en: "this machine's addresses" },
              flag: { it: "<code>-o</code>: una riga per interfaccia", en: "<code>-o</code>: one line per interface" } },
            { cmd: "ping", what: { it: "c'è qualcuno a quell'indirizzo?", en: "is anyone at that address?" },
              flag: { it: "<code>-c 1</code>, o non finisce più", en: "<code>-c 1</code>, or it never stops" } },
            { cmd: "ss -tln", what: { it: "quali porte sono in ascolto qui", en: "which ports are listening here" },
              flag: { it: "<code>-p</code>: chi le tiene aperte", en: "<code>-p</code>: who holds them open" } },
            { cmd: "ssh utente@host", what: { it: "apri una sessione sull'altra macchina", en: "open a session on the other machine" },
              flag: { it: "<code>-p</code> se la porta non è la 22", en: "<code>-p</code> if the port is not 22" } },
            { cmd: "exit", what: { it: "chiudi la sessione e torna sul pc", en: "close the session and go back to the pc" },
              flag: { it: "anche <kbd>Ctrl-D</kbd>", en: "<kbd>Ctrl-D</kbd> too" } },
        ] },
    ],

    exercises: [
        {
            id: "e1", tipo: "risposta",
            brief: {
                it: "Dal terminale del <strong>pc</strong>, scopri l'indirizzo IP del server e consegnalo con <code>lab answer &lt;indirizzo&gt;</code>. Attenzione: non è scritto da nessuna parte sul pc — devi chiederlo alla rete o guardarlo dall'altra parte.",
                en: "From the <strong>pc</strong> terminal, find the server's IP address and hand it in with <code>lab answer &lt;address&gt;</code>. Careful: it is written nowhere on the pc — you have to ask the network or look from the other side.",
            },
            checks: [
                { id: "indirizzo-giusto",
                  why: { it: "L'indirizzo consegnato non è quello del server.",
                         en: "The address you handed in is not the server's." },
                  nudge: { it: "Sul terminale del server: <code>ip -4 -o addr show veth-srv</code>. Oppure dal pc: <code>ip -4 -o addr</code> ti dice la tua rete, e il vicino è lì dentro.",
                           en: "On the server terminal: <code>ip -4 -o addr show veth-srv</code>. Or from the pc: <code>ip -4 -o addr</code> tells you your network, and the neighbour is inside it." } },
            ],
            hints: [
                { it: "Le due macchine sono sulla stessa rete: se tu sei <code>10.10.0.qualcosa</code>, lo è anche lui.",
                  en: "The two machines are on the same network: if you are <code>10.10.0.something</code>, so is it." },
                { it: "Il terminale di destra è una macchina vera: puoi scriverci dentro e chiederglielo.",
                  en: "The right-hand terminal is a real machine: you can type in it and just ask." },
                { it: "<code>ip -4 -o addr show veth-srv</code> sul server, poi <code>lab answer 10.10.0.2</code> sul pc.",
                  en: "<code>ip -4 -o addr show veth-srv</code> on the server, then <code>lab answer 10.10.0.2</code> on the pc." },
            ],
        },
        {
            id: "e2", tipo: "stato",
            brief: {
                it: "Entra sul server da <code>ssh</code> (la password di <code>deploy</code> è <code>lab</code>) e lascia lì un file <code>~/prova.txt</code> che contenga il nome della macchina su cui stai scrivendo, preso con <code>hostname</code>. Non barare scrivendolo dal pc: il file deve nascere di là.",
                en: "Get onto the server with <code>ssh</code> (the password for <code>deploy</code> is <code>lab</code>) and leave a file <code>~/prova.txt</code> there containing the name of the machine you are typing on, taken with <code>hostname</code>. No cheating from the pc: the file has to be born over there.",
            },
            checks: [
                { id: "file-sul-server",
                  why: { it: "Sul server, in <code>/home/deploy</code>, non c'è nessun <code>prova.txt</code>.",
                         en: "On the server, in <code>/home/deploy</code>, there is no <code>prova.txt</code>." },
                  nudge: { it: "Dal terminale del server: <code>ls -l ~</code>. Se sei entrato via ssh dal pc, controlla di essere ancora dentro la sessione: il prompt te lo dice.",
                           en: "From the server terminal: <code>ls -l ~</code>. If you got in over ssh from the pc, check you are still inside the session: the prompt tells you." } },
                { id: "sessione-ssh-avvenuta",
                  why: { it: "Il server non ha registrato nessun accesso via ssh: il file può esserci, ma non ci sei arrivato tu attraverso la rete.",
                         en: "The server recorded no ssh login: the file may be there, but you did not get there over the network." },
                  nudge: { it: "Il server tiene un registro: <code>grep sshd /var/log/messages | tail -5</code>. Se è vuoto, nessuno ha bussato.",
                           en: "The server keeps a log: <code>grep sshd /var/log/messages | tail -5</code>. If it is empty, nobody knocked." } },
            ],
            hints: [
                { it: "<code>ssh deploy@10.10.0.2</code> dal terminale di sinistra.",
                  en: "<code>ssh deploy@10.10.0.2</code> from the left-hand terminal." },
                { it: "Dopo essere entrato, il prompt cambia: sei sull'altra macchina anche se il terminale è sempre quello di sinistra. È la cosa che confonde di più all'inizio.",
                  en: "Once in, the prompt changes: you are on the other machine even though the terminal is still the left one. That is the most confusing part at the beginning." },
                { it: "<code>hostname > ~/prova.txt</code>, poi <code>exit</code> per tornare sul pc.",
                  en: "<code>hostname > ~/prova.txt</code>, then <code>exit</code> to come back to the pc." },
            ],
        },
    ],
};
