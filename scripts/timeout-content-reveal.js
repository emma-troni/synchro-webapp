// timeout-content-reveal.js
// SOLO primo load: Header slide-down -> fade-in #recap .content
// NON tocca SPA, NON osserva .active, NON anima altre view
// IMPORTANT: sul recap non forza "visibility" e ripulisce gli inline styles dopo il fade.

(function () {
  /* ======================
     GLOBAL TIMINGS (stile align)
  ====================== */
  const HEADER_DELAY = 0;

  const HEADER_REVEAL_DURATION = 600; // slide header
  const HEADER_PADDING = 120; // respiro dopo fine header

  const RECAP_FADE_DURATION = 600; // fade recap content
  const RECAP_FADE_DELAY_MIN = 0; // minimo (in più al delay calcolato)

  let hasRevealed = false;

  /* ======================
     ELEMENTS
  ====================== */
  const html = document.documentElement;
  const header = document.querySelector("header");
  const recapContent = document.querySelector("#recap .content");

  /* ======================
     HELPERS
  ====================== */
  function reducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }

  /* ======================
     HEADER SLIDE DOWN (anti-scatti)
     - header può usare visibility perché deve rimanere sempre visibile dopo
  ====================== */
  function prepHeaderHidden(el) {
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = "translateY(-30px)";
    el.style.willChange = "transform";
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
  }

  function showHeaderSlideDown(el) {
    if (!el) return;

    if (reducedMotion()) {
      el.style.transition = "none";
      el.style.visibility = "visible";
      el.style.pointerEvents = "auto";
      el.style.transform = "translateY(0)";
      return;
    }

    el.style.transition = "none";
    el.style.visibility = "visible";
    el.style.pointerEvents = "auto";
    el.style.transform = "translateY(-30px)";

    // doppio rAF: evita lo “scatto”
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `transform ${HEADER_REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        el.style.transform = "translateY(0)";
      });
    });
  }

  /* ======================
     RECAP FADE (one-shot, no SPA interference)
     - NON usare visibility qui
     - cleanup inline styles a fine animazione
  ====================== */
  function prepFadeHidden(el) {
    if (!el) return;
    el.style.transition = "none";
    el.style.opacity = "0";
    // NON forzare visibility: deve restare sotto controllo SPA/CSS
    el.style.willChange = "opacity";
  }

  function showFade(el, duration) {
    if (!el) return;

    const cleanup = () => {
      // Ripulisce inline styles: dopo il primo reveal, la SPA torna a comandare tutto
      el.style.removeProperty("transition");
      el.style.removeProperty("opacity");
      el.style.removeProperty("will-change");
    };

    if (reducedMotion()) {
      el.style.transition = "none";
      el.style.opacity = "1";
      cleanup();
      return;
    }

    // stato iniziale
    el.style.transition = "none";
    el.style.opacity = "0";

    // anima al frame successivo
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // ascolta la fine della transizione per pulire (una sola volta)
        const onEnd = (e) => {
          if (e.propertyName === "opacity") cleanup();
          el.removeEventListener("transitionend", onEnd);
        };
        el.addEventListener("transitionend", onEnd);

        el.style.transition = `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        el.style.opacity = "1";
      });
    });
  }

  /* ======================
     REVEAL SEQUENCE (chiamata dal loader)
  ====================== */
  function revealFirstLoad() {
    if (hasRevealed) return;
    hasRevealed = true;

    // sblocca il gate CSS SOLO ora (niente flash)
    html.classList.add("reveal-ready");

    // 1) header
    setTimeout(() => {
      showHeaderSlideDown(header);

      // 2) recap content dopo FINE header (stile align: max(min, duration+padding))
      const delayToRecap = Math.max(
        RECAP_FADE_DELAY_MIN,
        HEADER_REVEAL_DURATION + HEADER_PADDING,
      );

      setTimeout(() => {
        showFade(recapContent, RECAP_FADE_DURATION);
      }, delayToRecap);
    }, HEADER_DELAY);
  }

  /* ======================
     INIT
     - prepara solo ciò che ci serve (header + recap content)
     - espone window.revealGraphics per il loader
  ====================== */
  function init() {
    // NON aggiungere reveal-ready qui.
    // Rimane nascosto finché il loader non chiama revealGraphics().
    prepHeaderHidden(header);
    prepFadeHidden(recapContent);

    // il loader chiamerà questa
    window.revealGraphics = revealFirstLoad;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
