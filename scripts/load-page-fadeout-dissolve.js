// load-page-fadeout-dissolve.js
// SEQUENZA: line fill -> sx/dx slide in (a 50%) -> wait 2s -> fade out sx/dx + central-line
// -> zhd slide up -> powered-by slide up -> wait 2.5s -> dissolve pagina loader -> revealGraphics()

(function () {
  const MIN_DURATION = 2000; // tempo minimo prima di iniziare la sequenza
  const PAGE_FADE_DURATION = 600; // dissolvenza finale loader (ms)

  const LINE_DURATION = 800; // 1) fill linea
  const LOGO_SLIDE_DURATION = 700; // 2) slide sx/dx
  const WAIT_AFTER_LOGOS = 2000; // 3) attesa 2s
  const LOGO_FADE_DURATION = 500; // 3) fade out sx/dx + linea
  const ZHD_SLIDE_DURATION = 700; // 4) slide up zhd (+ powered-by)
  const WAIT_BEFORE_PAGE_FADE = 2500; // 5) attesa 2.5s

  const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

  const loadPage = document.getElementById("load-page");
  if (!loadPage) return;

  const startTime = performance.now();

  const centralLine = document.getElementById("central-line");
  const logoSxHolder = document.getElementById("logo-sx");
  const logoDxHolder = document.getElementById("logo-dx");
  const zhdHolder = document.getElementById("zhd-logo");

  // powered-by: prima prova id, altrimenti class
  const poweredBy =
    document.getElementById("power-by") ||
    loadPage.querySelector(".powered-by");

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // Dissolvenza finale loader
  loadPage.style.opacity = "1";
  loadPage.style.transition = `opacity ${PAGE_FADE_DURATION}ms ease-out`;

  // --- Anti-flash: nascondi subito i contenitori finché lo svg non è iniettato ---
  if (logoSxHolder) logoSxHolder.style.opacity = "0";
  if (logoDxHolder) logoDxHolder.style.opacity = "0";
  if (zhdHolder) zhdHolder.style.opacity = "0";

  // powered-by parte nascosto
  if (poweredBy) {
    poweredBy.style.opacity = "0";
  }

  // Central line: visibile (ma “vuota” finché non si riempie)
  if (centralLine) {
    centralLine.style.opacity = "1";
  }

  function waitForSvg(holder, timeoutMs = 5000) {
    return new Promise((resolve) => {
      if (!holder) return resolve(null);

      const t0 = performance.now();
      const tick = () => {
        const svg = holder.querySelector("svg");
        if (svg) return resolve(svg);

        if (performance.now() - t0 > timeoutMs) return resolve(null);
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  function ensureCentralFillEl() {
    if (!centralLine) return null;

    const cs = getComputedStyle(centralLine);
    if (cs.position === "static") centralLine.style.position = "relative";
    centralLine.style.overflow = "hidden";

    let fill = centralLine.querySelector(".central-line-fill");
    if (!fill) {
      fill = document.createElement("div");
      fill.className = "central-line-fill";
      centralLine.appendChild(fill);
    }

    Object.assign(fill.style, {
      position: "absolute",
      inset: "0",
      background: "var(--secondary-color)",
      transform: "scaleY(0)",
      transformOrigin: "bottom",
      willChange: "transform",
      pointerEvents: "none",
    });

    return fill;
  }

  function fillCentralLine() {
    const fill = ensureCentralFillEl();
    if (!fill) return;

    fill.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
      duration: LINE_DURATION,
      easing: EASE_OUT,
      fill: "forwards",
    });
  }

  function setInitialStates({ sxSvg, dxSvg, zhdSvg }) {
    // sx: entra da destra verso sinistra
    if (sxSvg) {
      sxSvg.style.willChange = "transform, opacity";
      sxSvg.style.opacity = "0";
      sxSvg.style.transform = "translateX(18%)";
      sxSvg.style.transition = `transform ${LOGO_SLIDE_DURATION}ms ${EASE_OUT}, opacity ${LOGO_SLIDE_DURATION}ms ${EASE_OUT}`;
    }

    // dx: entra da sinistra verso destra
    if (dxSvg) {
      dxSvg.style.willChange = "transform, opacity";
      dxSvg.style.opacity = "0";
      dxSvg.style.transform = "translateX(-18%)";
      dxSvg.style.transition = `transform ${LOGO_SLIDE_DURATION}ms ${EASE_OUT}, opacity ${LOGO_SLIDE_DURATION}ms ${EASE_OUT}`;
    }

    // zhd: entra dal basso verso l’alto
    if (zhdSvg) {
      zhdSvg.style.willChange = "transform, opacity";
      zhdSvg.style.opacity = "0";
      zhdSvg.style.transform = "translateY(20%)";
      zhdSvg.style.transition = `transform ${ZHD_SLIDE_DURATION}ms ${EASE_OUT}, opacity ${ZHD_SLIDE_DURATION}ms ${EASE_OUT}`;
    }

    // powered-by: stesso identico approccio di zhd (sull’elemento, non su svg)
    if (poweredBy) {
      poweredBy.style.willChange = "transform, opacity";
      poweredBy.style.opacity = "0";
      poweredBy.style.transform = "translateY(20%)";
      poweredBy.style.transition = `transform ${ZHD_SLIDE_DURATION}ms ${EASE_OUT}, opacity ${ZHD_SLIDE_DURATION}ms ${EASE_OUT}`;
    }
  }

  async function runSequence() {
    const [sxSvg, dxSvg, zhdSvg] = await Promise.all([
      waitForSvg(logoSxHolder),
      waitForSvg(logoDxHolder),
      waitForSvg(zhdHolder),
    ]);

    // Ora che lo svg esiste, rendi visibili i contenitori (lo svg resta opacity 0 finché non parte l’animazione)
    if (logoSxHolder) logoSxHolder.style.opacity = "1";
    if (logoDxHolder) logoDxHolder.style.opacity = "1";
    if (zhdHolder) zhdHolder.style.opacity = "1";

    // Allineamento “contenuto” del logo dx verso sinistra
    if (dxSvg) {
      dxSvg.setAttribute("preserveAspectRatio", "xMinYMid meet");
    }

    setInitialStates({ sxSvg, dxSvg, zhdSvg });

    // 1) riempimento linea bottom->top
    fillCentralLine();

    // 2) al 50%: entrano sx/dx
    await wait(LINE_DURATION * 0.5);

    if (sxSvg) {
      sxSvg.style.opacity = "1";
      sxSvg.style.transform = "translateX(0)";
    }
    if (dxSvg) {
      dxSvg.style.opacity = "1";
      dxSvg.style.transform = "translateX(0)";
    }

    await wait(LOGO_SLIDE_DURATION);

    // 3) dopo 2s: fade out sx/dx + central line
    await wait(WAIT_AFTER_LOGOS);

    if (sxSvg)
      sxSvg.style.transition = `opacity ${LOGO_FADE_DURATION}ms ${EASE_OUT}`;
    if (dxSvg)
      dxSvg.style.transition = `opacity ${LOGO_FADE_DURATION}ms ${EASE_OUT}`;
    if (sxSvg) sxSvg.style.opacity = "0";
    if (dxSvg) dxSvg.style.opacity = "0";

    if (centralLine) {
      centralLine.style.willChange = "opacity";
      centralLine.style.transition = `opacity ${LOGO_FADE_DURATION}ms ${EASE_OUT}`;
      centralLine.style.opacity = "0";
    }

    await wait(LOGO_FADE_DURATION);

    // 4) compare zhd con slide up + powered-by con lo stesso movimento
    if (zhdSvg) {
      zhdSvg.style.opacity = "1";
      zhdSvg.style.transform = "translateY(0)";
    }

    if (poweredBy) {
      poweredBy.style.opacity = "1";
      poweredBy.style.transform = "translateY(0)";
    }

    await wait(ZHD_SLIDE_DURATION);

    // 5) dopo 2.5s dissolvenza loader
    await wait(WAIT_BEFORE_PAGE_FADE);

    loadPage.style.opacity = "0";
    await wait(PAGE_FADE_DURATION);

    loadPage.style.pointerEvents = "none";
    loadPage.remove();

    if (typeof window.revealGraphics === "function") {
      window.revealGraphics();
    }
  }

  function startWhenReady() {
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, MIN_DURATION - elapsed);
    setTimeout(runSequence, remaining);
  }

  if (document.readyState === "complete") {
    startWhenReady();
  } else {
    window.addEventListener("load", startWhenReady, { once: true });
  }
})();
