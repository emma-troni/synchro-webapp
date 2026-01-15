/***********************
 * ZHD-TIMEZONE-HIGHLIGHT.JS
 * Highlights the winning timezone on map-timezones.svg
 * Syncs with the same data source as zhd-data.js
 ***********************/

(function () {
  const HIGHLIGHT_COLOR = "#1a1a1a";
  const POLL_INTERVAL = 3000; // 30 s - synced with RANKING_REFRESH_INTERVAL
  const DEFAULT_TIMEZONE = 21; // Fallback if API fails

  let currentTimezone = null;
  let svgElement = null;

  /**
   * Find the SVG element loaded by svg-import.js
   */
  function getSvgDocument() {
    // Look for SVG inside .visual-map-content (loaded by svg-import.js)
    const mapContainer = document.querySelector(
      ".visual-map-content .svg-holder svg"
    );
    if (mapContainer) return mapContainer;

    // Fallback: any SVG with id Layer_1 (the map's root id)
    const inlineSvg = document.querySelector("svg#Layer_1");
    if (inlineSvg) return inlineSvg;

    return null;
  }

  /**
   * Clear all timezone highlights
   */
  function clearAllHighlights() {
    if (!svgElement) return;

    for (let tz = 1; tz <= 24; tz++) {
      const group =
        svgElement.querySelector(`g#\\3${Math.floor(tz / 10)} ${tz % 10}`) ||
        svgElement.getElementById(String(tz));
      if (group) {
        const shapes = group.querySelectorAll("polygon, rect, path");
        shapes.forEach((shape) => {
          shape.style.fill = "";
        });
      }
    }
  }

  /**
   * Highlight a specific timezone
   */
  function highlightTimezone(timezone) {
    if (!svgElement || !timezone) return;

    // Clear previous
    clearAllHighlights();

    // Highlight new
    const group = svgElement.getElementById(String(timezone));
    if (group) {
      const shapes = group.querySelectorAll("polygon, rect, path");
      shapes.forEach((shape) => {
        shape.style.fill = HIGHLIGHT_COLOR;
      });
      console.log(`[ZHD-Timezone] Highlighted timezone ${timezone}`);
    } else {
      console.warn(
        `[ZHD-Timezone] Group with id="${timezone}" not found in SVG`
      );
    }
  }

  /**
   * Fetch winner timezone from API
   * Returns DEFAULT_TIMEZONE if API fails
   */
  async function fetchWinnerTimezone() {
    try {
      const response = await fetch(
        `${ZHD_CONFIG.SCRIPT_URL}?action=winner&t=${Date.now()}`
      );
      const data = await response.json();

      if (data.error) {
        console.error("[ZHD-Timezone] API error:", data.error);
        return DEFAULT_TIMEZONE;
      }

      return data.timezone || DEFAULT_TIMEZONE;
    } catch (error) {
      console.error("[ZHD-Timezone] Fetch error, using default:", error);
      return DEFAULT_TIMEZONE;
    }
  }

  /**
   * Update the map with current winner
   */
  async function updateTimezoneHighlight() {
    const newTimezone = await fetchWinnerTimezone();

    if (newTimezone && newTimezone !== currentTimezone) {
      currentTimezone = newTimezone;
      highlightTimezone(currentTimezone);
    }
  }

  /**
   * Initialize the timezone highlighter
   */
  function init() {
    svgElement = getSvgDocument();

    if (svgElement) {
      startUpdates();
      return;
    }

    // SVG non ancora caricato: aspetta l'evento
    document.addEventListener("svg-injected", function handler(e) {
      // Verifica che sia l'SVG della mappa (opzionale, se hai più SVG)
      const svg = e.detail.svg;
      if (
        svg &&
        (svg.id === "Layer_1" ||
          e.detail.container?.classList.contains("visual-map-content"))
      ) {
        svgElement = svg;
        document.removeEventListener("svg-injected", handler);
        startUpdates();
      }
    });
  }

  function startUpdates() {
    console.log("[ZHD-Timezone] SVG found, starting highlight updates");
    updateTimezoneHighlight();
    setInterval(updateTimezoneHighlight, POLL_INTERVAL);
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // Give SVG time to load if using <object>
    setTimeout(init, 100);
  }

  // Export for manual control
  window.ZHD_Timezone = {
    highlight: highlightTimezone,
    clear: clearAllHighlights,
    refresh: updateTimezoneHighlight,
  };
})();
