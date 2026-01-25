// Staged reveal animations for internal-graphic and external-graphic
// Triggers when #more-about-personal loses "active" class for the first time

(function () {
  const HEADER_DELAY = 0;
  const INTERNAL_DELAY = 400;
  const EXTERNAL_DELAY = 1400;
  const COMMENT_DELAY = 1000;

  const REVEAL_DURATION = 600;
  const SEGMENT_TRANSITION_DURATION = 800;

  let hasRevealed = false;

  const header = document.querySelector("header"); // ✅ HEADER

  const internalGraphic = document.querySelector(".internal-graphic");
  const externalGraphic = document.querySelector(".external-graphic");

  const personalValueBtn = document.getElementById("personal-value-btn");
  const countryValueBtn = document.getElementById("country-value-btn");

  const scrollContainer = document.getElementById("scroll-container");

  const commentContent = document.querySelector(
    ".comment-section-wrap .comment-content",
  );

  /* --------------------------
     INIT VISIBILITY
  -------------------------- */

  function hideFade(el) {
    if (!el) return;

    el.style.opacity = "0";
    el.style.transition = `opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  function hideSlideDown(el) {
    if (!el) return;

    el.style.opacity = "0";
    el.style.transform = "translateY(-30px)";

    el.style.transition = `
      opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
      transform ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)
    `;
  }

  /* Nascondi inizialmente */

  hideSlideDown(header); // ✅ slide dall’alto

  hideFade(internalGraphic);
  hideFade(externalGraphic);

  hideFade(personalValueBtn);
  hideFade(countryValueBtn);

  hideFade(scrollContainer);
  hideFade(commentContent);

  /* --------------------------
     SVG SEGMENTS
  -------------------------- */

  function setupSegmentTransitions() {
    const containers = [internalGraphic, externalGraphic].filter(Boolean);

    containers.forEach((container) => {
      const segments = container.querySelectorAll("polygon, rect, path");

      segments.forEach((segment) => {
        segment.style.fillOpacity = "0.1";
        segment.style.transition = `fill-opacity ${SEGMENT_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      });
    });
  }

  /* --------------------------
     REVEAL SEQUENCE
  -------------------------- */

  function revealGraphics() {
    if (hasRevealed) return;
    hasRevealed = true;

    /* ======================
       STEP 0 — HEADER
    ====================== */

    setTimeout(() => {
      if (header) {
        header.style.opacity = "1";
        header.style.transform = "translateY(0)";
      }

      /* ======================
         STEP 1 — Internal + Personal
      ====================== */

      setTimeout(() => {
        if (internalGraphic) internalGraphic.style.opacity = "1";
        if (personalValueBtn) personalValueBtn.style.opacity = "1";

        /* ======================
           STEP 2 — External + Country
        ====================== */

        setTimeout(() => {
          if (externalGraphic) externalGraphic.style.opacity = "1";
          if (countryValueBtn) countryValueBtn.style.opacity = "1";

          /* ======================
             STEP 3 — Comment + Scroll
          ====================== */

          setTimeout(() => {
            if (commentContent) commentContent.style.opacity = "1";
            if (scrollContainer) scrollContainer.style.opacity = "1";
          }, COMMENT_DELAY);
        }, EXTERNAL_DELAY);
      }, INTERNAL_DELAY);
    }, HEADER_DELAY);
  }

  /* --------------------------
     OBSERVER
  -------------------------- */

  function setupMoreAboutObserver() {
    const moreAboutSection = document.getElementById("more-about-personal");

    if (!moreAboutSection) {
      window.revealGraphics = revealGraphics;
      return;
    }

    const wasActive = moreAboutSection.classList.contains("active");

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

  /* --------------------------
     INIT
  -------------------------- */

  function init() {
    setupSegmentTransitions();
    setupMoreAboutObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.GRAPHIC_REVEAL_CONFIG = {
    SEGMENT_TRANSITION_DURATION,
  };
})();
