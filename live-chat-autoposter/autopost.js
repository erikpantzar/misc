// Paste into the browser console on the live-actions chat page.
// Posts an interrogation question, then its answer, alternating every 8 seconds.
// Stop with: stopAutoPost()
(() => {
  const INTERVAL_MS = 8000;

  const QA = [
    { q: "Where were you on the night of the 14th?", a: "At home. Alone. Watching documentaries about penguins." },
    { q: "Can anyone confirm your alibi?", a: "The penguins, technically. But they won't talk." },
    { q: "Why were your fingerprints on the cookie jar?", a: "I was checking it was still secure. Civic duty." },
    { q: "What do you know about the missing stapler?", a: "Only that it was red, beloved, and deeply misunderstood." },
    { q: "Have you ever been to the third floor break room?", a: "Once. I don't like to talk about the microwave incident." },
    { q: "Who told you about the secret recipe?", a: "Nobody. I found it taped under the table. Like a professional." },
    { q: "Why did you leave town so suddenly?", a: "I didn't leave. I went to get milk. It took three days." },
    { q: "Is this your handwriting?", a: "No. Mine is much worse. Ask any pharmacist." },
    { q: "What were you doing near the bakery at 3am?", a: "Smelling bread. It's not a crime. Yet." },
    { q: "Do you recognize the person in this photo?", a: "That's me, but in my defense the lighting is terrible." },
    { q: "Why is there glitter all over your jacket?", a: "Glitter is eternal. It could be from 2019." },
    { q: "Where did the money go?", a: "Snacks. Mostly snacks. Some premium snacks." },
    { q: "Are you lying to me right now?", a: "Only about the premium snacks. They were regular snacks." },
    { q: "Who is 'The Raccoon'?", a: "I can't say. He has eyes everywhere. Mostly in the trash." },
    { q: "Why did you delete your browser history?", a: "I was researching surprise gifts. For you, detective." },
    { q: "Last chance. Anything you want to confess?", a: "Fine. I ate the last slice of pizza. I'd do it again." },
  ];

  // Flatten into question, answer, question, answer...
  const messages = QA.sort(() => Math.random() - 0.5).flatMap(({ q, a }) => [q, a]);
  let i = 0;

  const setNativeValue = (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const send = (text) => {
    // Re-query every tick: Turbo may replace the form after each submit
    const textarea = document.querySelector('textarea[data-live-actions-chat-input-target="textarea"]');
    if (!textarea) return console.warn("[autopost] chat textarea not found");

    textarea.focus();
    setNativeValue(textarea, text);

    const button = document.querySelector('[data-live-actions-chat-input-target="sendButton"]');
    if (button) {
      button.click();
    } else {
      textarea.form?.requestSubmit();
    }
    console.log(`[autopost] ${i + 1}/${messages.length}: ${text}`);
  };

  const tick = () => {
    send(messages[i % messages.length]);
    i++;
  };

  window.stopAutoPost?.();
  tick();
  const timer = setInterval(tick, INTERVAL_MS);
  window.stopAutoPost = () => {
    clearInterval(timer);
    console.log("[autopost] stopped");
  };
  console.log("[autopost] running — call stopAutoPost() to stop");
})();
