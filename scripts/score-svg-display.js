/***********************
 * SCORE-SVG-DISPLAY.JS
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
        // Stagger the animation for a wave effect
        setTimeout(() => {
          polygon.style.fillOpacity = targetOpacity;
        }, i * SVG_CONFIG.STAGGER_DELAY);
      } else {
        // Immediate update (no stagger)
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
    true // use stagger
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
    false // no stagger for overlay
  );
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
    true // use stagger
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
    false // no stagger for overlay
  );
}

function updateAllVisuals() {
  updatePersonalVisual();
  updateCountryVisual();
}

// Listen for data updates
document.addEventListener("zhd-ranking-updated", updateAllVisuals);

// Initial update when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (window.ZHD && window.ZHD.isLoaded) {
      updateAllVisuals();
    } else if (window.ZHD) {
      window.ZHD.onDataReady.push(updateAllVisuals);
    }
  });
} else {
  if (window.ZHD && window.ZHD.isLoaded) {
    updateAllVisuals();
  } else if (window.ZHD) {
    window.ZHD.onDataReady.push(updateAllVisuals);
  }
}
