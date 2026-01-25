// load-page-fadeout-dissolve.js
(function () {
  // TIMING
  const LOGO_IN_DELAY = 500; // 0.5s
  const LOGO_IN_DURATION = 700;

  const POWER_IN_DELAY_AFTER_LOGO = 180;
  const POWER_IN_DURATION = 650;

  const WAIT_AFTER_POWERED_IN = 1500; // 1.5s
  const PAGE_FADE_DURATION = 600;

  const loadPage = document.getElementById("load-page");
  if (!loadPage) return;

  // anti-flash: dichiara subito che il loader è pronto (abilita transition da CSS)
  // così non c'è nessun frame in cui logo/powered-by appaiono "normali"
  loadPage.classList.add("is-ready");

  // dissolve ready
  loadPage.style.opacity = "1";
  loadPage.style.transition = `opacity ${PAGE_FADE_DURATION}ms ease-out`;

  function removeLoader() {
    loadPage.style.opacity = "0";
    setTimeout(() => {
      loadPage.style.pointerEvents = "none";
      loadPage.remove();
      if (typeof window.revealGraphics === "function") window.revealGraphics();
    }, PAGE_FADE_DURATION);
  }

  function startSequence() {
    // 1) logo in
    setTimeout(() => {
      loadPage.classList.add("is-logo-in");
    }, LOGO_IN_DELAY);

    // 2) powered-by in
    const powerInAt =
      LOGO_IN_DELAY + LOGO_IN_DURATION + POWER_IN_DELAY_AFTER_LOGO;

    setTimeout(() => {
      loadPage.classList.add("is-powered-in");
    }, powerInAt);

    // 3) attesa 1.5s e poi fade/remove
    const fadeAt = powerInAt + POWER_IN_DURATION + WAIT_AFTER_POWERED_IN;
    setTimeout(removeLoader, fadeAt);
  }

  if (document.readyState === "complete") startSequence();
  else window.addEventListener("load", startSequence, { once: true });
})();
