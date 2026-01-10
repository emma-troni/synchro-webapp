// ./scripts/svg-import.js
// Robusto per SPA + view nascoste: inject una sola volta, init quando visibile, re-init su view active.

function isElementInActiveView(el) {
  const view = el.closest("main .view");
  // se non è dentro una view, consideralo visibile
  if (!view) return true;
  return view.classList.contains("active");
}

async function injectSVG(container) {
  const url = container.dataset.svg;
  const holder = container.querySelector(".svg-holder");

  // guard-rails
  if (!url || !holder) return null;

  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    console.warn("SVG fetch failed:", url, response.status);
    return null;
  }

  const svgText = await response.text();
  holder.innerHTML = svgText;

  const svg = holder.querySelector("svg");
  if (!svg) {
    console.warn("No <svg> found after injection:", url);
    return null;
  }

  // pulizia per animazioni/responsive
  svg.removeAttribute("width");
  svg.removeAttribute("height");

  return svg;
}

function tryInitSVG(container) {
  // Se non è visibile (view non active), NON inizializzare ora
  if (!isElementInActiveView(container)) return;

  const holder = container.querySelector(".svg-holder");
  const svg = holder ? holder.querySelector("svg") : null;
  if (!svg) return;

  // evita doppio init
  if (container.dataset.svgInited === "1") return;

  try {
    if (typeof window.initSVG === "function") {
      window.initSVG(svg, container);
    } else if (typeof initSVG === "function") {
      initSVG(svg, container);
    }
    container.dataset.svgInited = "1";
  } catch (err) {
    console.warn("initSVG failed for:", container, err);
  }
}

async function processOne(container, { forceInit = false } = {}) {
  // inject una sola volta
  if (container.dataset.svgInjected !== "1") {
    try {
      const svg = await injectSVG(container);
      if (svg) container.dataset.svgInjected = "1";
    } catch (err) {
      console.warn("SVG injection error for:", container, err);
      return;
    }
  }

  // init: solo quando visibile, oppure se forceInit (ma comunque richiede svg presente)
  if (forceInit) {
    // reset init flag così possiamo re-inizializzare quando serve
    container.dataset.svgInited = "0";
  }
  tryInitSVG(container);
}

let _scanScheduled = false;

async function scanSVGs(root = document, opts = {}) {
  const nodes = root.querySelectorAll("[data-svg]");
  // process in sequenza per evitare race inutili
  for (const el of nodes) {
    // se non ha dataset.svg, ignoralo
    if (!el.dataset || !el.dataset.svg) continue;
    await processOne(el, opts);
  }
}

function scheduleScan(root = document, opts = {}) {
  if (_scanScheduled) return;
  _scanScheduled = true;

  requestAnimationFrame(() => {
    _scanScheduled = false;
    scanSVGs(root, opts);
  });
}

// API globale richiamabile dallo SPA
window.svgImport = function svgImport(root = document, opts = {}) {
  scheduleScan(root, opts);
};

// Prima scansione
document.addEventListener("DOMContentLoaded", () => {
  scheduleScan(document, { forceInit: false });
});

// OBSERVER: se lo SPA cambia classi o aggiunge nodi, rescan automatico
const mo = new MutationObserver((mutations) => {
  let shouldRescan = false;

  for (const m of mutations) {
    // nuovi nodi inseriti
    if (m.type === "childList" && (m.addedNodes?.length || 0) > 0) {
      shouldRescan = true;
      break;
    }

    // cambi di classe (es. .view diventa active)
    if (m.type === "attributes" && m.attributeName === "class") {
      const t = m.target;
      if (t && t.matches && t.matches("main .view")) {
        // quando una view diventa active, vogliamo (ri)init degli svg dentro
        if (t.classList.contains("active")) {
          scheduleScan(t, { forceInit: true });
        }
      }
    }
  }

  if (shouldRescan) {
    scheduleScan(document, { forceInit: false });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // osserva cambi nel body: aggiunte e cambi classi view
  mo.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });
});
