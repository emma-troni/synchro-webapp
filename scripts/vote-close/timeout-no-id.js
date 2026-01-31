/***********************
 * TIMEOUT-NO-ID.JS
 * Gestione layout e logica per quando non è presente un ID utente
 *
 * - Mostra schermata di input ID con due raggiere contro-rotanti
 * - Valida l'ID inserito contro il Google Sheet
 * - Redirect alla pagina con ID se trovato
 *
 * RICHIEDE: timeout-no-id.css per gli stili
 ***********************/

(function () {
  /***********************
   * CONFIGURATION
   ***********************/
  const CONFIG = {
    SHEET_ID: "19eSx-gfbzfAWqs1OYJLPqaqqev62wfokldr9JP6Uezk",
    SHEET_URL: null,
    ICONS: {
      SUBMIT: "❯",
      LOADING: "...",
    },
  };

  CONFIG.SHEET_URL = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json`;

  /***********************
   * SVG INJECTION HELPER
   ***********************/
  async function injectSvg(container) {
    if (!container) return null;
    const url = container.dataset.svg;
    const holder = container.querySelector(".svg-holder");
    if (!url || !holder) return null;

    if (container.dataset.svgInjected === "1") {
      return holder.querySelector("svg");
    }

    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) return null;

      const svgText = await response.text();
      holder.innerHTML = svgText;

      const svg = holder.querySelector("svg");
      if (!svg) return null;

      svg.removeAttribute("width");
      svg.removeAttribute("height");
      container.dataset.svgInjected = "1";

      console.log("[Timeout-NoId] SVG injected:", url);
      return svg;
    } catch (err) {
      console.warn("[Timeout-NoId] SVG injection error:", err);
      return null;
    }
  }

  /***********************
   * LAYOUT NO USER ID
   ***********************/
  function applyNoUserIdLayout() {
    // 1. Nascondi nav .divide
    const nav = document.querySelector("nav.divide");
    if (nav) nav.style.display = "none";

    // 2. Nascondi tutte le sezioni main e crea schermata input ID
    const main = document.querySelector("main");
    if (!main) return;

    // Nascondi tutte le sezioni esistenti
    main.querySelectorAll("section").forEach((section) => {
      section.style.display = "none";
    });

    // Crea la nuova sezione per l'input ID
    const idInputSection = document.createElement("section");
    idInputSection.id = "id-input-section";
    idInputSection.className = "view active";
    idInputSection.innerHTML = `
      <div class="content no-id-content">
        <div class="dual-raggiera-container">
          <!-- Raggiera esterna (più grande, senso orario) -->
          <div class="raggiera-outer" data-svg="./public/icons/raggiera.svg">
            <span class="svg-holder" id="waiting-outer"></span>
          </div>
          <!-- Raggiera interna (più piccola, senso antiorario) -->
          <div class="raggiera-inner" data-svg="./public/icons/raggiera.svg">
            <span class="svg-holder" id="waiting-inner"></span>
          </div>
        </div>
        
        <div class="id-input-wrap">
          <div class="id-input-row">
            <input 
              type="text" 
              id="id-input" 
              placeholder="Enter your 8-digit ID"
              maxlength="8"
              inputmode="numeric"
              pattern="[0-9]*"
            />
            <button id="id-submit-btn">${CONFIG.ICONS.SUBMIT}</button>
          </div>
          <p id="id-error-message"></p>
        </div>
      </div>
    `;

    main.insertBefore(idInputSection, main.firstChild);

    // Inietta gli SVG delle raggiere
    setTimeout(() => {
      const outerDiv = idInputSection.querySelector(".raggiera-outer");
      const innerDiv = idInputSection.querySelector(".raggiera-inner");

      if (window.svgImport) {
        window.svgImport(idInputSection);
      }

      Promise.all([injectSvg(outerDiv), injectSvg(innerDiv)]).then(() => {
        console.log("[Timeout-NoId] Dual raggiere injected and animating");
      });
    }, 100);

    setupIdInputListeners();

    console.log("[Timeout-NoId] Applied no-user-ID layout");
  }

  /***********************
   * INPUT LISTENERS
   ***********************/
  function setupIdInputListeners() {
    const input = document.getElementById("id-input");
    const submitBtn = document.getElementById("id-submit-btn");
    const errorMsg = document.getElementById("id-error-message");

    if (!input || !submitBtn || !errorMsg) return;

    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      errorMsg.textContent = "";

      if (e.target.value.length === 8) {
        submitBtn.classList.add("visible");
      } else {
        submitBtn.classList.remove("visible");
      }
    });

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && input.value.length === 8) {
        validateAndRedirect();
      }
    });

    submitBtn.addEventListener("click", validateAndRedirect);

    async function validateAndRedirect() {
      const id = input.value.trim();

      if (id.length !== 8) {
        errorMsg.textContent = "Please enter a valid 8-digit ID";
        return;
      }

      submitBtn.textContent = CONFIG.ICONS.LOADING;
      submitBtn.disabled = true;
      errorMsg.textContent = "";

      try {
        const response = await fetch(CONFIG.SHEET_URL);
        const text = await response.text();
        const jsonText = text.substring(47, text.length - 2);
        const data = JSON.parse(jsonText);

        const rows = data.table.rows.map((row) => ({
          ID: row.c[1]?.v,
          Dati: row.c[2]?.v,
        }));

        const userRow = rows.find((r) => String(r.ID) === String(id));

        if (userRow && userRow.Dati) {
          window.location.href = `timeout.html?id=${id}`;
        } else {
          errorMsg.textContent = "ID not found. Please check and try again.";
          submitBtn.textContent = CONFIG.ICONS.SUBMIT;
          submitBtn.disabled = false;
        }
      } catch (error) {
        console.error("[Timeout-NoId] Error validating ID:", error);
        errorMsg.textContent = "Connection error. Please try again.";
        submitBtn.textContent = CONFIG.ICONS.SUBMIT;
        submitBtn.disabled = false;
      }
    }
  }

  /***********************
   * CHECK & INIT
   ***********************/
  function hasUserId() {
    return new URLSearchParams(window.location.search).has("id");
  }

  function init() {
    if (!hasUserId()) {
      applyNoUserIdLayout();
    }
  }

  /***********************
   * START
   ***********************/
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TimeoutNoId = {
    applyNoUserIdLayout,
    hasUserId,
  };
})();
