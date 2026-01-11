// Staged reveal animations for internal-graphic and external-graphic

(function () {
  const INTERNAL_DELAY = 400; // delay before internal-graphic appears (ms)
  const EXTERNAL_DELAY = 1500; // delay after internal starts before external appears (ms)
  const REVEAL_DURATION = 600; // duration of reveal animation (ms)

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

  // Expose reveal function globally for load-page-fadeout to call
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
})();
