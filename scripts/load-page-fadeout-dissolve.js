// scripts/load-page-fadeout.js VERSIONE DISSOLVENZA

(function () {
  const MIN_DURATION = 2000; // 2 secondi
  const FADE_DURATION = 600; // durata dissolvenza (ms)

  const loadPage = document.getElementById("load-page");
  if (!loadPage) return;

  const startTime = performance.now();

  // prepara stato iniziale (nel caso non sia già in CSS)
  loadPage.style.opacity = "1";
  loadPage.style.transition = `opacity ${FADE_DURATION}ms ease-out`;

  function tryHideLoader() {
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, MIN_DURATION - elapsed);

    setTimeout(() => {
      // dissolve
      loadPage.style.opacity = "0";

      // cleanup finale
      setTimeout(() => {
        loadPage.style.pointerEvents = "none";
        loadPage.remove();
        // Trigger per iniziare animazione degli svg pagina align (align-svgs-reveal.js)
        if (typeof window.revealGraphics === "function") {
          window.revealGraphics();
        }
      }, FADE_DURATION);
    }, remaining);
  }

  // aspetta che TUTTO il body sia caricato (img, svg, font, ecc.)
  if (document.readyState === "complete") {
    tryHideLoader();
  } else {
    window.addEventListener("load", tryHideLoader, { once: true });
  }
})();
