// marquee.js — usa lo span #text (generato da altri script) e rimuove eventuali #text duplicati fuori dal marquee
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
    spans.forEach((s) => {
      if (s !== baseSpan) s.remove();
    });
    spans = baseSpan ? [baseSpan] : [];
  };

  const setSpanX = (span, x) => {
    span.dataset.x = String(x);
    // mantieni anche la Y del CSS (top:50% + translateY(-50%))
    span.style.transform = `translate(${x}px, -50%)`;
  };

  const removeOtherTextNodes = () => {
    // se esistono altri #text fuori dal track, eliminali
    const all = document.querySelectorAll("#text");
    all.forEach((el) => {
      if (el !== baseSpan) el.remove();
    });
  };

  const ensureFilled = () => {
    if (!baseSpan) return;

    const trackRect = track.getBoundingClientRect();

    while (true) {
      const last = spans[spans.length - 1];
      const lastRect = last.getBoundingClientRect();
      if (lastRect.right > trackRect.right) break;

      const clone = baseSpan.cloneNode(true);
      clone.removeAttribute("id"); // niente id duplicati
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);

      const lastX = Number(last.dataset.x || "0");
      const nextX = lastX + lastRect.width;
      setSpanX(clone, nextX);

      spans.push(clone);
    }
  };

  const animate = () => {
    const trackRect = track.getBoundingClientRect();

    for (const span of spans) {
      const x = Number(span.dataset.x || "0") - SPEED;
      setSpanX(span, x);
    }

    ensureFilled();

    // rimuovi quelli usciti a sinistra (tranne baseSpan)
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

    // se il base non sta dentro il track, spostalo dentro (così non rimane “sopra”)
    if (span.parentElement !== track) {
      track.appendChild(span);
    }

    baseSpan = span;

    // prepara base (coerente con il CSS .track span)
    baseSpan.style.position = "absolute";
    baseSpan.style.top = "50%";
    baseSpan.style.left = "0";
    baseSpan.style.whiteSpace = "nowrap";

    setSpanX(baseSpan, 0);
    clearClones();

    // elimina eventuali #text “orfani” fuori dal marquee
    removeOtherTextNodes();

    ensureFilled();
    animate();
  };

  // ---------- init: trova #text ovunque, poi lo usa come base ----------
  const tryInit = () => {
    // prima prova dentro il track (caso ideale)
    let found = track.querySelector("#text");

    // se non c’è, prova a prenderlo dalla pagina (può essere creato fuori e poi lasciato lì)
    if (!found) found = document.querySelector("#text");

    if (found) startMarqueeWithBase(found);
    return Boolean(found);
  };

  // se già presente, parti subito
  if (tryInit()) return;

  // altrimenti osserva finché non viene creato
  const mo = new MutationObserver(() => {
    if (tryInit()) mo.disconnect();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // ---------- se cambia il contenuto del baseSpan, reset (larghezza diversa) ----------
  const textObserver = new MutationObserver(() => {
    if (baseSpan) startMarqueeWithBase(baseSpan);
  });

  const hookTextObserver = () => {
    if (!baseSpan) return;
    textObserver.disconnect();
    textObserver.observe(baseSpan, {
      characterData: true,
      subtree: true,
      childList: true,
    });
  };

  // aggancia l’observer appena parte
  const ro = new ResizeObserver(() => {
    if (baseSpan) startMarqueeWithBase(baseSpan);
  });
  ro.observe(container);

  // piccolo hook: quando baseSpan viene settato, attacca observer testo
  const baseHook = new MutationObserver(() => {
    if (baseSpan) {
      hookTextObserver();
      baseHook.disconnect();
    }
  });
  baseHook.observe(document.body, { childList: true, subtree: true });
});
