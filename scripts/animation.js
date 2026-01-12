/* ================================
   UNIVERSAL HIGHLIGHT SWEEP
   - Metti .hl-sweep sugli span
   - Il contenitore diventa "open" quando ha .active (default)
================================ */

(function () {
  // 1) Contenitori che, quando diventano "attivi", devono triggerare l'animazione
  //    Nel tuo progetto: .view è perfetto
  const CONTAINER_SELECTOR = ".view";

  // 2) Regola per dire "questo container è aperto/visibile"
  //    Default: presenza della classe .active
  const isOpen = (el) => el.classList.contains("active");

  // 3) Target dentro al container
  const TARGET_SELECTOR = ".hl-sweep";

  function resetTargets(container) {
    container.querySelectorAll(TARGET_SELECTOR).forEach((t) => {
      t.classList.remove("hl-animating");
    });
  }

  function playTargets(container) {
    const targets = container.querySelectorAll(TARGET_SELECTOR);
    if (!targets.length) return;

    // reset -> reflow -> play (ri-trigger affidabile)
    targets.forEach((t) => t.classList.remove("hl-animating"));
    void container.offsetHeight;
    targets.forEach((t) => t.classList.add("hl-animating"));
  }

  // Stato precedente per evitare loop (come abbiamo fatto prima)
  const state = new WeakMap();

  function initContainer(container) {
    state.set(container, isOpen(container));

    // se parte già aperto
    if (isOpen(container)) playTargets(container);

    const obs = new MutationObserver(() => {
      const prev = state.get(container);
      const now = isOpen(container);

      if (now !== prev) {
        state.set(container, now);
        if (now) playTargets(container);
        else resetTargets(container);
      }
    });

    obs.observe(container, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  document.querySelectorAll(CONTAINER_SELECTOR).forEach(initContainer);
})();

/* ================================
   WAITING SVG – step reveal all, then step hide all (infinite)
   target: svg dentro #waiting (o fallback .wait)

   animazione loader pagina RECAP LOCK
================================ */

(function () {
  const ROOT_SELECTOR = "#waiting, .wait";
  const PARTS_SELECTOR = "path, line, polyline, polygon, circle, rect, ellipse";

  // timing (ms)
  const STEP = 140; // quanto tempo tra un elemento e il successivo
  const FADE = 110; // durata fade (0->1 o 1->0)
  const HOLD_ALL_ON = 350; // pausa quando sono tutti a 1
  const HOLD_ALL_OFF = 0; // pausa quando sono tutti a 0 prima di ripartire

  function reducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }

  function getParts(svg) {
    return Array.from(svg.querySelectorAll(PARTS_SELECTOR)).filter((el) => {
      const style = getComputedStyle(el);
      const visibleByFill =
        style.fill && style.fill !== "none" && style.fill !== "transparent";
      const visibleByStroke =
        style.stroke &&
        style.stroke !== "none" &&
        style.stroke !== "transparent";
      return visibleByFill || visibleByStroke;
    });
  }

  function prepareParts(parts) {
    parts.forEach((el) => {
      // stop eventuali animazioni vecchie
      if (el._waitingAnim) {
        try {
          el._waitingAnim.cancel();
        } catch (_) {}
        el._waitingAnim = null;
      }
      el.style.opacity = "0";
      el.setAttribute("data-wait-part", "1");
    });
  }

  function animate(svg) {
    if (!svg || svg._waitingInit) return;
    svg._waitingInit = true;

    const parts = getParts(svg);

    // se davvero vuoi SOLO 24, puoi forzare:
    // const parts = getParts(svg).slice(0, 24);

    if (!parts.length) return;

    if (reducedMotion()) {
      parts.forEach((el) => (el.style.opacity = "1"));
      return;
    }

    prepareParts(parts);

    const n = parts.length;

    const revealTotal = (n - 1) * STEP + FADE; // finisce quando l'ultimo ha completato fade-in
    const hideStart = revealTotal + HOLD_ALL_ON; // inizio fase hide
    const hideTotal = hideStart + (n - 1) * STEP + FADE;
    const cycle = hideTotal; // chiude esattamente a opacity 0

    parts.forEach((el, i) => {
      const tRevealStart = i * STEP;
      const tRevealEnd = tRevealStart + FADE;

      const tHideStart = hideStart + i * STEP;
      const tHideEnd = tHideStart + FADE;

      // keyframes con offset normalizzati (0..1) sul ciclo totale
      const kf = [
        // tutto off all'inizio
        { opacity: 0, offset: 0 },

        // resta off fino al suo reveal
        { opacity: 0, offset: tRevealStart / cycle },

        // fade-in
        { opacity: 1, offset: tRevealEnd / cycle },

        // resta ON fino al suo hide
        { opacity: 1, offset: tHideStart / cycle },

        // fade-out
        { opacity: 0, offset: tHideEnd / cycle },

        // resta off fino a fine ciclo
        { opacity: 0, offset: 1 },
      ];

      el._waitingAnim = el.animate(kf, {
        duration: cycle,
        iterations: Infinity,
        easing: "linear",
        fill: "both",
      });
    });
  }

  function tryInit() {
    const root = document.querySelector(ROOT_SELECTOR);
    if (!root) return;
    const svg = root.querySelector("svg");
    if (svg) animate(svg);
  }

  // init + osserva import asincrono SVG
  document.addEventListener("DOMContentLoaded", tryInit);
  const obs = new MutationObserver(() => tryInit());
  obs.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // fallback
  setTimeout(tryInit, 200);
  setTimeout(tryInit, 800);
})();
