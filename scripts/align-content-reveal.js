// Staged reveal animations for internal-graphic and external-graphic
// Triggers when #more-about-personal loses "active" class for the first time

(function () {
  const INTERNAL_DELAY = 400; // delay prima che la internal-graphic appaia (ms)
  const EXTERNAL_DELAY = 1400; // dopo internal appaia che external appaia (ms)
  const COMMENT_DELAY = 1000; // dopo raggiera esterna prima di comment (ms)
  const REVEAL_DURATION = 600; // durata delle animazioni (ms)
  const SEGMENT_TRANSITION_DURATION = 800; // DURATA ill-opacity svgs (ms)

  let hasRevealed = false; // ensures animation only runs once

  const internalGraphic = document.querySelector(".internal-graphic");
  const externalGraphic = document.querySelector(".external-graphic");
  const personalValueBtn = document.getElementById("personal-value-btn");
  const countryValueBtn = document.getElementById("country-value-btn");
  const commentContent = document.querySelector(
    ".comment-section-wrap .comment-content"
  );

  // Hide graphics initially
  if (internalGraphic) {
    internalGraphic.style.opacity = "0";
    internalGraphic.style.transition = `opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  if (externalGraphic) {
    externalGraphic.style.opacity = "0";
    externalGraphic.style.transition = `opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  // Hide value buttons initially
  if (personalValueBtn) {
    personalValueBtn.style.opacity = "0";
    personalValueBtn.style.transition = `opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  if (countryValueBtn) {
    countryValueBtn.style.opacity = "0";
    countryValueBtn.style.transition = `opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  // Hide comment content initially
  if (commentContent) {
    commentContent.style.opacity = "0";
    commentContent.style.transition = `opacity ${REVEAL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
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
      // Reveal internal graphic + personal button together
      if (internalGraphic) {
        internalGraphic.style.opacity = "1";
      }
      if (personalValueBtn) {
        personalValueBtn.style.opacity = "1";
      }

      setTimeout(() => {
        // Reveal external graphic + country button together
        if (externalGraphic) {
          externalGraphic.style.opacity = "1";
        }
        if (countryValueBtn) {
          countryValueBtn.style.opacity = "1";
        }

        // Reveal comment content after external graphic
        setTimeout(() => {
          if (commentContent) {
            commentContent.style.opacity = "1";
          }
        }, COMMENT_DELAY);
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
