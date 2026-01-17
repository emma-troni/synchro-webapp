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
  let lastKnownTimezone = null; // Remember timezone for view changes

  /**
   * Convert timezone (1-26) to SVG ID (_tz1 to _tz26)
   */
  function timezoneToSvgId(timezone) {
    return `_tz${timezone}`;
  }

  /**
   * Find the SVG element loaded by svg-import.js
   * Prioritizes SVG in the active view
   */
  function getSvgDocument() {
    // First try: SVG inside active view's .visual-map-content
    const activeViewSvg = document.querySelector(
      ".view.active .visual-map-content .svg-holder svg"
    );
    if (activeViewSvg) return activeViewSvg;

    // Second try: SVG#Layer_3 inside active view
    const activeLayerSvg = document.querySelector(".view.active svg#Layer_3");
    if (activeLayerSvg) return activeLayerSvg;

    // Third try: any .visual-map-content
    const mapContainer = document.querySelector(
      ".visual-map-content .svg-holder svg"
    );
    if (mapContainer) return mapContainer;

    // Fallback: any SVG with id Layer_1 or Layer_3
    const inlineSvg =
      document.querySelector("svg#Layer_3") ||
      document.querySelector("svg#Layer_1");
    if (inlineSvg) return inlineSvg;

    return null;
  }

  /**
   * Reset a shape to default styling using .style properties
   */
  function resetShapeStyle(shape) {
    shape.style.fill = DEFAULT_FILL;
    shape.style.stroke = DEFAULT_STROKE;
    shape.style.strokeWidth = DEFAULT_STROKE_WIDTH;
    shape.style.strokeMiterlimit = "10";
  }

  /**
   * Apply highlight styling to a shape using .style properties
   */
  function highlightShapeStyle(shape) {
    shape.style.fill = HIGHLIGHT_FILL;
    shape.style.stroke = HIGHLIGHT_STROKE;
    shape.style.strokeWidth = HIGHLIGHT_STROKE_WIDTH;
    shape.style.strokeMiterlimit = "10";
  }

  /**
   * Clear only the current highlighted timezone (not all)
   */
  function clearCurrentHighlight() {
    if (!svgElement || currentTimezone === null) return;

    const groupId = timezoneToSvgId(currentTimezone);
    const group = svgElement.getElementById(groupId);
    if (group) {
      const shapes = group.querySelectorAll("polygon, rect, path");
      shapes.forEach(resetShapeStyle);
    }
    currentTimezone = null;
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
  function highlightTimezone(timezone, forceRefreshSvg = false) {
    if (timezone === null || timezone === undefined) return;

    // Store for later use (view changes)
    lastKnownTimezone = timezone;

    // Refresh SVG reference if requested or not set
    if (forceRefreshSvg || !svgElement) {
      svgElement = getSvgDocument();
    }

    // If SVG still not ready, store for later
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

    // Skip if same as current (unless forcing refresh)
    if (timezone === currentTimezone && !forceRefreshSvg) return;

    // Clear only the previous highlight (not all timezones)
    clearCurrentHighlight();

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
      highlightTimezone(timezone, true); // Force refresh SVG reference
    }
  }

  /**
   * Handle view changes - re-apply highlight when WORLD view becomes active
   */
  function onViewChange(mutations) {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target;

        // Check if a view became active
        if (
          target.classList.contains("view") &&
          target.classList.contains("active")
        ) {
          // Check if this view contains our timezone map
          const hasTzMap =
            target.querySelector(".visual-map-content svg#Layer_3") ||
            target.querySelector("svg#Layer_3");

          if (hasTzMap && lastKnownTimezone !== null) {
            console.log("[ZHD-Timezone] View changed, re-applying highlight");
            // Small delay to ensure SVG is fully ready
            setTimeout(() => {
              currentTimezone = null; // Reset to force re-highlight
              svgElement = null; // Reset SVG reference
              highlightTimezone(lastKnownTimezone, true);
            }, 100);
          }
        }
      }
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

    // Watch for view changes (class changes on .view elements)
    const viewObserver = new MutationObserver(onViewChange);
    const mainElement = document.querySelector("main") || document.body;
    viewObserver.observe(mainElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

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

        // Re-apply last known timezone if available
        if (lastKnownTimezone !== null) {
          setTimeout(() => highlightTimezone(lastKnownTimezone, true), 100);
        }
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
    refresh: () => highlightTimezone(lastKnownTimezone, true),
  };
})();
