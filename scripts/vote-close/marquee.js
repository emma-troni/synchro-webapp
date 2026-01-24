// marquee.js (o inline) — usa lo span #text generato da altri script
document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("track");
  if (!track) return;

  const container = track.parentElement; // .marquee
  const SPEED = 0.5; // px per frame

  let raf = null;
  let spans = [];
  let baseSpan = null;

  // ---------- helpers ----------
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };

  const clearClones = () => {
    // lascia SOLO il baseSpan originale (se esiste)
    spans.forEach((s) => {
      if (s !== baseSpan) s.remove();
    });
    spans = baseSpan ? [baseSpan] : [];
  };

  const setSpanX = (span, x) => {
    span.dataset.x = String(x);
    span.style.transform = `translateX(${x}px)`;
  };

  const ensureFilled = () => {
    if (!baseSpan) return;

    const trackRect = track.getBoundingClientRect();

    // crea cloni finché l’ultimo non supera il bordo destro del contenitore
    while (true) {
      const last = spans[spans.length - 1];
      const lastRect = last.getBoundingClientRect();
      if (lastRect.right > trackRect.right) break;

      const clone = baseSpan.cloneNode(true);
      clone.removeAttribute("id"); // niente duplicati
      clone.setAttribute("aria-hidden", "true"); // accessibilità
      track.appendChild(clone);

      const lastX = Number(last.dataset.x || "0");
      const nextX = lastX + lastRect.width;
      setSpanX(clone, nextX);

      spans.push(clone);
    }
  };

  const animate = () => {
    const trackRect = track.getBoundingClientRect();

    // muovi tutto a sinistra
    for (const span of spans) {
      const x = Number(span.dataset.x || "0") - SPEED;
      setSpanX(span, x);
    }

    // se serve, aggiungi cloni per riempire
    ensureFilled();

    // rimuovi quelli completamente usciti a sinistra (in modo sicuro)
    spans = spans.filter((span) => {
      const rect = span.getBoundingClientRect();
      const keep = rect.right >= trackRect.left;
      if (!keep && span !== baseSpan) span.remove();
      return keep || span === baseSpan;
    });

    raf = requestAnimationFrame(animate);
  };

  const startMarqueeWithBase = (span) => {
    stop();
    baseSpan = span;

    // prepara base
    baseSpan.style.position = "absolute";
    baseSpan.style.left = "0px";
    baseSpan.style.whiteSpace = "nowrap";

    setSpanX(baseSpan, 0);
    clearClones();
    ensureFilled();
    animate();
  };

  // ---------- wait for #text ----------
  const tryInit = () => {
    const found = track.querySelector("#text");
    if (found) startMarqueeWithBase(found);
    return Boolean(found);
  };

  // se già presente, parti subito
  if (tryInit()) return;

  // altrimenti osserva finché non viene creato
  const mo = new MutationObserver(() => {
    if (tryInit()) mo.disconnect();
  });

  mo.observe(track, { childList: true, subtree: true });

  // ---------- se cambia il testo di #text, ricrea cloni ----------
  const textObserver = new MutationObserver(() => {
    // se baseSpan esiste e cambia contenuto, reset (larghezza diversa)
    if (baseSpan) startMarqueeWithBase(baseSpan);
  });

  // appena troviamo baseSpan, attacchiamo anche questo observer
  const hookTextObserver = () => {
    const found = track.querySelector("#text");
    if (!found) return;
    textObserver.observe(found, {
      characterData: true,
      subtree: true,
      childList: true,
    });
  };

  // prova ora e poi quando appare
  hookTextObserver();
  mo.observe(track, { childList: true, subtree: true });

  // ---------- se resize (rotazione / viewport), ricalcola ----------
  const ro = new ResizeObserver(() => {
    if (baseSpan) startMarqueeWithBase(baseSpan);
  });
  ro.observe(container);
});
