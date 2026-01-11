// scripts/load-page-slide-full.js

(function () {
  const MIN_DURATION = 2000; // 2s minimi
  // 🔧 TUNING ANIMAZIONE
  const DURATION = 1100; // prima 800 → ora più fluida
  const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
  // ease-out deciso ma naturale (material-like)

  const loader = document.getElementById("load-page");
  if (!loader) return;

  const startTime = performance.now();

  function slideOutFully() {
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, MIN_DURATION - elapsed);

    setTimeout(() => {
      loader.style.pointerEvents = "none";
      loader.style.willChange = "transform";
      loader.style.transform = "translate3d(0, 0, 0)";
      loader.style.backfaceVisibility = "hidden";

      const rect = loader.getBoundingClientRect();
      const viewportH =
        window.innerHeight || document.documentElement.clientHeight;
      const endY = Math.max(viewportH, rect.height);

      const anim = loader.animate(
        [
          { transform: "translate3d(0, 0, 0)" },
          { transform: `translate3d(0, ${endY}px, 0)` },
        ],
        {
          duration: DURATION,
          easing: EASING,
          fill: "forwards",
        }
      );

      anim.addEventListener(
        "finish",
        () => {
          loader.remove();

          // Trigger staged reveal (defined in align-svgs-reveal.js)
          if (typeof window.revealGraphics === "function") {
            window.revealGraphics();
          }
        },
        { once: true }
      );

      // fallback di sicurezza
      setTimeout(() => {
        if (document.contains(loader)) {
          loader.remove();

          // Trigger reveal anche nel fallback
          if (typeof window.revealGraphics === "function") {
            window.revealGraphics();
          }
        }
      }, DURATION + 300);
    }, remaining);
  }

  if (document.readyState === "complete") {
    slideOutFully();
  } else {
    window.addEventListener("load", slideOutFully, { once: true });
  }
})();
