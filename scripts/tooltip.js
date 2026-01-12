/* ================================
   TOOLTIP – GENERAL
   - configura sezioni via ID
   - testo diverso per ogni section
   - mostra quando la section diventa .active
   - auto-hide dopo 2s
================================ */

(function () {
  // ✅ CONFIG: aggiungi qui tutte le sezioni che vuoi
  const TOOLTIP_CONFIG = [
    { id: "more-about-personal", message: "scroll to continue reading" },
    { id: "more-about-world", message: "scroll" },
    // { id: "recap", message: "tap a score to open" },
    // { id: "stats", message: "swipe to compare" },
  ];

  const ACTIVE_CLASS = "active";
  const TOOLTIP_CLASS = "app-tooltip";
  const VISIBLE_CLASS = "is-visible";

  const SHOW_MS = 2000;
  const ANIM_MS = 400;

  let tooltipEl = null;
  let hideTimer = null;

  function ensureTooltipEl() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement("div");
    tooltipEl.className = TOOLTIP_CLASS;
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function clearTimers() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function showTooltip(message) {
    clearTimers();

    const el = ensureTooltipEl();
    el.textContent = message;

    // forza reflow per transizione affidabile
    void el.offsetHeight;
    el.classList.add(VISIBLE_CLASS);

    hideTimer = setTimeout(() => {
      hideTooltip();
    }, SHOW_MS);
  }

  function hideTooltip() {
    clearTimers();
    if (!tooltipEl) return;

    tooltipEl.classList.remove(VISIBLE_CLASS);

    // rimuovo dal DOM dopo la transizione (così non resta “fantasma”)
    setTimeout(() => {
      tooltipEl?.remove();
      tooltipEl = null;
    }, ANIM_MS);
  }

  function attachObserverToSection(sectionEl, message) {
    const observer = new MutationObserver(() => {
      const isActive = sectionEl.classList.contains(ACTIVE_CLASS);
      if (isActive) showTooltip(message);
      else hideTooltip();
    });

    observer.observe(sectionEl, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // se già attiva al load
    if (sectionEl.classList.contains(ACTIVE_CLASS)) {
      showTooltip(message);
    }
  }

  // init
  TOOLTIP_CONFIG.forEach(({ id, message }) => {
    const el = document.getElementById(id);
    if (!el) return;
    attachObserverToSection(el, message);
  });

  // opzionale: nascondi tooltip quando cambia tab / app in background
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hideTooltip();
  });
})();

/*modalità di funzionamento spiefgazione

Ti basta aggiungere righe in TOOLTIP_CONFIG, ad esempio:
{ id: "more-about-personal", message: "scroll for more" },
{ id: "more-about-work", message: "scroll to read" },
{ id: "recap", message: "tap to open details" },
*/
