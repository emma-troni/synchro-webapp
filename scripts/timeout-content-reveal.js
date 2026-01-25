// timeout-content-reveal.js
// Primo load: Header slide-down -> fade-in #recap .content
// In contemporanea al fade: step-reveal dei due SVG in
// #personal-measure-raggiera e #nation-measure-raggiera
// NON tocca SPA, NON osserva .active, NON anima altre view.

(function () {
  /* ======================
     GLOBAL TIMINGS (stile align)
  ====================== */
  const HEADER_DELAY = 0;

  const HEADER_REVEAL_DURATION = 600; // slide header
  const HEADER_PADDING = 120; // respiro dopo fine header

  const RECAP_FADE_DURATION = 600; // fade recap content
  const RECAP_FADE_DELAY_MIN = 0; // minimo (in più al delay calcolato)

  // SVG step-reveal (come align-content-reveal.js)
  const SEGMENT_STEP = 50;
  const SEGMENT_FADE = 80;

  let hasRevealed = false;
  let svgGuardObserver = null;

  /* ======================
     ELEMENTS
  ====================== */
  const html = document.documentElement;
  const header = document.querySelector("header");
  const recapContent = document.querySelector("#recap .content");

  const personalWrap = document.getElementById("personal-measure-raggiera");
  const nationWrap = document.getElementById("nation-measure-raggiera");

  /* ======================
     HELPERS
  ====================== */
  function reducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }

  /* ======================
     HEADER SLIDE DOWN (anti-scatti)
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

    el.style.transition = "none";
    el.style.opacity = "0";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
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
     SVG STEP-REVEAL (come align-content-reveal)
  ====================== */
  const PARTS_SELECTOR = "path, line, polyline, polygon, circle, rect, ellipse";

  function getVisibleParts(svg) {
    if (!svg) return [];
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

  function preparePartsOnce(parts) {
    parts.forEach((el) => {
      if (el._stepTimerIds) el._stepTimerIds.forEach((id) => clearTimeout(id));
      el._stepTimerIds = [];

      el.style.opacity = "0";
      el.style.transition = `opacity ${SEGMENT_FADE}ms linear`;
      el.style.willChange = "opacity";
      el.setAttribute("data-step-part", "1");
    });
  }

  // ritorna durata stimata (ms)
  function revealSvgPartsOnce(container) {
    if (!container) return 0;
    const svg = container.querySelector("svg");
    if (!svg) return 0;

    const parts = getVisibleParts(svg);
    if (!parts.length) return 0;

    if (reducedMotion()) {
      parts.forEach((el) => (el.style.opacity = "1"));
      return 0;
    }

    preparePartsOnce(parts);

    parts.forEach((el, i) => {
      const t = i * SEGMENT_STEP;
      const id = setTimeout(() => {
        el.style.opacity = "1";
      }, t);
      el._stepTimerIds.push(id);
    });

    return (parts.length - 1) * SEGMENT_STEP + SEGMENT_FADE;
  }

  // Prep immediato: se SVG già presente, spegne i tracciati (anti flash locale)
  function forceSvgPartsHiddenNow(container) {
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    svg.querySelectorAll(PARTS_SELECTOR).forEach((p) => {
      p.style.opacity = "0";
      p.style.transition = `opacity ${SEGMENT_FADE}ms linear`;
    });
  }

  // Guard: se gli SVG vengono iniettati dopo (svg-import async), mettili subito a opacity 0
  function startSvgGuardsForRecap() {
    if (svgGuardObserver) return;

    svgGuardObserver = new MutationObserver((muts) => {
      if (hasRevealed) return;

      for (const m of muts) {
        for (const n of m.addedNodes || []) {
          if (!(n instanceof Element)) continue;

          const svgs = [];
          if (n.matches?.("svg")) svgs.push(n);
          n.querySelectorAll?.("svg").forEach((s) => svgs.push(s));

          for (const svg of svgs) {
            const inPersonal = personalWrap && personalWrap.contains(svg);
            const inNation = nationWrap && nationWrap.contains(svg);
            if (!inPersonal && !inNation) continue;

            svg.querySelectorAll(PARTS_SELECTOR).forEach((p) => {
              p.style.opacity = "0";
              p.style.transition = `opacity ${SEGMENT_FADE}ms linear`;
            });
          }
        }
      }
    });

    svgGuardObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function stopSvgGuardsForRecap() {
    if (!svgGuardObserver) return;
    svgGuardObserver.disconnect();
    svgGuardObserver = null;
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
        // Fade del contenuto recap
        showFade(recapContent, RECAP_FADE_DURATION);

        // Step-reveal SVG (in contemporanea al fade)
        // (partono entrambi nello stesso momento)
        revealSvgPartsOnce(personalWrap);
        revealSvgPartsOnce(nationWrap);

        // Ora che la sequenza è partita, possiamo fermare i guard
        stopSvgGuardsForRecap();
      }, delayToRecap);
    }, HEADER_DELAY);
  }

  /* ======================
     INIT
     - prepara solo ciò che ci serve
     - espone window.revealGraphics per il loader
  ====================== */
  function init() {
    prepHeaderHidden(header);
    prepFadeHidden(recapContent);

    // anti-flash locale per i due SVG del recap (se già importati)
    forceSvgPartsHiddenNow(personalWrap);
    forceSvgPartsHiddenNow(nationWrap);

    // se arrivano dopo, li spegniamo subito
    startSvgGuardsForRecap();

    // il loader chiamerà questa
    window.revealGraphics = revealFirstLoad;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
