/***********************
 * ZHD-TIMEZONE-HIGHLIGHT.JS
 * Highlights the winning timezone on map-timezones.svg
 * Syncs with the same data source as zhd-data.js
 * Updated: timezone values now match Physical_Timezone_Band (-11 to +14)
 * SVG structure: groups with IDs like "_-10", "_-9", "_1", "_2", etc.
 ***********************/

(function () {
  const HIGHLIGHT_STROKE_COLOR = "red";
  const HIGHLIGHT_STROKE_WIDTH = "2px";
  const POLL_INTERVAL = 3000; // 3s - synced with RANKING_REFRESH_INTERVAL
  const DEFAULT_TIMEZONE = 9; // Fallback if API fails (Japan's timezone)

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

    // Range: -11 to +14 (all possible timezone values in the SVG)
    for (let tz = -11; tz <= 14; tz++) {
      // SVG uses IDs like "_-10", "_-9", "_1", "_2", etc.
      const groupId = tz < 0 ? `_${tz}` : `_${tz}`;
      const group = svgElement.getElementById(groupId);
      if (group) {
        const shapes = group.querySelectorAll("polygon, rect, path");
        shapes.forEach((shape) => {
          // Reset to original inline style values
          const style = shape.getAttribute("style") || "";
          const newStyle = style
            .replace(/stroke:\s*[^;]+;?/gi, "stroke: #000;")
            .replace(/stroke-width:\s*[^;]+;?/gi, "stroke-width: .25px;");
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

    // SVG uses IDs like "_-10", "_-9", "_1", "_2", etc.
    const groupId = timezone < 0 ? `_${timezone}` : `_${timezone}`;
    const group = svgElement.getElementById(groupId);

    if (group) {
      const shapes = group.querySelectorAll("polygon, rect, path");
      console.log(
        `[ZHD-Timezone] Found ${shapes.length} shapes in group ${groupId}`
      );

      shapes.forEach((shape, index) => {
        // Get current inline style and replace stroke values
        const currentStyle = shape.getAttribute("style") || "";
        console.log(
          `[ZHD-Timezone] Shape ${index} original style:`,
          currentStyle
        );

        let newStyle = currentStyle
          .replace(/stroke:\s*[^;]+;?/gi, `stroke: ${HIGHLIGHT_STROKE_COLOR};`)
          .replace(
            /stroke-width:\s*[^;]+;?/gi,
            `stroke-width: ${HIGHLIGHT_STROKE_WIDTH};`
          );

        // If stroke wasn't in the style, add it
        if (!currentStyle.includes("stroke:")) {
          newStyle += ` stroke: ${HIGHLIGHT_STROKE_COLOR};`;
        }
        if (!currentStyle.includes("stroke-width:")) {
          newStyle += ` stroke-width: ${HIGHLIGHT_STROKE_WIDTH};`;
        }

        shape.setAttribute("style", newStyle);
        console.log(`[ZHD-Timezone] Shape ${index} new style:`, newStyle);
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

      // API returns Physical_Timezone_Band value (-11 to +14)
      const timezone =
        data.timezone !== undefined ? data.timezone : DEFAULT_TIMEZONE;

      // Validate timezone range
      if (timezone < -11 || timezone > 14) {
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
      // Verifica che sia l'SVG della mappa
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
