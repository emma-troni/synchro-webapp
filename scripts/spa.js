// ./scripts/spa.js

const VIEW_TRANSITION_MS = 520;

function resetScroll(container) {
  container.scrollTop = 0;
  const scrollables = container.querySelectorAll("div");
  scrollables.forEach((el) => (el.scrollTop = 0));
}

let isTransitioning = false;

function runSvgImportForView(viewEl, { forceInit = false } = {}) {
  if (typeof window.svgImport !== "function") return;

  // 2 frame: garantisce che la view sia davvero "paintata"
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.svgImport(viewEl, { forceInit });
    });
  });
}

function setActiveView(targetView, { instant = false } = {}) {
  const next = document.getElementById(targetView);
  const current = document.querySelector("main .view.active");

  if (!next) return;
  if (current === next) return;

  if (!instant && isTransitioning) return;
  if (!instant) isTransitioning = true;

  // disattiva corrente
  if (current) {
    current.classList.remove("active");
    current.setAttribute("aria-hidden", "true");
  }

  // attiva nuova
  next.setAttribute("aria-hidden", "false");

  const doActivate = () => {
    next.classList.add("active");
    resetScroll(next);

    // ✅ import/init svg della view attiva (robusto)
    runSvgImportForView(next, { forceInit: true });

    if (!instant) {
      window.setTimeout(() => {
        isTransitioning = false;
      }, VIEW_TRANSITION_MS);
    } else {
      isTransitioning = false;
    }
  };

  if (instant) {
    doActivate();
  } else {
    requestAnimationFrame(doActivate);
  }

  // aria-hidden coerente sulle altre view
  document.querySelectorAll("main .view").forEach((v) => {
    if (v !== next) v.setAttribute("aria-hidden", "true");
  });
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-view]");
  if (!btn) return;

  const inNav = !!btn.closest("nav");
  const target = btn.dataset.view;

  if (inNav) {
    document.body.classList.add("instant-switch");
    setActiveView(target, { instant: true });

    // aggiorna active sui bottoni nav
    const nav = btn.closest("nav");
    if (nav) {
      nav
        .querySelectorAll("[data-view]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.remove("instant-switch");
      });
    });

    return;
  }

  setActiveView(target, { instant: false });
});

document.addEventListener("DOMContentLoaded", () => {
  const initialView = document.querySelector("main .view.active");
  if (!initialView) return;

  document.querySelectorAll("main .view").forEach((v) => {
    v.setAttribute("aria-hidden", v === initialView ? "false" : "true");
  });

  // evita animazione iniziale
  document.body.classList.add("instant-switch");
  setActiveView(initialView.id, { instant: true });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.remove("instant-switch");
    });
  });

  // bottone nav attivo
  const navButton = document.querySelector(
    `nav [data-view="${initialView.id}"]`
  );
  if (navButton) navButton.classList.add("active");

  // ✅ scan globale iniziale (copre anche timeout.html e recap)
  if (typeof window.svgImport === "function") {
    window.svgImport(document, { forceInit: false });
    runSvgImportForView(initialView, { forceInit: true });
  }
});
