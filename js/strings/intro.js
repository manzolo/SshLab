// La guida "Basi/Basics": per chi non ha mai usato SSH in vita sua.
// Si apre da sola alla prima visita e resta raggiungibile dall'header.
// Non e' il riferimento dei comandi: e' il perche', con un'analogia e un esempio
// concreto preso dal capitolo 1.

export default {
it: `
<p><strong>Qui dentro girano due macchine Linux vere.</strong> Non una simulazione, non due
finti terminali che rispondono solo alle domande previste: un kernel Linux completo dentro la
scheda del tuo browser, con due host in rete fra loro e OpenSSH vero installato sopra. Puoi
digitare qualunque cosa. Puoi anche rompere tutto — c'è un bottone che le rimette a nuovo in
mezzo secondo.</p>

<h3>Cos'è SSH, in una riga</h3>
<p>È il modo in cui apri una finestra di comando <em>su un computer che non è davanti a te</em>.
Scrivi qui, i comandi girano là. È così che si amministra qualunque server al mondo: il tuo NAS,
un sito, una macchina in ufficio mentre sei a casa.</p>

<h3>Il problema che risolve</h3>
<p>Il computer là in fondo deve lasciarti entrare, ma non ha modo di vederti in faccia. Come fa
a sapere che sei tu? La risposta ovvia è <strong>una password</strong> — e funziona, ma ha due
difetti seri: la devi digitare ogni volta, e la devi <em>mandare</em> alla macchina, quindi lei
la conosce. Se quel server è compromesso, la tua password è compromessa.</p>

<p>SSH ha una risposta migliore, ed è la cosa che questo lab esiste per farti vedere:
<strong>una coppia di chiavi</strong>.</p>

<h3>L'analogia: il lucchetto e la chiave</h3>
<p>Immagina di avere un lucchetto e la sua chiave. Del lucchetto puoi fare quante copie vuoi e
lasciarle in giro dove ti pare: <strong>un lucchetto aperto non apre niente</strong>. La chiave,
invece, è una sola e resta in tasca tua.</p>

<p>Nel mondo di SSH il lucchetto si chiama <strong>chiave pubblica</strong> e la chiave si chiama
<strong>chiave privata</strong>. Ne generi una coppia sul tuo computer, porti la <em>pubblica</em>
sul server — quella si può copiare, mandare per email, pubblicare — e la <em>privata</em> non
esce mai da casa tua.</p>

<p>Quando ti connetti, il server non ti chiede la chiave. Ti manda un indovinello che si può
risolvere solo con la privata, e guarda se la tua risposta torna. <strong>Il segreto non
attraversa mai il cavo</strong>: nemmeno una volta, nemmeno cifrato.</p>

<h3>Un esempio concreto, quello del capitolo 1</h3>
<p>Le due macchine qui sotto si chiamano <code>pc</code> (a sinistra, in ciano: sei tu, l'utente
<code>manzolo</code>) e <code>server</code> (a destra, in ambra: la macchina remota, dove sei
l'utente <code>deploy</code>). Hanno due indirizzi, per esempio <code>10.10.0.1</code> e
<code>10.10.0.2</code>, e fra loro c'è una rete.</p>

<p>Dal terminale di sinistra scrivi:</p>
<pre>ssh deploy@10.10.0.2</pre>
<p>e ti ritrovi sull'altra macchina. Il prompt cambia da <code>manzolo@pc</code> a
<code>deploy@server</code>: <strong>è l'unica cosa che ti dice dove sei</strong>, perché la
finestra è sempre la stessa. Con <code>exit</code> torni a casa.</p>

<h3>Le parole che incontrerai</h3>
<ul>
<li><strong>host</strong> — una macchina in rete. Qui ce ne sono due.</li>
<li><strong>chiave privata</strong> — il file che non deve uscire dal tuo computer. Mai.</li>
<li><strong>chiave pubblica</strong> — la metà che si può copiare ovunque senza rischi.</li>
<li><strong>impronta (<code>SHA256:…</code>)</strong> — un riassunto corto di una chiave, che serve
a riconoscerla senza doverla leggere tutta. Il nome del file non vuol dire niente: due file con
nomi diversi e la stessa impronta sono la stessa chiave.</li>
<li><strong><code>authorized_keys</code></strong> — l'elenco, <em>sul server</em>, delle chiavi
pubbliche a cui è permesso entrare.</li>
<li><strong><code>known_hosts</code></strong> — l'elenco, <em>sul tuo computer</em>, dei server che
hai già incontrato. Serve ad accorgersi se un giorno risponde qualcun altro al posto loro.</li>
<li><strong><code>ssh-agent</code></strong> — un programma che tiene la chiave sbloccata per te,
così digiti la passphrase una volta sola invece che a ogni connessione.</li>
<li><strong>passphrase</strong> — la parola d'ordine che protegge la chiave privata sul disco.
Non è la password del server: è il lucchetto della tua tasca.</li>
</ul>

<h3>Come si usa questo lab</h3>
<p>Sopra c'è il capitolo da leggere, sotto le due macchine, e in fondo gli esercizi. Ogni
esercizio dice cosa fare e <strong>come si fa</strong>, con i comandi e la pastiglia della
macchina su cui vanno scritti. Quando premi <em>Verifica</em>, il laboratorio guarda cosa è
successo alle macchine — non cosa hai digitato — e se qualcosa non torna ti dà il numero che ha
misurato e un comando per andare a guardare.</p>

<p>Gli indirizzi e i nomi cambiano a ogni esercizio, quindi la risposta non si può copiare da
nessuna parte: bisogna chiederla alle macchine. È voluto.</p>
`,

en: `
<p><strong>Two real Linux machines run in here.</strong> Not a simulation, not two fake terminals
that only answer the expected questions: a complete Linux kernel inside your browser tab, with
two hosts networked to each other and real OpenSSH installed on top. You can type anything. You
can even break everything — one button puts them back to new in half a second.</p>

<h3>What SSH is, in one line</h3>
<p>It is how you open a command window <em>on a computer that is not in front of you</em>. You
type here, the commands run there. That is how every server in the world is administered: your
NAS, a website, a machine at the office while you are at home.</p>

<h3>The problem it solves</h3>
<p>The computer over there has to let you in, but it cannot see your face. How does it know it is
you? The obvious answer is <strong>a password</strong> — and it works, but it has two serious
flaws: you have to type it every time, and you have to <em>send</em> it to the machine, so the
machine knows it. If that server is compromised, your password is compromised.</p>

<p>SSH has a better answer, and it is the thing this lab exists to show you: <strong>a key
pair</strong>.</p>

<h3>The analogy: the padlock and the key</h3>
<p>Picture a padlock and its key. You can make as many copies of the padlock as you like and
leave them anywhere: <strong>an open padlock opens nothing</strong>. The key, on the other hand,
is one and stays in your pocket.</p>

<p>In SSH the padlock is called the <strong>public key</strong> and the key is called the
<strong>private key</strong>. You generate a pair on your computer, take the <em>public</em> one
to the server — that one can be copied, emailed, published — and the <em>private</em> one never
leaves home.</p>

<p>When you connect, the server does not ask for your key. It sends you a riddle that can only be
solved with the private one, and checks whether your answer adds up. <strong>The secret never
crosses the wire</strong>: not once, not even encrypted.</p>

<h3>A concrete example, the one from chapter 1</h3>
<p>The two machines below are called <code>pc</code> (on the left, in cyan: that is you, user
<code>manzolo</code>) and <code>server</code> (on the right, in amber: the remote machine, where
you are user <code>deploy</code>). They have two addresses, for example <code>10.10.0.1</code>
and <code>10.10.0.2</code>, and a network in between.</p>

<p>From the left-hand terminal you type:</p>
<pre>ssh deploy@10.10.0.2</pre>
<p>and you end up on the other machine. The prompt changes from <code>manzolo@pc</code> to
<code>deploy@server</code>: <strong>that is the only thing telling you where you are</strong>,
because the window never changed. <code>exit</code> brings you home.</p>

<h3>The words you will meet</h3>
<ul>
<li><strong>host</strong> — a machine on a network. There are two here.</li>
<li><strong>private key</strong> — the file that must never leave your computer. Ever.</li>
<li><strong>public key</strong> — the half that can be copied anywhere without risk.</li>
<li><strong>fingerprint (<code>SHA256:…</code>)</strong> — a short summary of a key, used to
recognise it without reading the whole thing. The filename means nothing: two files with
different names and the same fingerprint are the same key.</li>
<li><strong><code>authorized_keys</code></strong> — the list, <em>on the server</em>, of public
keys that are allowed in.</li>
<li><strong><code>known_hosts</code></strong> — the list, <em>on your computer</em>, of servers you
have already met. It is what notices if one day somebody else answers in their place.</li>
<li><strong><code>ssh-agent</code></strong> — a program that holds your key unlocked for you, so
you type the passphrase once instead of on every connection.</li>
<li><strong>passphrase</strong> — the secret that protects the private key on disk. It is not the
server's password: it is the lock on your own pocket.</li>
</ul>

<h3>How to use this lab</h3>
<p>The chapter to read is on top, the two machines below it, and the exercises at the bottom.
Every exercise tells you what to do and <strong>how to do it</strong>, with the commands and a
badge for the machine they go on. When you press <em>Verify</em>, the lab looks at what happened
to the machines — not at what you typed — and if something is off it gives you the number it
measured and a command to go and look.</p>

<p>Addresses and names change with every exercise, so the answer cannot be copied from anywhere:
you have to ask the machines. That is on purpose.</p>
`,
};
