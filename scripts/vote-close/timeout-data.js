/***********************
 * TIMEOUT-DATA.JS
 * Data integration for timeout.html
 *
 * - Fetches user data from Google Sheet
 * - Updates "your final score"
 * - Colors the raggiere based on activities with staggered animation:
 *   - Sleep = Blue (#0066cc)
 *   - Work = Red (#cc0000)
 *   - Eat = Yellow (#cccc00)
 *   - Other = Green (#00cc66)
 ***********************/

(function () {
  /***********************
   * CONFIGURATION
   ***********************/
  const CONFIG = {
    SHEET_ID: "19eSx-gfbzfAWqs1OYJLPqaqqev62wfokldr9JP6Uezk",
    SEGMENT_ID_PREFIX: "_x3C_Rettangolo",
    SEGMENT_ID_SUFFIX: "_x3E_",
    NUM_SEGMENTS: 24,
    STAGGER_DELAY: 30, // delay between each segment animation (ms)
    INITIAL_OPACITY: 0.2, // starting opacity before animation
  };

  CONFIG.SHEET_URL = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json`;

  /***********************
   * ACTIVITY COLORS
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

  /***********************
   * T_0 MODEL (ideal day)
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
   * UTILITY FUNCTIONS
   ***********************/
  function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
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
    return score.toFixed(1).replace(".", ",");
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

  /***********************
   * RAGGIERA COLORING WITH STAGGERED ANIMATION
   ***********************/
  function colorRaggiera(
    container,
    timeline,
    useT0 = false,
    useStagger = true
  ) {
    if (!container) {
      console.warn("[Timeout-Data] Container not found for raggiera");
      return;
    }

    const svgHolder = container.querySelector(".svg-holder");
    if (!svgHolder) {
      console.warn("[Timeout-Data] SVG holder not found");
      return;
    }

    const svg = svgHolder.querySelector("svg");
    if (!svg) {
      console.warn("[Timeout-Data] SVG not found in holder");
      return;
    }

    for (let hour = 0; hour < CONFIG.NUM_SEGMENTS; hour++) {
      const segmentId = `${CONFIG.SEGMENT_ID_PREFIX}${String(hour).padStart(
        2,
        "0"
      )}${CONFIG.SEGMENT_ID_SUFFIX}`;
      const segment = svgHolder.querySelector(`#${CSS.escape(segmentId)}`);

      if (segment) {
        let activity;
        if (useT0) {
          // Use T_0 model (nation's ideal measure)
          activity = T_0_MODEL[hour];
        } else if (timeline && timeline[hour]) {
          // Use user's timeline
          activity = normalizeActivity(timeline[hour].activity);
        } else {
          activity = "Other";
        }

        const color = ACTIVITY_COLORS[activity] || ACTIVITY_COLORS.Other;

        // Set initial state (low opacity)
        segment.style.fill = color;
        segment.style.fillOpacity = CONFIG.INITIAL_OPACITY;

        // Animate with stagger
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

    console.log(
      `[Timeout-Data] Colored raggiera ${
        useT0 ? "(T0 model)" : "(user data)"
      } with ${useStagger ? "staggered" : "instant"} animation`
    );
  }

  /***********************
   * UI UPDATES
   ***********************/
  function updateFinalScore(score) {
    const scoreEl = document.getElementById("final-score");
    if (scoreEl) {
      scoreEl.innerHTML = `${formatScoreItalian(
        score
      )}<span style="font-size: 3rem">%</span>`;
    }
  }

  function updateUserId(userId) {
    const userIdEl = document.getElementById("user-id");
    if (userIdEl) {
      userIdEl.textContent = userId || "—";
    }
  }

  /***********************
   * MAIN INITIALIZATION
   ***********************/
  async function init() {
    const userId = getUserIdFromUrl();
    updateUserId(userId);

    if (!userId) {
      console.warn("[Timeout-Data] No user ID in URL");
      updateFinalScore(0);
      return;
    }

    try {
      // Fetch data from Google Sheet
      const response = await fetch(CONFIG.SHEET_URL);
      const text = await response.text();
      const jsonText = text.substring(47, text.length - 2);
      const data = JSON.parse(jsonText);

      const rows = data.table.rows.map((row) => ({
        ID: row.c[1]?.v,
        Dati: row.c[2]?.v,
      }));

      // Find user data
      const userRow = rows.find((r) => String(r.ID) === String(userId));

      if (userRow && userRow.Dati) {
        const blocks = JSON.parse(userRow.Dati);
        const userTimeline = expandTo24Hours(blocks);

        // Calculate score (leave-one-out)
        const altriDati = rows
          .filter((r) => String(r.ID) !== String(userId))
          .map((r) => r.Dati)
          .filter(Boolean);

        let T_model = buildT0Vectors();

        if (altriDati.length > 0) {
          // Build T_model from other users
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
        updateFinalScore(personalScore);

        console.log("[Timeout-Data] User found:", userId);
        console.log("[Timeout-Data] Personal score:", personalScore.toFixed(1));

        // Wait for SVGs to be injected, then color them with animation
        waitForSvgsAndColor(userTimeline);
      } else {
        console.warn("[Timeout-Data] User not found:", userId);
        updateFinalScore(0);
      }
    } catch (error) {
      console.error("[Timeout-Data] Error fetching data:", error);
      updateFinalScore(0);
    }
  }

  /***********************
   * WAIT FOR SVG INJECTION
   ***********************/
  let userTimelineGlobal = null;
  let personalAnimated = false;
  let nationAnimated = false;

  function waitForSvgsAndColor(userTimeline) {
    userTimelineGlobal = userTimeline;
    personalAnimated = false;
    nationAnimated = false;

    // Listen for svg-injected event
    document.addEventListener("svg-injected", onSvgInjected);

    // Try immediately in case SVGs are already loaded
    tryColorRaggiere(true);

    // Fallback: retry after delays
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
      // Delay nation raggiera animation to start after personal finishes
      setTimeout(() => {
        colorRaggiera(container, userTimelineGlobal, true, true);
        nationAnimated = true;
      }, CONFIG.NUM_SEGMENTS * CONFIG.STAGGER_DELAY + 100);
    }
  }

  function tryColorRaggiere(useStagger = true) {
    if (!userTimelineGlobal) return;

    const personalRaggiera = document.getElementById(
      "personal-measure-raggiera"
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
      // Delay nation raggiera animation
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
    ACTIVITY_COLORS,
    T_0_MODEL,
    tryColorRaggiere,
  };
})();
