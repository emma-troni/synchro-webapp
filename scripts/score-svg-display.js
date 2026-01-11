/***********************
 * SCORE-SVG-DISPLAY.JS
 * Visual representation of personal and country scores on SVG graphics
 ***********************/

const SVG_CONFIG = {
  NUM_SEGMENTS: 24,
  PERSONAL_ID_PREFIX: "_x3C_Rettangolo",
  PERSONAL_ID_SUFFIX: "_x3E_",
  COUNTRY_ID_PREFIX: "_x3C_Rettangolo",
  COUNTRY_ID_SUFFIX: "_x3E_",
  ACTIVE_OPACITY: 1,
  INACTIVE_OPACITY: 0.2,
};

function updatePersonalVisual() {
  if (!window.ZHD || !window.ZHD.isLoaded) return;

  const percentage = window.ZHD.personalScore;
  const activeSegments = Math.round(
    (percentage / 100) * SVG_CONFIG.NUM_SEGMENTS
  );

  const container = document.querySelector(".internal-graphic");
  if (!container) return;

  for (let i = 0; i < SVG_CONFIG.NUM_SEGMENTS; i++) {
    const elementId = `${SVG_CONFIG.PERSONAL_ID_PREFIX}${String(i).padStart(
      2,
      "0"
    )}${SVG_CONFIG.PERSONAL_ID_SUFFIX}`;
    const polygon = container.querySelector(`#${CSS.escape(elementId)}`);

    if (polygon) {
      polygon.style.fillOpacity =
        i < activeSegments
          ? SVG_CONFIG.ACTIVE_OPACITY
          : SVG_CONFIG.INACTIVE_OPACITY;
    }
  }
}

function updateCountryVisual() {
  if (!window.ZHD || !window.ZHD.isLoaded) return;

  const percentage = window.ZHD.italyData.score;
  const activeSegments = Math.round(
    (percentage / 100) * SVG_CONFIG.NUM_SEGMENTS
  );

  const container = document.querySelector(".external-graphic");
  if (!container) return;

  for (let i = 0; i < SVG_CONFIG.NUM_SEGMENTS; i++) {
    const elementId = `${SVG_CONFIG.COUNTRY_ID_PREFIX}${String(i).padStart(
      2,
      "0"
    )}${SVG_CONFIG.COUNTRY_ID_SUFFIX}`;
    const polygon = container.querySelector(`#${CSS.escape(elementId)}`);

    if (polygon) {
      polygon.style.fillOpacity =
        i < activeSegments
          ? SVG_CONFIG.ACTIVE_OPACITY
          : SVG_CONFIG.INACTIVE_OPACITY;
    }
  }
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
    } else {
      window.ZHD.onDataReady.push(updateAllVisuals);
    }
  });
} else {
  if (window.ZHD && window.ZHD.isLoaded) {
    updateAllVisuals();
  } else {
    window.ZHD.onDataReady.push(updateAllVisuals);
  }
}
