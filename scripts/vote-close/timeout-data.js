/***********************
 * TIMEOUT-DATA.JS
 * Data integration for timeout.html
 *
 * ALL DATA IS FIXED AT PAGE LOAD - no live updates
 *
 * - Fetches user data from Google Sheet
 * - Updates "your final score"
 * - Updates ALIGN section (same as index.html)
 * - Updates WORLD section with fixed ranking
 * - Colors the recap raggiere based on activities
 * - Populates the comparison table
 *
 * NOTE: Comment sections are handled by timeout-comments.js
 ***********************/

(function () {
  /***********************
   * CONFIGURATION
   ***********************/
  const CONFIG = {
    SHEET_ID: "19eSx-gfbzfAWqs1OYJLPqaqqev62wfokldr9JP6Uezk",
    APP_SCRIPT_ID:
      "AKfycbyYyqsaSuWRgE1ipYzAqW_rDzwxwAIYxR3TGO-ohX0AUB0t0c1wTJMtbTFqjJqlN4IH",
    SEGMENT_ID_PREFIX: "_x3C_Rettangolo",
    SEGMENT_ID_SUFFIX: "_x3E_",
    NUM_SEGMENTS: 24,
    STAGGER_DELAY: 30,
    INITIAL_OPACITY: 0.2,
    ACTIVE_OPACITY: 1,
    INACTIVE_OPACITY: 0.2,
  };

  CONFIG.SHEET_URL = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json`;
  CONFIG.SCRIPT_URL = `https://script.google.com/macros/s/${CONFIG.APP_SCRIPT_ID}/exec`;

  /***********************
   * ACTIVITY COLORS & MAPS
   ***********************/
  const ACTIVITY_COLORS = {
    Sleep: "#566CD2", // Blue
    Work: "#A51538", // Red
    Eat: "#E1A65E", // Yellow
    Other: "#1A8E8F", // Green
  };

  const ACTIVITY_MAP = {
    "Sleeping time": "Sleep",
    "Working time": "Work",
    "Other time": "Other",
    "Eating time": "Eat",
  };

  const ACTIVITY_DISPLAY = {
    Sleep: "sleep",
    Work: "work",
    Eat: "eat",
    Other: "other",
  };

  /***********************
   * T_0 MODEL
   ***********************/
  const T_0_MODEL = {
    0: "Sleep",
    1: "Sleep",
    2: "Sleep",
    3: "Sleep",
    4: "Sleep",
    5: "Sleep",
    6: "Sleep",
    7: "Eat",
    8: "Other",
    9: "Work",
    10: "Work",
    11: "Work",
    12: "Work",
    13: "Eat",
    14: "Work",
    15: "Work",
    16: "Work",
    17: "Work",
    18: "Other",
    19: "Eat",
    20: "Other",
    21: "Other",
    22: "Other",
    23: "Sleep",
  };

  /***********************
   * TIMEZONE MAP HIGHLIGHT STYLING
   ***********************/
  const TZ_HIGHLIGHT = {
    FILL: "rgba(255, 204, 0, 0.4)",
    STROKE: "#cc9900",
    STROKE_WIDTH: "1.5px",
  };

  /***********************
   * UTILITY FUNCTIONS
   ***********************/
  function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function getTimezoneFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const tz = params.get("tz");
    return tz ? parseInt(tz, 10) : null;
  }

  function normalizeActivity(activity) {
    return ACTIVITY_MAP[activity] || "Other";
  }

  function expandTo24Hours(blocks) {
    const hours = Array(24).fill(null);
    blocks.forEach((block) => {
      for (let h = block.s; h < block.e; h++) {
        hours[h] = { hour: h, activity: block.a };
      }
    });
    return hours;
  }

  function formatScoreItalian(score) {
    if (score === null || score === undefined) return "—";
    return score.toFixed(1).replace(".", ",") + "%";
  }

  function formatScoreItalianNoPercent(score) {
    if (score === null || score === undefined) return "—";
    return score.toFixed(1).replace(".", ",");
  }

  function formatHour(hour) {
    return `${String(hour).padStart(2, "0")}:00`;
  }

  /***********************
   * SCORE CALCULATION
   ***********************/
  const ACTIVITIES = ["Sleep", "Work", "Other", "Eat"];
  const D_MAX = Math.sqrt(96);

  function activityToOneHot(activity) {
    const vector = [0, 0, 0, 0];
    const index = ACTIVITIES.indexOf(activity);
    if (index !== -1) vector[index] = 1;
    return vector;
  }

  function buildT0Vectors() {
    const vectors = [];
    for (let h = 0; h < 24; h++) {
      vectors.push(activityToOneHot(T_0_MODEL[h]));
    }
    return vectors;
  }

  function buildCitizenVectors(timeline) {
    const vectors = [];
    for (let h = 0; h < 24; h++) {
      const hourData = timeline[h];
      const rawActivity = hourData?.activity || "Other time";
      const activity = normalizeActivity(rawActivity);
      vectors.push(activityToOneHot(activity));
    }
    return vectors;
  }

  function calculateEuclideanDistance(vectorsA, vectorsB) {
    let sumSquares = 0;
    for (let h = 0; h < 24; h++) {
      for (let c = 0; c < 4; c++) {
        const diff = vectorsA[h][c] - vectorsB[h][c];
        sumSquares += diff * diff;
      }
    }
    return Math.sqrt(sumSquares);
  }

  function distanceToScore(distance) {
    return Math.max(0, (1 - distance / D_MAX) * 100);
  }

  function calculateScoreVsTn(timeline, T_model) {
    const citizenVectors = buildCitizenVectors(timeline);
    const distance = calculateEuclideanDistance(citizenVectors, T_model);
    return distanceToScore(distance);
  }

  function calculateCountryScore(allDati) {
    const tutteTimeline = [];
    allDati.forEach((datiStr) => {
      try {
        const blocks = JSON.parse(datiStr);
        tutteTimeline.push(expandTo24Hours(blocks));
      } catch (e) {}
    });

    const N = tutteTimeline.length;

    if (N === 0) {
      return { score: 0, numCittadini: 0, T_model: buildT0Vectors() };
    }

    const T_model_full = buildT0Vectors().map((row) => [...row]);
    tutteTimeline.forEach((tl) => {
      const vecs = buildCitizenVectors(tl);
      vecs.forEach((vec, h) => {
        for (let c = 0; c < 4; c++) {
          T_model_full[h][c] += vec[c];
        }
      });
    });

    for (let h = 0; h < 24; h++) {
      for (let c = 0; c < 4; c++) {
        T_model_full[h][c] /= N + 1;
      }
    }

    let sommaScore = 0;
    tutteTimeline.forEach((tl_i, i) => {
      const T_model_minus_i = buildT0Vectors().map((row) => [...row]);
      tutteTimeline.forEach((tl_j, j) => {
        if (i !== j) {
          const vecs = buildCitizenVectors(tl_j);
          vecs.forEach((vec, h) => {
            for (let c = 0; c < 4; c++) {
              T_model_minus_i[h][c] += vec[c];
            }
          });
        }
      });
      for (let h = 0; h < 24; h++) {
        for (let c = 0; c < 4; c++) {
          T_model_minus_i[h][c] /= N;
        }
      }
      sommaScore += calculateScoreVsTn(tl_i, T_model_minus_i);
    });

    return { score: sommaScore / N, numCittadini: N, T_model: T_model_full };
  }

  /***********************
   * ALIGN SECTION
   ***********************/
  function animateAlignSegments(container, activeSegments, useStagger = true) {
    if (!container) return;
    const svgHolder = container.querySelector(".svg-holder");
    if (!svgHolder) return;

    for (let i = 0; i < CONFIG.NUM_SEGMENTS; i++) {
      const elementId = `${CONFIG.SEGMENT_ID_PREFIX}${String(i).padStart(
        2,
        "0",
      )}${CONFIG.SEGMENT_ID_SUFFIX}`;
      const polygon = svgHolder.querySelector(`#${CSS.escape(elementId)}`);
      if (polygon) {
        const targetOpacity =
          i < activeSegments ? CONFIG.ACTIVE_OPACITY : CONFIG.INACTIVE_OPACITY;
        if (useStagger) {
          setTimeout(() => {
            polygon.style.fillOpacity = targetOpacity;
          }, i * CONFIG.STAGGER_DELAY);
        } else {
          polygon.style.fillOpacity = targetOpacity;
        }
      }
    }
  }

  function updatePersonalVisual(personalScore) {
    if (personalScore === null || personalScore === undefined) return;
    const activeSegments = Math.round(
      (personalScore / 100) * CONFIG.NUM_SEGMENTS,
    );
    const mainContainer = document.querySelector(".internal-graphic");
    animateAlignSegments(mainContainer, activeSegments, true);
    const overlayContainer = document.querySelector(
      "#align-personal-overlay .holder.int",
    );
    animateAlignSegments(overlayContainer, activeSegments, false);
    const personalScoreEl = document.querySelector(
      "#align-personal-overlay .view-score",
    );
    if (personalScoreEl)
      personalScoreEl.textContent = formatScoreItalian(personalScore);
  }

  function updateCountryVisual(countryScore) {
    if (countryScore === null || countryScore === undefined) return;
    const activeSegments = Math.round(
      (countryScore / 100) * CONFIG.NUM_SEGMENTS,
    );
    const mainContainer = document.querySelector(".external-graphic");
    animateAlignSegments(mainContainer, activeSegments, true);

    // Update BOTH ext raggiera in country overlay
    const overlayContainerExt = document.querySelector(
      "#align-country-overlay .holder.ext",
    );
    animateAlignSegments(overlayContainerExt, activeSegments, false);

    const countryScoreEl = document.querySelector(
      "#align-country-overlay .view-score",
    );
    if (countryScoreEl)
      countryScoreEl.textContent = formatScoreItalian(countryScore);
  }

  function updateAlignSection(personalScore, countryScore) {
    const personalBtn = document.getElementById("personal-value-btn");
    if (personalBtn) {
      const valueEl = personalBtn.querySelector(".value-percentage");
      if (valueEl) valueEl.textContent = formatScoreItalian(personalScore);
    }
    const countryBtn = document.getElementById("country-value-btn");
    if (countryBtn) {
      const valueEl = countryBtn.querySelector(".value-percentage");
      if (valueEl) valueEl.textContent = formatScoreItalian(countryScore);
    }

    // Update ALL comments via timeout-comments.js
    if (
      window.TimeoutComments &&
      typeof window.TimeoutComments.setScores === "function"
    ) {
      window.TimeoutComments.setScores(personalScore, countryScore);
      console.log(
        "[Timeout-Data] Comments updated via TimeoutComments.setScores()",
      );
    } else {
      console.warn(
        "[Timeout-Data] TimeoutComments not available - make sure timeout-comments.js is loaded BEFORE timeout-data.js",
      );
    }

    updatePersonalVisual(personalScore);
    updateCountryVisual(countryScore);
  }

  /***********************
   * WORLD SECTION - FIXED RANKING
   ***********************/
  let fixedRanking = [];
  let fixedWinnerTimezone = null;

  async function fetchAndFixRanking() {
    try {
      const [rankingResponse, winnerResponse] = await Promise.all([
        fetch(`${CONFIG.SCRIPT_URL}?action=ranking&top=50&t=${Date.now()}`),
        fetch(`${CONFIG.SCRIPT_URL}?action=winner&t=${Date.now()}`),
      ]);

      const [rankingData, winnerData] = await Promise.all([
        rankingResponse.json(),
        winnerResponse.json(),
      ]);

      if (!rankingData.error && rankingData.ranking) {
        fixedRanking = rankingData.ranking;
        console.log(
          "[Timeout-Data] Fixed ranking loaded:",
          fixedRanking.length,
          "countries",
        );
      }

      if (!winnerData.error && winnerData.timezone) {
        fixedWinnerTimezone = winnerData.timezone;
        console.log(
          "[Timeout-Data] Fixed winner timezone:",
          fixedWinnerTimezone,
        );
      }

      // Update UI with fixed data
      updateWorldSection();
    } catch (error) {
      console.error("[Timeout-Data] Failed to fetch ranking:", error);
    }
  }

  function updateWorldSection() {
    // Update winner marquee
    if (fixedRanking.length > 0) {
      const winner = fixedRanking[0];
      updateWinnerMarquee(winner.country);
      renderRankingPreview(fixedRanking);
      renderCompleteList(fixedRanking);
    }

    // Highlight timezone on map
    if (fixedWinnerTimezone) {
      waitForMapAndHighlight(fixedWinnerTimezone);
    }
  }

  function updateWinnerMarquee(countryName) {
    const track = document.getElementById("track");
    if (!track) return;

    // Clear and create marquee content (3 copies for seamless loop)
    track.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const span = document.createElement("span");
      span.id = "text";
      span.textContent = countryName;
      track.appendChild(span);
    }

    console.log("[Timeout-Data] Winner marquee updated:", countryName);
  }

  function renderRankingPreview(ranking) {
    const container = document.getElementById("rank-preview");
    if (!container) return;

    container.innerHTML = "";
    const top5 = ranking.slice(0, 5);

    top5.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "line-ranking";
      if (item.country === "Italy") row.classList.add("highlight");

      row.innerHTML = `
        <div class="name-position">
          <div class="rank-position">#${String(index + 1).padStart(
            3,
            "0",
          )}</div>
          <div class="country-name">${item.country}</div>
        </div>
        <div class="country-rank-score">${formatScoreItalian(item.score)}</div>
      `;

      container.appendChild(row);
    });
  }

  function renderCompleteList(ranking) {
    const container = document.getElementById("complete-list");
    if (!container) return;

    container.innerHTML = "";

    ranking.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "line-ranking";
      if (item.country === "Italy") row.classList.add("highlight");

      row.innerHTML = `
        <div class="name-position">
          <div class="rank-position">#${String(index + 1).padStart(
            3,
            "0",
          )}</div>
          <div class="country-name">${item.country}</div>
        </div>
        <div class="country-rank-score">${formatScoreItalian(item.score)}</div>
      `;

      container.appendChild(row);
    });

    console.log(
      "[Timeout-Data] Complete list rendered:",
      ranking.length,
      "countries",
    );
  }

  /***********************
   * TIMEZONE MAP HIGHLIGHT
   ***********************/
  function highlightTimezone(svgElement, timezone) {
    if (!svgElement || !timezone) return;

    const groupId = `_tz${timezone}`;
    const group = svgElement.getElementById(groupId);

    if (group) {
      const shapes = group.querySelectorAll("polygon, rect, path");
      shapes.forEach((shape) => {
        shape.style.fill = TZ_HIGHLIGHT.FILL;
        shape.style.stroke = TZ_HIGHLIGHT.STROKE;
        shape.style.strokeWidth = TZ_HIGHLIGHT.STROKE_WIDTH;
        shape.style.strokeMiterlimit = "10";
      });
      console.log(
        `[Timeout-Data] Highlighted timezone ${timezone} (ID: ${groupId})`,
      );
    } else {
      console.warn(`[Timeout-Data] Timezone group ${groupId} not found`);
    }
  }

  function waitForMapAndHighlight(timezone) {
    // Try to find the map SVG
    const tryHighlight = () => {
      const mapSvg =
        document.querySelector(".visual-map-content .svg-holder svg") ||
        document.querySelector("svg#Layer_3");
      if (mapSvg) {
        highlightTimezone(mapSvg, timezone);
        return true;
      }
      return false;
    };

    // Try immediately
    if (tryHighlight()) return;

    // Listen for svg-injected event
    const handler = (event) => {
      const { svg, container } = event.detail;
      if (
        svg?.id === "Layer_3" ||
        container?.classList.contains("visual-map-content")
      ) {
        highlightTimezone(svg, timezone);
        document.removeEventListener("svg-injected", handler);
      }
    };
    document.addEventListener("svg-injected", handler);

    // Fallback retries
    setTimeout(tryHighlight, 500);
    setTimeout(tryHighlight, 1000);
    setTimeout(tryHighlight, 2000);
  }

  /***********************
   * RECAP SECTION - COLORED RAGGIERE
   ***********************/
  function colorRaggiera(
    container,
    timeline,
    useT0 = false,
    useStagger = true,
  ) {
    if (!container) return;
    const svgHolder = container.querySelector(".svg-holder");
    if (!svgHolder) return;
    const svg = svgHolder.querySelector("svg");
    if (!svg) return;

    for (let hour = 0; hour < CONFIG.NUM_SEGMENTS; hour++) {
      const segmentId = `${CONFIG.SEGMENT_ID_PREFIX}${String(hour).padStart(
        2,
        "0",
      )}${CONFIG.SEGMENT_ID_SUFFIX}`;
      const segment = svgHolder.querySelector(`#${CSS.escape(segmentId)}`);

      if (segment) {
        let activity;
        if (useT0) {
          activity = T_0_MODEL[hour];
        } else if (timeline && timeline[hour]) {
          activity = normalizeActivity(timeline[hour].activity);
        } else {
          activity = "Other";
        }

        const color = ACTIVITY_COLORS[activity] || ACTIVITY_COLORS.Other;
        segment.style.fill = color;
        segment.style.fillOpacity = CONFIG.INITIAL_OPACITY;

        if (useStagger) {
          setTimeout(() => {
            segment.style.transition = "fill-opacity 0.2s ease-out";
            segment.style.fillOpacity = 1;
          }, hour * CONFIG.STAGGER_DELAY);
        } else {
          segment.style.fillOpacity = 1;
        }
      }
    }
  }

  /***********************
   * COMPARISON TABLE
   ***********************/
  function populateComparisonTable(userTimeline) {
    const container = document.querySelector("#measure-compare .rank-content");
    if (!container) return;

    container.innerHTML = "";

    for (let hour = 0; hour < 24; hour++) {
      let userActivity = "Other";
      if (userTimeline && userTimeline[hour]) {
        userActivity = normalizeActivity(userTimeline[hour].activity);
      }
      const nationActivity = T_0_MODEL[hour];

      const row = document.createElement("div");
      row.className = "line-ranking";

      const userDiv = document.createElement("div");
      userDiv.className = "activity-chosen";
      userDiv.textContent = ACTIVITY_DISPLAY[userActivity] || "other";
      userDiv.style.color =
        ACTIVITY_COLORS[userActivity] || ACTIVITY_COLORS.Other;

      const hourDiv = document.createElement("div");
      hourDiv.className = "hour-of-day";
      hourDiv.textContent = formatHour(hour);

      const nationDiv = document.createElement("div");
      nationDiv.className = "activity-chosen";
      nationDiv.textContent = ACTIVITY_DISPLAY[nationActivity] || "other";
      nationDiv.style.color =
        ACTIVITY_COLORS[nationActivity] || ACTIVITY_COLORS.Other;

      row.appendChild(userDiv);
      row.appendChild(hourDiv);
      row.appendChild(nationDiv);
      container.appendChild(row);
    }
  }

  /***********************
   * UI UPDATES
   ***********************/
  function updateFinalScore(score) {
    const scoreEl = document.getElementById("final-score");
    if (scoreEl) {
      scoreEl.innerHTML = `${formatScoreItalianNoPercent(
        score,
      )}<span style="font-size: 3rem">%</span>`;
    }
  }

  function updateUserId(userId) {
    const userIdEl = document.getElementById("user-id");
    if (userIdEl) userIdEl.textContent = userId || "—";
  }

  /***********************
   * MAIN INITIALIZATION
   ***********************/
  async function init() {
    const userId = getUserIdFromUrl();
    updateUserId(userId);

    // Fetch and fix ranking immediately (doesn't update after)
    fetchAndFixRanking();

    if (!userId) {
      console.warn("[Timeout-Data] No user ID in URL");
      updateFinalScore(0);
      return;
    }

    try {
      const response = await fetch(CONFIG.SHEET_URL);
      const text = await response.text();
      const jsonText = text.substring(47, text.length - 2);
      const data = JSON.parse(jsonText);

      const rows = data.table.rows.map((row) => ({
        ID: row.c[1]?.v,
        Dati: row.c[2]?.v,
      }));

      const tuttiDati = rows.map((r) => r.Dati).filter(Boolean);
      const countryResult = calculateCountryScore(tuttiDati);
      const countryScore = countryResult.score;

      const userRow = rows.find((r) => String(r.ID) === String(userId));

      if (userRow && userRow.Dati) {
        const blocks = JSON.parse(userRow.Dati);
        const userTimeline = expandTo24Hours(blocks);

        const altriDati = rows
          .filter((r) => String(r.ID) !== String(userId))
          .map((r) => r.Dati)
          .filter(Boolean);

        let T_model = buildT0Vectors();
        if (altriDati.length > 0) {
          T_model = buildT0Vectors().map((row) => [...row]);
          altriDati.forEach((datiStr) => {
            try {
              const bl = JSON.parse(datiStr);
              const tl = expandTo24Hours(bl);
              const vecs = buildCitizenVectors(tl);
              vecs.forEach((vec, h) => {
                for (let c = 0; c < 4; c++) {
                  T_model[h][c] += vec[c];
                }
              });
            } catch (e) {}
          });
          const N = altriDati.length;
          for (let h = 0; h < 24; h++) {
            for (let c = 0; c < 4; c++) {
              T_model[h][c] /= N + 1;
            }
          }
        }

        const personalScore = calculateScoreVsTn(userTimeline, T_model);

        console.log("[Timeout-Data] User found:", userId);
        console.log("[Timeout-Data] Personal score:", personalScore.toFixed(1));
        console.log("[Timeout-Data] Country score:", countryScore.toFixed(1));

        updateFinalScore(personalScore);
        populateComparisonTable(userTimeline);
        updateAlignSection(personalScore, countryScore);
        waitForSvgsAndColor(userTimeline);
      } else {
        console.warn("[Timeout-Data] User not found:", userId);
        updateFinalScore(0);
        updateAlignSection(null, countryScore);
      }
    } catch (error) {
      console.error("[Timeout-Data] Error fetching data:", error);
      updateFinalScore(0);
    }
  }

  /***********************
   * WAIT FOR SVG INJECTION (RECAP RAGGIERE)
   ***********************/
  let userTimelineGlobal = null;
  let personalAnimated = false;
  let nationAnimated = false;

  function waitForSvgsAndColor(userTimeline) {
    userTimelineGlobal = userTimeline;
    personalAnimated = false;
    nationAnimated = false;

    document.addEventListener("svg-injected", onSvgInjected);
    tryColorRaggiere(true);
    setTimeout(() => tryColorRaggiere(true), 500);
    setTimeout(() => tryColorRaggiere(true), 1000);
    setTimeout(() => tryColorRaggiere(true), 2000);
  }

  function onSvgInjected(event) {
    const { container } = event.detail;
    if (!userTimelineGlobal) return;

    if (container?.id === "personal-measure-raggiera" && !personalAnimated) {
      colorRaggiera(container, userTimelineGlobal, false, true);
      personalAnimated = true;
    } else if (container?.id === "nation-measure-raggiera" && !nationAnimated) {
      setTimeout(
        () => {
          colorRaggiera(container, userTimelineGlobal, true, true);
          nationAnimated = true;
        },
        CONFIG.NUM_SEGMENTS * CONFIG.STAGGER_DELAY + 100,
      );
    }
  }

  function tryColorRaggiere(useStagger = true) {
    if (!userTimelineGlobal) return;

    const personalRaggiera = document.getElementById(
      "personal-measure-raggiera",
    );
    const nationRaggiera = document.getElementById("nation-measure-raggiera");

    if (
      personalRaggiera?.querySelector(".svg-holder svg") &&
      !personalAnimated
    ) {
      colorRaggiera(personalRaggiera, userTimelineGlobal, false, useStagger);
      personalAnimated = true;
    }

    if (nationRaggiera?.querySelector(".svg-holder svg") && !nationAnimated) {
      const delay = useStagger
        ? CONFIG.NUM_SEGMENTS * CONFIG.STAGGER_DELAY + 100
        : 0;
      setTimeout(() => {
        if (!nationAnimated) {
          colorRaggiera(nationRaggiera, userTimelineGlobal, true, useStagger);
          nationAnimated = true;
        }
      }, delay);
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

  // Export for debugging
  window.TimeoutData = {
    colorRaggiera,
    populateComparisonTable,
    updateAlignSection,
    updateWorldSection,
    highlightTimezone,
    ACTIVITY_COLORS,
    T_0_MODEL,
    getFixedRanking: () => fixedRanking,
    getFixedTimezone: () => fixedWinnerTimezone,
  };
})();
