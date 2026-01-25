// load-page-fadeout-dissolve.js
// Solo: attesa 2s -> dissolve loader -> remove -> revealGraphics()

(function () {
  const WAIT_BEFORE_FADE = 2000; // 2s
  const PAGE_FADE_DURATION = 600; // ms

  const loadPage = document.getElementById("load-page");
  if (!loadPage) return;

  // Loader visibile, nessuna animazione sugli svg
  loadPage.style.opacity = "1";
  loadPage.style.transition = `opacity ${PAGE_FADE_DURATION}ms ease-out`;

  function finish() {
    loadPage.style.opacity = "0";

    setTimeout(() => {
      loadPage.style.pointerEvents = "none";
      loadPage.remove();

      if (typeof window.revealGraphics === "function") {
        window.revealGraphics();
      }
    }, PAGE_FADE_DURATION);
  }

  function start() {
    setTimeout(finish, WAIT_BEFORE_FADE);
  }

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
})();
