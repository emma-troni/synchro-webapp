/***********************
 * SCORE-SVG-DISPLAY.JS
 * Visual representation of personal score on SVG graphic
 ***********************/

const SVG_CONFIG = {
  NUM_SEGMENTS: 24,
  ID_PREFIX: "_x3C_Rettangolo",
  ID_SUFFIX: "_x3E_",
  ACTIVE_OPACITY: 1,
  INACTIVE_OPACITY: 0.2,
};

function updatePersonalVisual() {
  if (!window.ZHD || !window.ZHD.isLoaded) return;

  const percentage = window.ZHD.personalScore;
  const activeSegments = Math.round(
    (percentage / 100) * SVG_CONFIG.NUM_SEGMENTS
  );

  for (let i = 0; i < SVG_CONFIG.NUM_SEGMENTS; i++) {
    const elementId = `${SVG_CONFIG.ID_PREFIX}${String(i).padStart(2, "0")}${
      SVG_CONFIG.ID_SUFFIX
    }`;
    const polygon = document.getElementById(elementId);

    if (polygon) {
      polygon.style.fillOpacity =
        i < activeSegments
          ? SVG_CONFIG.ACTIVE_OPACITY
          : SVG_CONFIG.INACTIVE_OPACITY;
    }
  }
}

// Listen for data updates
document.addEventListener("zhd-ranking-updated", updatePersonalVisual);

// Initial update when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (window.ZHD && window.ZHD.isLoaded) {
      updatePersonalVisual();
    } else {
      window.ZHD.onDataReady.push(updatePersonalVisual);
    }
  });
} else {
  if (window.ZHD && window.ZHD.isLoaded) {
    updatePersonalVisual();
  } else {
    window.ZHD.onDataReady.push(updatePersonalVisual);
  }
}
