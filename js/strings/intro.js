// La guida "Basi/Basics": per chi non ha mai aperto un terminale in vita sua.
// Si apre da sola alla prima visita e resta raggiungibile dall'header.
// Non e' il riferimento dei comandi: e' il perche', con un'analogia e un esempio concreto.

export default {
it: `
<p><strong>Qui dentro gira un vero Linux.</strong> Non una simulazione, non un finto terminale
che risponde solo alle domande previste: un kernel Linux completo, che parte dentro la scheda
del tuo browser. Puoi digitare qualunque cosa. Puoi anche romperlo — c'è un bottone che lo
rimette a nuovo in mezzo secondo.</p>

<h3>Che cos'è un terminale</h3>
<p>È una finestra dove <em>scrivi</em> quello che vuoi che il computer faccia, invece di
cliccarlo. Sembra un passo indietro, ed è l'esatto contrario: quello che scrivi si può
ripetere, salvare, mandare a un collega, far eseguire ogni notte alle tre. Un clic no.</p>

<p>Il programma che legge quello che scrivi si chiama <strong>shell</strong>. Fa una cosa sola,
e la fa sempre uguale: legge una riga, la spezza sugli spazi, prende la prima parola come
<strong>comando</strong> e le altre come <strong>istruzioni per quel comando</strong>.</p>

<pre><code>ls -l /etc
│  │  └── argomento: su cosa lavorare
│  └───── opzione: come farlo (le opzioni cominciano con -)
└──────── comando: cosa fare</code></pre>

<p>Se scrivi una parola che la shell non conosce, ti risponde <code>command not found</code>.
Non hai rotto niente: ti sta dicendo che quella parola non è un comando. È una risposta, non
un guaio.</p>

<h3>Come si usa questo lab</h3>
<ul>
  <li><strong>A sinistra</strong> si legge, <strong>a destra</strong> si prova. Il terminale è
      sempre lì: non devi cambiare pagina per esercitarti.</li>
  <li>Ogni capitolo ha <strong>esercizi verificati</strong>. Premi <em>Verifica</em> e la
      macchina guarda davvero com'è finito il suo filesystem.</li>
  <li>Il mondo di ogni esercizio è <strong>generato con un seme diverso ogni volta</strong>:
      i numeri che ti servono non sono scritti da nessuna parte, devi guardarli tu. Per questo
      copiare una risposta non funziona — e per questo, quando la trovi, l'hai imparata.</li>
  <li>Quando sbagli non ti diciamo solo «no»: ti diamo <strong>un comando per guardare il
      problema</strong>. È il riflesso che distingue chi sa amministrare un sistema: prima
      guardo, poi cambio.</li>
  <li>L'interruttore <strong>BASE / PRO</strong> in alto regola la profondità. In BASE impari
      cosa fare; in PRO scopri come funziona sotto e cosa si rompe. Sono le stesse pagine.</li>
</ul>

<h3>Quattro tasti che ti servono subito</h3>
<ul>
  <li><kbd>Tab</kbd> — completa quello che stai scrivendo. Usalo sempre: fa risparmiare
      tempo e soprattutto evita gli errori di battitura.</li>
  <li><kbd>↑</kbd> — richiama il comando precedente.</li>
  <li><kbd>Ctrl</kbd>+<kbd>C</kbd> — ferma il comando in corso.</li>
  <li><code>--help</code> dopo quasi ogni comando — spiega cosa sa fare.
      <em>Questa è l'abilità più importante del corso: non ricordare, saper chiedere.</em></li>
</ul>

<h3>Due parole che ricorreranno</h3>
<ul>
  <li><strong>File</strong> — su Linux quasi tutto è un file: i documenti, le configurazioni,
      i dischi, perfino lo stato del processore.</li>
  <li><strong>Cartella</strong> (o <em>directory</em>) — un contenitore di file. Tutte insieme
      formano un albero unico che parte da <code>/</code>, chiamato <em>radice</em>.</li>
</ul>

<p><em>Non serve capire tutto adesso.</em> Serve solo cominciare a scrivere.</p>
`,

en: `
<p><strong>A real Linux runs in here.</strong> Not a simulation, not a fake terminal that only
answers the expected questions: a full Linux kernel, booting inside your browser tab. You can
type anything. You can even break it — there is a button that puts it back to new in half a
second.</p>

<h3>What a terminal is</h3>
<p>It is a window where you <em>write</em> what you want the computer to do, instead of clicking
it. It looks like a step backwards, and it is the exact opposite: what you write can be
repeated, saved, sent to a colleague, run every night at three. A click cannot.</p>

<p>The program that reads what you type is called the <strong>shell</strong>. It does one thing,
always the same way: it reads a line, splits it on spaces, takes the first word as the
<strong>command</strong> and the rest as <strong>instructions for that command</strong>.</p>

<pre><code>ls -l /etc
│  │  └── argument: what to work on
│  └───── option: how to do it (options start with -)
└──────── command: what to do</code></pre>

<p>If you type a word the shell does not know, it answers <code>command not found</code>. You
have broken nothing: it is telling you that word is not a command. That is an answer, not
trouble.</p>

<h3>How to use this lab</h3>
<ul>
  <li><strong>On the left</strong> you read, <strong>on the right</strong> you try. The terminal
      is always there: you never change page to practise.</li>
  <li>Every chapter has <strong>checked exercises</strong>. Press <em>Check</em> and the machine
      really looks at how its filesystem ended up.</li>
  <li>Each exercise's world is <strong>generated from a different seed every time</strong>: the
      numbers you need are written nowhere, you have to look at them yourself. That is why
      copying an answer does not work — and why, once you find it, you have learned it.</li>
  <li>When you get it wrong we do not just say "no": we hand you <strong>a command to look at
      the problem</strong>. That is the reflex that marks someone who can run a system: look
      first, change second.</li>
  <li>The <strong>BASE / PRO</strong> switch at the top sets the depth. In BASE you learn what
      to do; in PRO you find out how it works underneath and what breaks. Same pages.</li>
</ul>

<h3>Four keys you need right away</h3>
<ul>
  <li><kbd>Tab</kbd> — completes what you are typing. Always use it: it saves time and, more
      importantly, prevents typos.</li>
  <li><kbd>↑</kbd> — recalls the previous command.</li>
  <li><kbd>Ctrl</kbd>+<kbd>C</kbd> — stops the running command.</li>
  <li><code>--help</code> after almost any command — explains what it can do.
      <em>This is the single most important skill in the course: not remembering, but knowing
      how to ask.</em></li>
</ul>

<h3>Two words that will keep coming back</h3>
<ul>
  <li><strong>File</strong> — on Linux almost everything is a file: documents, configuration,
      disks, even the state of the processor.</li>
  <li><strong>Directory</strong> (or folder) — a container of files. Together they form a single
      tree starting at <code>/</code>, called the <em>root</em>.</li>
</ul>

<p><em>You do not need to understand it all now.</em> You only need to start typing.</p>
`,
};
