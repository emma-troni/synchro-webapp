// remove-scroll-container-on-alignment-scroll.js
(() => {
  const THRESHOLD_VH = 10; // 10vh
  const FADE_MS = 350; // durata dissolvenza

  function isScrollable(el) {
    if (!el || el === document.body || el === document.documentElement)
      return false;
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScroll =
      overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
    return canScroll && el.scrollHeight > el.clientHeight;
  }

  function findScrollParent(startEl) {
    let el = startEl;
    while (el && el !== document.body && el !== document.documentElement) {
      if (isScrollable(el)) return el;
      el = el.parentElement;
    }
    // fallback: se nessun parent scrollabile, usa window/document
    return window;
  }

  function ensureFadeStyle() {
    // stile minimo per dissolvenza (non dipende dal tuo CSS)
    const id = "scroll-container-fade-style";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      #alignment #scroll-container {
        opacity: 1;
        transition: opacity ${FADE_MS}ms ease;
      }
      #alignment #scroll-container.is-fading {
        opacity: 0;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    const alignment = document.getElementById("alignment");
    const banner = document.getElementById("scroll-container");
    if (!alignment || !banner) return;

    ensureFadeStyle();

    const scrollTarget = findScrollParent(alignment);
    const thresholdPx = () => window.innerHeight * (THRESHOLD_VH / 100);

    // memorizza da dove parti (importante se non sei a scrollTop 0)
    const startScroll =
      scrollTarget === window
        ? window.scrollY || document.documentElement.scrollTop || 0
        : scrollTarget.scrollTop;

    let removed = false;

    const getDelta = () => {
      const now =
        scrollTarget === window
          ? window.scrollY || document.documentElement.scrollTop || 0
          : scrollTarget.scrollTop;
      return Math.max(0, now - startScroll);
    };

    const removeBanner = () => {
      if (removed) return;
      removed = true;

      banner.classList.add("is-fading");

      window.setTimeout(() => {
        banner.remove();
        // stop ascolto
        if (scrollTarget === window) {
          window.removeEventListener("scroll", onScroll, { passive: true });
        } else {
          scrollTarget.removeEventListener("scroll", onScroll, {
            passive: true,
          });
        }
      }, FADE_MS);
    };

    const onScroll = () => {
      if (removed) return;
      if (getDelta() >= thresholdPx()) removeBanner();
    };

    // Se già oltre soglia (es. ritorno su section già scrollata)
    if (getDelta() >= thresholdPx()) {
      banner.remove();
      return;
    }

    // ascolta lo scroll giusto
    if (scrollTarget === window) {
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
