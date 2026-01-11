/***********************
 * Visual representation of personal and country scores on SVG graphics
 * With animated fill-opacity transitions
 * Updates both main graphics and overlay raggiere
 ***********************/

const SVG_CONFIG = {
  NUM_SEGMENTS: 24,
  PERSONAL_ID_PREFIX: "_x3C_Rettangolo",
  PERSONAL_ID_SUFFIX: "_x3E_",
  COUNTRY_ID_PREFIX: "_x3C_Rettangolo",
  COUNTRY_ID_SUFFIX: "_x3E_",
  ACTIVE_OPACITY: 1,
  INACTIVE_OPACITY: 0.2,
  STAGGER_DELAY: 30, // delay between each segment animation (ms)
};

function animateSegments(
  container,
  idPrefix,
  idSuffix,
  activeSegments,
  useStagger = true
) {
  if (!container) return;

  for (let i = 0; i < SVG_CONFIG.NUM_SEGMENTS; i++) {
    const elementId = `${idPrefix}${String(i).padStart(2, "0")}${idSuffix}`;
    const polygon = container.querySelector(`#${CSS.escape(elementId)}`);

    if (polygon) {
      const targetOpacity =
        i < activeSegments
          ? SVG_CONFIG.ACTIVE_OPACITY
          : SVG_CONFIG.INACTIVE_OPACITY;

      if (useStagger) {
        setTimeout(() => {
          polygon.style.fillOpacity = targetOpacity;
        }, i * SVG_CONFIG.STAGGER_DELAY);
      } else {
        polygon.style.fillOpacity = targetOpacity;
      }
    }
  }
}

function updatePersonalVisual() {
  if (!window.ZHD || !window.ZHD.isLoaded) return;

  const percentage = window.ZHD.personalScore;
  if (percentage === null) return;

  const activeSegments = Math.round(
    (percentage / 100) * SVG_CONFIG.NUM_SEGMENTS
  );

  // Main internal graphic
  const mainContainer = document.querySelector(".internal-graphic");
  animateSegments(
    mainContainer,
    SVG_CONFIG.PERSONAL_ID_PREFIX,
    SVG_CONFIG.PERSONAL_ID_SUFFIX,
    activeSegments,
    true
  );

  // Overlay internal graphic (in align-personal-overlay)
  const overlayContainer = document.querySelector(
    "#align-personal-overlay .holder.int"
  );
  animateSegments(
    overlayContainer,
    SVG_CONFIG.PERSONAL_ID_PREFIX,
    SVG_CONFIG.PERSONAL_ID_SUFFIX,
    activeSegments,
    false
  );

  // Update view-score text in personal overlay
  const personalScoreEl = document.querySelector(
    "#align-personal-overlay .view-score"
  );
  if (personalScoreEl) {
    personalScoreEl.textContent = percentage.toFixed(1).replace(".", ",") + "%";
  }
}

function updateCountryVisual() {
  if (!window.ZHD || !window.ZHD.isLoaded) return;

  const percentage = window.ZHD.italyData.score;
  const activeSegments = Math.round(
    (percentage / 100) * SVG_CONFIG.NUM_SEGMENTS
  );

  // Main external graphic
  const mainContainer = document.querySelector(".external-graphic");
  animateSegments(
    mainContainer,
    SVG_CONFIG.COUNTRY_ID_PREFIX,
    SVG_CONFIG.COUNTRY_ID_SUFFIX,
    activeSegments,
    true
  );

  // Overlay external graphic (in align-country-overlay)
  const overlayContainer = document.querySelector(
    "#align-country-overlay .holder.ext"
  );
  animateSegments(
    overlayContainer,
    SVG_CONFIG.COUNTRY_ID_PREFIX,
    SVG_CONFIG.COUNTRY_ID_SUFFIX,
    activeSegments,
    false
  );

  // Update view-score text in country overlay
  const countryScoreEl = document.querySelector(
    "#align-country-overlay .view-score"
  );
  if (countryScoreEl) {
    countryScoreEl.textContent = percentage.toFixed(1).replace(".", ",") + "%";
  }
}

function updateAllVisuals() {
  updatePersonalVisual();
  updateCountryVisual();
}

// Re-update when overlay becomes visible (SVGs might not be loaded initially)
function setupOverlayObservers() {
  const personalOverlay = document.getElementById("align-personal-overlay");
  const countryOverlay = document.getElementById("align-country-overlay");

  const observerCallback = (mutations, observer) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target;
        if (target.classList.contains("active")) {
          // Overlay just became visible, update its visual
          setTimeout(() => {
            if (target.id === "align-personal-overlay") {
              updatePersonalVisual();
            } else if (target.id === "align-country-overlay") {
              updateCountryVisual();
            }
          }, 100); // Small delay to ensure SVG is rendered
        }
      }
    }
  };

  const observer = new MutationObserver(observerCallback);

  if (personalOverlay) {
    observer.observe(personalOverlay, { attributes: true });
  }
  if (countryOverlay) {
    observer.observe(countryOverlay, { attributes: true });
  }
}

// Listen for data updates
document.addEventListener("zhd-ranking-updated", updateAllVisuals);

// Initial setup
function init() {
  setupOverlayObservers();

  if (window.ZHD && window.ZHD.isLoaded) {
    updateAllVisuals();
  } else if (window.ZHD) {
    window.ZHD.onDataReady.push(updateAllVisuals);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
