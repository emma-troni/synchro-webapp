// Staged reveal animations for internal-graphic and external-graphic
// Triggers when #more-about-personal loses "active" class for the first time

(function () {
  const INTERNAL_DELAY = 400; // delay before internal-graphic appears (ms)
  const EXTERNAL_DELAY = 1500; // delay after internal starts before external appears (ms)
  const REVEAL_DURATION = 600; // duration of reveal animation (ms)
  const SEGMENT_TRANSITION_DURATION = 800; // duration for fill-opacity changes (ms)

  let hasRevealed = false; // ensures animation only runs once

  const internalGraphic = document.querySelector(".internal-graphic");
  const externalGraphic = document.querySelector(".external-graphic");

  // Hide graphics initially
  if (internalGraphic) {
    internalGraphic.style.opacity = "0";
    internalGraphic.style.transition = `opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  if (externalGraphic) {
    externalGraphic.style.opacity = "0";
    externalGraphic.style.transition = `opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  // Setup SVG segment transitions
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

  // Reveal animation function
  function revealGraphics() {
    if (hasRevealed) return;
    hasRevealed = true;

    setTimeout(() => {
      if (internalGraphic) {
        internalGraphic.style.opacity = "1";
      }

      setTimeout(() => {
        if (externalGraphic) {
          externalGraphic.style.opacity = "1";
        }
      }, EXTERNAL_DELAY);
    }, INTERNAL_DELAY);
  }

  // Watch for #more-about-personal losing "active" class
  function setupMoreAboutObserver() {
    const moreAboutSection = document.getElementById("more-about-personal");

    if (!moreAboutSection) {
      // Section not found - fallback to immediate reveal after loader
      window.revealGraphics = revealGraphics;
      return;
    }

    // Check if section is currently active
    const wasActive = moreAboutSection.classList.contains("active");

    if (!wasActive) {
      // Section already not active - reveal immediately (after loader calls us)
      window.revealGraphics = revealGraphics;
      return;
    }

    // Section is active - watch for class changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const isNowActive = moreAboutSection.classList.contains("active");

          if (!isNowActive && !hasRevealed) {
            // Section just lost "active" class - trigger reveal
            revealGraphics();
            observer.disconnect();
            break;
          }
        }
      }
    });

    observer.observe(moreAboutSection, { attributes: true });

    // Expose a no-op for loader (actual reveal happens via observer)
    window.revealGraphics = function () {
      // Loader finished - but we wait for more-about to close
      // If more-about is not active at this point, reveal now
      if (!moreAboutSection.classList.contains("active")) {
        revealGraphics();
        observer.disconnect();
      }
    };
  }

  // Initialize when DOM is ready
  function init() {
    setupSegmentTransitions();
    setupMoreAboutObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose config for score-svg-display.js
  window.GRAPHIC_REVEAL_CONFIG = {
    SEGMENT_TRANSITION_DURATION: SEGMENT_TRANSITION_DURATION,
  };
})();
