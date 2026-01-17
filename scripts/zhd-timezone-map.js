/***********************
 * ZHD-TIMEZONE-MAP.JS
 * Highlights the winning timezone on map-timezones.svg
 *
 * SYNCED WITH zhd-data.js:
 * - Listens to 'zhd-ranking-updated' event (includes timezone)
 * - No separate API calls - uses data from zhd-data.js
 * - Map updates exactly when ranking updates
 *
 * API returns: 1 to 26 (timezone values)
 * SVG IDs: _tz1 to _tz26 (with "tz" prefix)
 ***********************/

(function () {
  // Highlight styling - more visible!
  const HIGHLIGHT_FILL = "rgba(255, 204, 0, 0.4)"; // Semi-transparent gold/yellow
  const HIGHLIGHT_STROKE = "#cc9900"; // Darker gold for stroke
  const HIGHLIGHT_STROKE_WIDTH = "1.5px";

  // Original styling (from SVG)
  const DEFAULT_FILL = "none";
  const DEFAULT_STROKE = "#000";
  const DEFAULT_STROKE_WIDTH = ".25px";

  let currentTimezone = null;
  let svgElement = null;
  let pendingTimezone = null; // Store timezone if SVG not ready yet

  /**
   * Convert timezone (1-26) to SVG ID (_tz1 to _tz26)
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
   * Reset a shape to default styling
   */
  function resetShapeStyle(shape) {
    shape.setAttribute(
      "style",
      `fill: ${DEFAULT_FILL}; stroke: ${DEFAULT_STROKE}; stroke-miterlimit: 10; stroke-width: ${DEFAULT_STROKE_WIDTH};`
    );
  }

  /**
   * Apply highlight styling to a shape
   */
  function highlightShapeStyle(shape) {
    shape.setAttribute(
      "style",
      `fill: ${HIGHLIGHT_FILL}; stroke: ${HIGHLIGHT_STROKE}; stroke-miterlimit: 10; stroke-width: ${HIGHLIGHT_STROKE_WIDTH};`
    );
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
        shapes.forEach(resetShapeStyle);
      }
    }
    currentTimezone = null;
  }

  /**
   * Highlight a specific timezone
   */
  function highlightTimezone(timezone) {
    if (timezone === null || timezone === undefined) return;

    // If SVG not ready, store for later
    if (!svgElement) {
      pendingTimezone = timezone;
      console.log("[ZHD-Timezone] SVG not ready, queuing timezone:", timezone);
      return;
    }

    // Validate timezone
    if (timezone < 1 || timezone > 26) {
      console.warn(`[ZHD-Timezone] Invalid timezone: ${timezone}`);
      return;
    }

    // Skip if same as current
    if (timezone === currentTimezone) return;

    // Clear previous highlight
    if (currentTimezone !== null) {
      const prevGroupId = timezoneToSvgId(currentTimezone);
      const prevGroup = svgElement.getElementById(prevGroupId);
      if (prevGroup) {
        const shapes = prevGroup.querySelectorAll("polygon, rect, path");
        shapes.forEach(resetShapeStyle);
      }
    }

    // Convert to SVG ID
    const groupId = timezoneToSvgId(timezone);
    const group = svgElement.getElementById(groupId);

    if (group) {
      const shapes = group.querySelectorAll("polygon, rect, path");
      console.log(
        `[ZHD-Timezone] Found ${shapes.length} shapes in group ${groupId}`
      );

      shapes.forEach(highlightShapeStyle);

      currentTimezone = timezone;
      console.log(
        `[ZHD-Timezone] Highlighted timezone ${timezone} (ID: ${groupId}) with fill: ${HIGHLIGHT_FILL}`
      );
    } else {
      console.warn(
        `[ZHD-Timezone] Group with id="${groupId}" not found in SVG`
      );
    }
  }

  /**
   * Handle ranking update event from zhd-data.js
   * This is the main way we receive timezone updates
   */
  function onRankingUpdated(event) {
    const { timezone } = event.detail;

    if (timezone !== undefined && timezone !== null) {
      console.log(
        "[ZHD-Timezone] Received timezone from ranking event:",
        timezone
      );
      highlightTimezone(timezone);
    }
  }

  /**
   * Initialize SVG reference
   */
  function initSvg() {
    svgElement = getSvgDocument();

    if (svgElement) {
      console.log("[ZHD-Timezone] SVG found");

      // If we have a pending timezone, apply it now
      if (pendingTimezone !== null) {
        console.log(
          "[ZHD-Timezone] Applying pending timezone:",
          pendingTimezone
        );
        highlightTimezone(pendingTimezone);
        pendingTimezone = null;
      }

      // Also check if ZHD already has timezone data
      if (window.ZHD && window.ZHD.winnerTimezone) {
        highlightTimezone(window.ZHD.winnerTimezone);
      }

      return true;
    }
    return false;
  }

  /**
   * Initialize the timezone highlighter
   */
  function init() {
    // Listen for ranking updates (main data source)
    document.addEventListener("zhd-ranking-updated", onRankingUpdated);

    // Try to get SVG immediately
    if (initSvg()) {
      return;
    }

    // SVG not ready yet - wait for injection event
    document.addEventListener("svg-injected", function handler(e) {
      const svg = e.detail.svg;
      if (
        svg &&
        (svg.id === "Layer_1" ||
          svg.id === "Layer_3" ||
          e.detail.container?.classList.contains("visual-map-content"))
      ) {
        document.removeEventListener("svg-injected", handler);
        initSvg();
      }
    });

    console.log("[ZHD-Timezone] Initialized, waiting for SVG and data");
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for manual control / debugging
  window.ZHD_Timezone = {
    highlight: highlightTimezone,
    clear: clearAllHighlights,
    getSvg: getSvgDocument,
    getCurrentTimezone: () => currentTimezone,
  };
})();
