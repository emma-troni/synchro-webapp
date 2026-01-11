// Staged reveal animations for internal-graphic and external-graphic
// + SVG segment transition setup

(function () {
  const INTERNAL_DELAY = 400; // delay before internal-graphic appears (ms)
  const EXTERNAL_DELAY = 1500; // delay after internal starts before external appears (ms)
  const REVEAL_DURATION = 600; // duration of reveal animation (ms)
  const SEGMENT_TRANSITION_DURATION = 800; // duration for fill-opacity changes (ms)

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

  // Setup SVG segment transitions after DOM is ready
  function setupSegmentTransitions() {
    const containers = [internalGraphic, externalGraphic].filter(Boolean);

    containers.forEach((container) => {
      // Find all polygon/rect elements that will have fill-opacity animated
      const segments = container.querySelectorAll("polygon, rect, path");
      segments.forEach((segment) => {
        // Set initial opacity to a "loading" state (dim)
        segment.style.fillOpacity = "0.1";
        // Add transition for smooth fill-opacity changes
        segment.style.transition = `fill-opacity ${SEGMENT_TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      });
    });
  }

  // Run setup when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupSegmentTransitions);
  } else {
    setupSegmentTransitions();
  }

  // Expose reveal function globally for load-page scripts to call
  window.revealGraphics = function () {
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
  };

  // Expose config for score-svg-display.js to use
  window.GRAPHIC_REVEAL_CONFIG = {
    SEGMENT_TRANSITION_DURATION: SEGMENT_TRANSITION_DURATION,
  };
})();
