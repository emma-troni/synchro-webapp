/***********************
 * ZHD-TIMEZONE-MAP.JS
 * Highlights the winning timezone on map-timezones.svg
 * Syncs with the same data source as zhd-data.js
 *
 * API returns: 1 to 24 (already converted timezone values)
 * SVG IDs: _tz1 to _tz26 (with "tz" prefix)
 * No conversion needed - API value maps directly to SVG ID
 ***********************/

(function () {
  const HIGHLIGHT_STROKE_WIDTH = "2px";
  const POLL_INTERVAL = 3000; // 3s - synced with RANKING_REFRESH_INTERVAL
  const DEFAULT_TIMEZONE = 21; // Japan's timezone (was UTC+9, now 9+12=21)

  let currentTimezone = null;
  let svgElement = null;

  /**
   * Convert API timezone (1-24) to SVG ID (_tz1 to _tz24)
   * No offset needed - direct mapping
   */
  function timezoneToSvgId(timezone) {
    return `_tz${timezone}`;
  }

  /**
   * Find the SVG element loaded by svg-import.js
   */
  function getSvgDocument() {
    // Look for SVG inside .visual-map-content (loaded by svg-import.js)
    const mapContainer = document.querySelector(
      ".visual-map-content .svg-holder svg"
    );
    if (mapContainer) return mapContainer;

    // Fallback: any SVG with id Layer_1 or Layer_3
    const inlineSvg =
      document.querySelector("svg#Layer_1") ||
      document.querySelector("svg#Layer_3");
    if (inlineSvg) return inlineSvg;

    return null;
  }

  /**
   * Clear all timezone highlights
   */
  function clearAllHighlights() {
    if (!svgElement) return;

    // Range: _tz1 to _tz26
    for (let tz = 1; tz <= 26; tz++) {
      const groupId = `_tz${tz}`;
      const group = svgElement.getElementById(groupId);
      if (group) {
        const shapes = group.querySelectorAll("polygon, rect, path");
        shapes.forEach((shape) => {
          const style = shape.getAttribute("style") || "";
          const newStyle = style.replace(
            /stroke-width:\s*[^;]+;?/gi,
            "stroke-width: .25px;"
          );
          shape.setAttribute("style", newStyle);
        });
      }
    }
  }

  /**
   * Highlight a specific timezone
   */
  function highlightTimezone(timezone) {
    if (!svgElement || timezone === null || timezone === undefined) return;

    // Clear previous
    clearAllHighlights();

    // Convert to SVG ID (direct mapping, no offset)
    const groupId = timezoneToSvgId(timezone);
    const group = svgElement.getElementById(groupId);

    if (group) {
      const shapes = group.querySelectorAll("polygon, rect, path");
      console.log(
        `[ZHD-Timezone] Found ${shapes.length} shapes in group ${groupId}`
      );

      shapes.forEach((shape) => {
        const currentStyle = shape.getAttribute("style") || "";

        let newStyle = currentStyle.replace(
          /stroke-width:\s*[^;]+;?/gi,
          `stroke-width: ${HIGHLIGHT_STROKE_WIDTH};`
        );

        if (!currentStyle.includes("stroke-width:")) {
          newStyle += ` stroke-width: ${HIGHLIGHT_STROKE_WIDTH};`;
        }

        shape.setAttribute("style", newStyle);
      });

      console.log(
        `[ZHD-Timezone] Highlighted timezone ${timezone} (ID: ${groupId})`
      );
    } else {
      console.warn(
        `[ZHD-Timezone] Group with id="${groupId}" not found in SVG`
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

      console.log("[ZHD-Timezone] API response:", data);

      if (data.error) {
        console.error("[ZHD-Timezone] API error:", data.error);
        return DEFAULT_TIMEZONE;
      }

      // API returns timezone value (1 to 24)
      const timezone =
        data.timezone !== undefined ? data.timezone : DEFAULT_TIMEZONE;

      // Validate timezone range (1 to 26)
      if (timezone < 1 || timezone > 26) {
        console.error(
          `[ZHD-Timezone] Invalid timezone value: ${timezone}, using default`
        );
        return DEFAULT_TIMEZONE;
      }

      return timezone;
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

    if (newTimezone !== null && newTimezone !== currentTimezone) {
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
      const svg = e.detail.svg;
      if (
        svg &&
        (svg.id === "Layer_1" ||
          svg.id === "Layer_3" ||
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
    setTimeout(init, 100);
  }

  // Export for manual control
  window.ZHD_Timezone = {
    highlight: highlightTimezone,
    clear: clearAllHighlights,
    refresh: updateTimezoneHighlight,
  };
})();
