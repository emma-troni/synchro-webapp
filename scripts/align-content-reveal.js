// align-content-reveal.js
// Header -> Internal(svg step reveal) + personal @50% -> External(svg step reveal) + country @50% -> Comment + Scroll
// Fix FLASH: NON aggiunge reveal-ready finché non parte la sequenza + observer per SVG import async

(function () {
  /* ======================
     GLOBAL TIMINGS
  ====================== */
  const HEADER_DELAY = 10;

  const INTERNAL_DELAY = 500;
  const EXTERNAL_DELAY_MIN = 1000;
  const COMMENT_DELAY_MIN = 650;

  const REVEAL_DURATION = 600;

  // SVG step-reveal (più veloce)
  const SEGMENT_STEP = 40;
  const SEGMENT_FADE = 80;
  const SEGMENT_PADDING = 220;

  let hasRevealed = false;
  let guardObserver = null;

  const GAP_AFTER_INTERNAL = 300; // ms extra prima di mostrare EXTERNAL
  const GAP_AFTER_EXTERNAL = 500; // ms extra prima di mostrare COMMENT/SCROLL

  /* ======================
     ELEMENTS
  ====================== */
  const header = document.querySelector("header");

  const internalGraphic = document.querySelector(".internal-graphic");
  const externalGraphic = document.querySelector(".external-graphic");

  const personalValueBtn = document.getElementById("personal-value-btn");
  const countryValueBtn = document.getElementById("country-value-btn");

  const scrollContainer = document.getElementById("scroll-container");
  const commentContent = document.querySelector(
    ".comment-section-wrap .comment-content",
  );

  // ✅ ADD 1/3: prendi SOLO la more-about inline dentro #alignment
  const moreAboutInline = document.querySelector("#alignment .more-about");

  /* ======================
     HELPERS
  ====================== */
  function reducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }

  function hideFade(el) {
    if (!el) return;
    el.style.opacity = "0";
    el.style.visibility = "hidden";
    el.style.transition = `opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  function showFade(el) {
    if (!el) return;
    el.style.visibility = "visible";
    el.style.opacity = "1";
  }

  function hideSlideDown(el) {
    if (!el) return;

    // Imposta lo stato "nascosto" SENZA transizione (così non anima in uscita)
    el.style.transition = "none";
    el.style.transform = "translateY(-30px)";
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    el.style.willChange = "transform";
  }

  function showSlideDown(el) {
    if (!el) return;

    // 1) rendilo visibile ma ancora nella posizione iniziale
    el.style.visibility = "visible";
    el.style.pointerEvents = "auto";

    // Assicurati che sia ancora "su" e senza transition in questo frame
    el.style.transition = "none";
    el.style.transform = "translateY(-30px)";

    // 2) nel frame successivo attiva la transizione e scendi
    requestAnimationFrame(() => {
      el.style.transition = `transform ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      el.style.transform = "translateY(0)";
    });
  }

  // Internal/External: niente dissolvenza del blocco
  function hideInstant(el) {
    if (!el) return;
    el.style.transition = "none";
    el.style.opacity = "0";
    el.style.visibility = "hidden";
  }

  function showInstant(el) {
    if (!el) return;
    el.style.transition = "none";
    el.style.visibility = "visible";
    el.style.opacity = "1";
  }

  /* ======================
     SVG STEP-REVEAL (ONCE)
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

  // durata stimata (ms)
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

  /* ======================
     HARD HIDE while waiting (anti-flash)
     - Questo lavora PRIMA che venga aggiunto reveal-ready
     - e si riapplica quando arrivano SVG async
  ====================== */
  function hardHideEverything() {
    // NON aggiungere reveal-ready qui: deve restare tutto “bloccato” dal CSS fino al trigger
    hideSlideDown(header);

    hideInstant(internalGraphic);
    hideInstant(externalGraphic);

    hideFade(personalValueBtn);
    hideFade(countryValueBtn);

    hideFade(commentContent);
    hideFade(scrollContainer);

    // ✅ ADD 2/3: nascondi anche la more-about inline
    hideFade(moreAboutInline);

    // Se gli SVG sono già stati importati, spegni i tracciati subito
    [internalGraphic, externalGraphic].forEach((wrap) => {
      const svg = wrap?.querySelector?.("svg");
      if (!svg) return;
      const parts = Array.from(svg.querySelectorAll(PARTS_SELECTOR));
      parts.forEach((p) => {
        p.style.opacity = "0";
        p.style.transition = `opacity ${SEGMENT_FADE}ms linear`;
      });
    });
  }

  // Observer che intercetta SVG importati/iniettati dopo e li rimette a opacity:0 immediatamente
  function startSvgGuards() {
    if (guardObserver) return;

    guardObserver = new MutationObserver((muts) => {
      if (hasRevealed) return;

      for (const m of muts) {
        // intercetta nodi aggiunti (SVG import async)
        for (const n of m.addedNodes || []) {
          if (!(n instanceof Element)) continue;

          // Se è un SVG o contiene SVG dentro internal/external: spegni tutto
          const candidates = [];

          if (n.matches?.("svg")) candidates.push(n);
          n.querySelectorAll?.("svg").forEach((s) => candidates.push(s));

          candidates.forEach((svg) => {
            // Solo se appartiene a internal/external
            const inInternal = internalGraphic && internalGraphic.contains(svg);
            const inExternal = externalGraphic && externalGraphic.contains(svg);
            if (!inInternal && !inExternal) return;

            svg.querySelectorAll(PARTS_SELECTOR).forEach((p) => {
              p.style.opacity = "0";
              p.style.transition = `opacity ${SEGMENT_FADE}ms linear`;
            });
          });

          // In più: se qualcuno “tocca” gli wrapper, rimetti hidden
          if (internalGraphic && internalGraphic.contains(n))
            hideInstant(internalGraphic);
          if (externalGraphic && externalGraphic.contains(n))
            hideInstant(externalGraphic);
        }
      }
    });

    guardObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function stopSvgGuards() {
    if (!guardObserver) return;
    guardObserver.disconnect();
    guardObserver = null;
  }

  /* ======================
     REVEAL SEQUENCE
  ====================== */
  function revealGraphics() {
    if (hasRevealed) return;
    hasRevealed = true;

    // Sblocca il gate CSS SOLO ORA (così niente flash quando sparisce il loader)
    document.documentElement.classList.add("reveal-ready");

    // Ora che siamo in animazione, possiamo fermare i guard
    stopSvgGuards();

    // 1) HEADER
    setTimeout(() => {
      showSlideDown(header);

      // 2) INTERNAL + PERSONAL (@50% svg)
      setTimeout(() => {
        showInstant(internalGraphic);

        const internalSvgDuration = revealSvgPartsOnce(internalGraphic);
        const internalHalf =
          internalSvgDuration > 0 ? Math.round(internalSvgDuration * 0.5) : 0;

        setTimeout(() => showFade(personalValueBtn), internalHalf);

        const delayToExternal = Math.max(
          EXTERNAL_DELAY_MIN,
          internalSvgDuration + SEGMENT_PADDING + GAP_AFTER_INTERNAL,
        );

        // 3) EXTERNAL + COUNTRY (@50% svg)
        setTimeout(() => {
          showInstant(externalGraphic);

          const externalSvgDuration = revealSvgPartsOnce(externalGraphic);
          const externalHalf =
            externalSvgDuration > 0 ? Math.round(externalSvgDuration * 0.5) : 0;

          setTimeout(() => showFade(countryValueBtn), externalHalf);

          const delayToComment = Math.max(
            COMMENT_DELAY_MIN,
            externalSvgDuration + SEGMENT_PADDING + GAP_AFTER_EXTERNAL,
          );

          // 4) COMMENT + SCROLL (+ MORE-ABOUT INLINE)
          setTimeout(() => {
            showFade(commentContent);
            showFade(scrollContainer);

            // ✅ ADD 3/3: compari ESATTAMENTE con la comment-section
            showFade(moreAboutInline);
          }, delayToComment);
        }, delayToExternal);
      }, INTERNAL_DELAY);
    }, HEADER_DELAY);
  }

  /* ======================
     OBSERVER TRIGGER
  ====================== */
  function setupMoreAboutObserver() {
    const moreAboutSection = document.getElementById("more-about-personal");

    if (!moreAboutSection) {
      window.revealGraphics = revealGraphics;
      return;
    }

    const wasActive = moreAboutSection.classList.contains("active");

    // se non è attivo, puoi chiamare revealGraphics manualmente
    if (!wasActive) {
      window.revealGraphics = revealGraphics;
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const isNowActive = moreAboutSection.classList.contains("active");
          if (!isNowActive && !hasRevealed) {
            revealGraphics();
            observer.disconnect();
            break;
          }
        }
      }
    });

    observer.observe(moreAboutSection, { attributes: true });

    window.revealGraphics = function () {
      if (!moreAboutSection.classList.contains("active")) {
        revealGraphics();
        observer.disconnect();
      }
    };
  }

  /* ======================
     INIT
  ====================== */
  function init() {
    // IMPORTANT: NON aggiungere reveal-ready qui.
    // Resta tutto nascosto finché non parte revealGraphics().
    hardHideEverything();
    startSvgGuards();
    setupMoreAboutObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
