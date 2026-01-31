/***********************
 * TIMEOUT-NO-ID.JS
 * Gestione layout e logica per quando non è presente un ID utente
 *
 * - Mostra schermata di input ID con due raggiere contro-rotanti
 * - Valida l'ID inserito contro il Google Sheet
 * - Redirect alla pagina con ID se trovato
 ***********************/

(function () {
  /***********************
   * CONFIGURATION
   ***********************/
  const CONFIG = {
    SHEET_ID: "19eSx-gfbzfAWqs1OYJLPqaqqev62wfokldr9JP6Uezk",
    SHEET_URL: null, // Calcolato sotto
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
   * Due raggiere concentriche contro-rotanti
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

    // Crea la nuova sezione per l'input ID con DUE RAGGIERE CONCENTRICHE
    const idInputSection = document.createElement("section");
    idInputSection.id = "id-input-section";
    idInputSection.className = "view active";
    idInputSection.innerHTML = `
      <style>
        /* Input styling */
        #id-input:focus {
          border-color: var(--secondary-color) !important;
          outline: none;
        }
        
        #id-submit-btn {
          display: none;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        
        #id-submit-btn.visible {
          display: flex;
        }
        
        #id-submit-btn:hover,
        #id-submit-btn:active {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }
        
        /* Contenitore per le due raggiere concentriche */
        .dual-raggiera-container {
          position: relative;
          width: 200px;
          height: 200px;
        }
        
        /* Raggiera esterna - ruota in senso orario */
        .raggiera-outer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .raggiera-outer .svg-holder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .raggiera-outer .svg-holder svg {
          width: 100%;
          height: 100%;
          animation: spin-clockwise 120s linear infinite;
        }
        
        /* Raggiera interna - più piccola, ruota in senso antiorario */
        .raggiera-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70%;
          height: 70%;
        }
        
        .raggiera-inner .svg-holder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .raggiera-inner .svg-holder svg {
          width: 100%;
          height: 100%;
          animation: spin-counter-clockwise 90s linear infinite;
        }
        
        /* Keyframes per le rotazioni */
        @keyframes spin-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-counter-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      </style>
      
      <div class="content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 40px;">
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
        
        <div class="id-input-wrap" style="display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; max-width: 300px; padding: 0 20px;">
          <div style="display: flex; width: 100%; gap: 12px; align-items: center;">
            <input 
              type="text" 
              id="id-input" 
              placeholder="Enter your 8-digit ID"
              maxlength="8"
              inputmode="numeric"
              pattern="[0-9]*"
              style="
                border: var(--border);
                border-radius: 0px;
                height: 44px;
                color: var(--secondary-color);
                background: transparent;
                flex: 1;
                padding: 0 12px;
                font-size: 1rem;
                text-align: center;
                outline: none;
              "
            />
            <button 
              id="id-submit-btn"
              style="
                border: var(--border);
                border-radius: 0px;
                height: 47px;
                width: 47px;
                color: var(--secondary-color);
                background: transparent;
                cursor: pointer;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                padding: 0;
              "
            >→</button>
          </div>
          <p id="id-error-message" style="color: #A51538; font-size: 0.9rem; min-height: 1.2em;"></p>
        </div>
      </div>
    `;

    main.insertBefore(idInputSection, main.firstChild);

    // Inietta gli SVG delle raggiere
    setTimeout(() => {
      const outerDiv = idInputSection.querySelector(".raggiera-outer");
      const innerDiv = idInputSection.querySelector(".raggiera-inner");

      // Usa svgImport globale se disponibile
      if (window.svgImport) {
        window.svgImport(idInputSection);
      }

      // Fallback: inietta manualmente entrambe le raggiere
      Promise.all([injectSvg(outerDiv), injectSvg(innerDiv)]).then(() => {
        console.log("[Timeout-NoId] Dual raggiere injected and animating");
      });
    }, 100);

    // Setup event listeners per input e submit
    setupIdInputListeners();

    console.log(
      "[Timeout-NoId] Applied no-user-ID layout with dual counter-rotating raggiere",
    );
  }

  /***********************
   * INPUT LISTENERS
   ***********************/
  function setupIdInputListeners() {
    const input = document.getElementById("id-input");
    const submitBtn = document.getElementById("id-submit-btn");
    const errorMsg = document.getElementById("id-error-message");

    if (!input || !submitBtn || !errorMsg) return;

    // Solo numeri e gestione visibilità bottone
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      errorMsg.textContent = "";

      // Mostra bottone solo quando ci sono 8 cifre
      if (e.target.value.length === 8) {
        submitBtn.classList.add("visible");
      } else {
        submitBtn.classList.remove("visible");
      }
    });

    // Submit on Enter (solo se 8 cifre)
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && input.value.length === 8) {
        validateAndRedirect();
      }
    });

    // Submit on button click
    submitBtn.addEventListener("click", validateAndRedirect);

    async function validateAndRedirect() {
      const id = input.value.trim();

      // Validazione lunghezza
      if (id.length !== 8) {
        errorMsg.textContent = "Please enter a valid 8-digit ID";
        return;
      }

      // Mostra loading
      submitBtn.textContent = "...";
      submitBtn.disabled = true;
      errorMsg.textContent = "";

      try {
        // Verifica se l'ID esiste nel Google Sheet
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
          // ID trovato, redirect
          window.location.href = `timeout.html?id=${id}`;
        } else {
          // ID non trovato
          errorMsg.textContent = "ID not found. Please check and try again.";
          submitBtn.textContent = "→";
          submitBtn.disabled = false;
        }
      } catch (error) {
        console.error("[Timeout-NoId] Error validating ID:", error);
        errorMsg.textContent = "Connection error. Please try again.";
        submitBtn.textContent = "→";
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
    // Se non c'è ID nell'URL, applica il layout alternativo
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

  // Esporta per uso esterno se necessario
  window.TimeoutNoId = {
    applyNoUserIdLayout,
    hasUserId,
  };
})();
