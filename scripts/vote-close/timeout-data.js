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
      "AKfycbw0m6meuxpGeOBiBrRohZ-rptpb8XmiYBMF3ayD_aqwT9xvQ_nMlRk5YiXlK9RSfQrl",
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
    Sleep: "#566CD2",
    Work: "#A51538",
    Eat: "#E1A65E",
    Other: "#1A8E8F",
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

  const TZ_HIGHLIGHT = {
    FILL: "#1a1a1a2f",
    STROKE: "#1a1a1a",
    STROKE_WIDTH: "1px",
  };

  /***********************
   * UTILITY FUNCTIONS
   ***********************/
  function getUserIdFromUrl() {
    return new URLSearchParams(window.location.search).get("id");
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
      vectors.push(activityToOneHot(normalizeActivity(rawActivity)));
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
        tutteTimeline.push(expandTo24Hours(JSON.parse(datiStr)));
      } catch (e) {}
    });

    const N = tutteTimeline.length;
    if (N === 0)
      return { score: 0, numCittadini: 0, T_model: buildT0Vectors() };

    const T_model_full = buildT0Vectors().map((row) => [...row]);
    tutteTimeline.forEach((tl) => {
      const vecs = buildCitizenVectors(tl);
      vecs.forEach((vec, h) => {
        for (let c = 0; c < 4; c++) T_model_full[h][c] += vec[c];
      });
    });
    for (let h = 0; h < 24; h++) {
      for (let c = 0; c < 4; c++) T_model_full[h][c] /= N + 1;
    }

    let sommaScore = 0;
    tutteTimeline.forEach((tl_i, i) => {
      const T_model_minus_i = buildT0Vectors().map((row) => [...row]);
      tutteTimeline.forEach((tl_j, j) => {
        if (i !== j) {
          const vecs = buildCitizenVectors(tl_j);
          vecs.forEach((vec, h) => {
            for (let c = 0; c < 4; c++) T_model_minus_i[h][c] += vec[c];
          });
        }
      });
      for (let h = 0; h < 24; h++) {
        for (let c = 0; c < 4; c++) T_model_minus_i[h][c] /= N;
      }
      sommaScore += calculateScoreVsTn(tl_i, T_model_minus_i);
    });

    return { score: sommaScore / N, numCittadini: N, T_model: T_model_full };
  }

  /***********************
   * FORCE SVG INJECTION
   ***********************/
  async function forceInjectSvg(container) {
    if (!container) return null;
    const url = container.dataset.svg;
    const holder = container.querySelector(".svg-holder");
    if (!url || !holder) return null;

    if (container.dataset.svgInjected === "1") {
      return holder.querySelector("svg");
    }

    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) return null;

      const svgText = await response.text();
      holder.innerHTML = svgText;

      const svg = holder.querySelector("svg");
      if (!svg) return null;

      svg.removeAttribute("width");
      svg.removeAttribute("height");
      container.dataset.svgInjected = "1";

      console.log("[Timeout-Data] Force injected SVG:", url);
      document.dispatchEvent(
        new CustomEvent("svg-injected", { detail: { svg, container } }),
      );

      return svg;
    } catch (err) {
      console.warn("[Timeout-Data] SVG injection error:", err);
      return null;
    }
  }

  async function forceInjectAlignSvgs() {
    const containers = [
      document.querySelector(".internal-graphic"),
      document.querySelector(".external-graphic"),
      document.querySelector("#align-personal-overlay .holder.int"),
      document.querySelector("#align-personal-overlay .holder.ext"),
      document.querySelector("#align-country-overlay .holder.int"),
      document.querySelector("#align-country-overlay .holder.ext"),
    ];

    for (const container of containers) {
      if (container && container.dataset.svg) {
        await forceInjectSvg(container);
      }
    }
    console.log("[Timeout-Data] Force injected all align SVGs");
  }

  /***********************
   * ALIGN SECTION
   ***********************/
  let alignPersonalScore = null;
  let alignCountryScore = null;
  let alignInternalAnimated = false;
  let alignExternalAnimated = false;
  let alignPersonalOverlayAnimated = false;
  let alignCountryOverlayAnimated = false;

  function animateAlignSegments(container, activeSegments, useStagger = true) {
    if (!container) return;
    const svgHolder = container.querySelector(".svg-holder");
    if (!svgHolder || !svgHolder.querySelector("svg")) return;

    for (let i = 0; i < CONFIG.NUM_SEGMENTS; i++) {
      const elementId = `${CONFIG.SEGMENT_ID_PREFIX}${String(i).padStart(2, "0")}${CONFIG.SEGMENT_ID_SUFFIX}`;
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
    alignPersonalScore = personalScore;
    const activeSegments = Math.round(
      (personalScore / 100) * CONFIG.NUM_SEGMENTS,
    );

    const mainContainer = document.querySelector(".internal-graphic");
    if (mainContainer?.querySelector(".svg-holder svg")) {
      animateAlignSegments(mainContainer, activeSegments, true);
      alignInternalAnimated = true;
      console.log(
        "[Timeout-Data] updatePersonalVisual: animated internal-graphic",
      );
    }

    const overlayContainer = document.querySelector(
      "#align-personal-overlay .holder.int",
    );
    if (overlayContainer?.querySelector(".svg-holder svg")) {
      animateAlignSegments(overlayContainer, activeSegments, false);
      alignPersonalOverlayAnimated = true;
    }

    const personalScoreEl = document.querySelector(
      "#align-personal-overlay .view-score",
    );
    if (personalScoreEl)
      personalScoreEl.textContent = formatScoreItalian(personalScore);
  }

  function updateCountryVisual(countryScore) {
    if (countryScore === null || countryScore === undefined) return;
    alignCountryScore = countryScore;
    const activeSegments = Math.round(
      (countryScore / 100) * CONFIG.NUM_SEGMENTS,
    );

    const mainContainer = document.querySelector(".external-graphic");
    if (mainContainer?.querySelector(".svg-holder svg")) {
      animateAlignSegments(mainContainer, activeSegments, true);
      alignExternalAnimated = true;
      console.log(
        "[Timeout-Data] updateCountryVisual: animated external-graphic",
      );
    }

    const overlayContainerExt = document.querySelector(
      "#align-country-overlay .holder.ext",
    );
    if (overlayContainerExt?.querySelector(".svg-holder svg")) {
      animateAlignSegments(overlayContainerExt, activeSegments, false);
      alignCountryOverlayAnimated = true;
    }

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

    if (
      window.TimeoutComments &&
      typeof window.TimeoutComments.setScores === "function"
    ) {
      window.TimeoutComments.setScores(personalScore, countryScore);
    }

    updatePersonalVisual(personalScore);
    updateCountryVisual(countryScore);
  }

  function tryAnimateAlignSvgs() {
    if (alignPersonalScore !== null && !alignInternalAnimated) {
      const mainContainer = document.querySelector(".internal-graphic");
      if (mainContainer?.querySelector(".svg-holder svg")) {
        const activeSegments = Math.round(
          (alignPersonalScore / 100) * CONFIG.NUM_SEGMENTS,
        );
        animateAlignSegments(mainContainer, activeSegments, true);
        alignInternalAnimated = true;
        console.log(
          "[Timeout-Data] tryAnimateAlignSvgs: animated internal-graphic",
        );
      }
    }

    if (alignCountryScore !== null && !alignExternalAnimated) {
      const mainContainer = document.querySelector(".external-graphic");
      if (mainContainer?.querySelector(".svg-holder svg")) {
        const activeSegments = Math.round(
          (alignCountryScore / 100) * CONFIG.NUM_SEGMENTS,
        );
        animateAlignSegments(mainContainer, activeSegments, true);
        alignExternalAnimated = true;
        console.log(
          "[Timeout-Data] tryAnimateAlignSvgs: animated external-graphic",
        );
      }
    }

    if (alignPersonalScore !== null && !alignPersonalOverlayAnimated) {
      const overlayContainer = document.querySelector(
        "#align-personal-overlay .holder.int",
      );
      if (overlayContainer?.querySelector(".svg-holder svg")) {
        const activeSegments = Math.round(
          (alignPersonalScore / 100) * CONFIG.NUM_SEGMENTS,
        );
        animateAlignSegments(overlayContainer, activeSegments, false);
        alignPersonalOverlayAnimated = true;
      }
    }

    if (alignCountryScore !== null && !alignCountryOverlayAnimated) {
      const overlayContainer = document.querySelector(
        "#align-country-overlay .holder.ext",
      );
      if (overlayContainer?.querySelector(".svg-holder svg")) {
        const activeSegments = Math.round(
          (alignCountryScore / 100) * CONFIG.NUM_SEGMENTS,
        );
        animateAlignSegments(overlayContainer, activeSegments, false);
        alignCountryOverlayAnimated = true;
      }
    }
  }

  /***********************
   * WORLD SECTION
   ***********************/
  let fixedRanking = [];
  let fixedWinnerTimezone = null;

  async function fetchAndFixRanking() {
    try {
      const [rankingResponse, winnerResponse] = await Promise.all([
        fetch(`${CONFIG.SCRIPT_URL}?action=ranking&all=true&t=${Date.now()}`),
        fetch(`${CONFIG.SCRIPT_URL}?action=winner&t=${Date.now()}`),
      ]);

      const [rankingData, winnerData] = await Promise.all([
        rankingResponse.json(),
        winnerResponse.json(),
      ]);

      let italyRank = null;

      if (!rankingData.error && rankingData.ranking) {
        fixedRanking = rankingData.ranking;
        console.log(
          "[Timeout-Data] Fixed ranking loaded:",
          fixedRanking.length,
          "countries",
        );

        if (rankingData.italy && rankingData.italy.rank) {
          italyRank = rankingData.italy.rank;
        } else {
          const italy = fixedRanking.find((r) => r.country === "Italy");
          if (italy) italyRank = italy.rank;
        }

        document.dispatchEvent(
          new CustomEvent("timeout-ranking-ready", {
            detail: {
              ranking: fixedRanking,
              italyRank,
              italy: rankingData.italy,
            },
          }),
        );
      }

      if (!winnerData.error && winnerData.timezone) {
        fixedWinnerTimezone = winnerData.timezone;
      }

      updateWorldSection();
    } catch (error) {
      console.error("[Timeout-Data] Failed to fetch ranking:", error);
    }
  }

  function updateWorldSection() {
    if (fixedRanking.length > 0) {
      updateWinnerMarquee(fixedRanking[0].country);
      renderRankingPreview(fixedRanking);
      renderCompleteList(fixedRanking);
    }
    if (fixedWinnerTimezone) waitForMapAndHighlight(fixedWinnerTimezone);
  }

  function updateWinnerMarquee(countryName) {
    const track = document.getElementById("track");
    if (!track) return;
    track.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const span = document.createElement("span");
      span.id = "text";
      span.textContent = countryName;
      track.appendChild(span);
    }
  }

  function renderRankingPreview(ranking) {
    const container = document.getElementById("rank-preview");
    if (!container) return;
    container.innerHTML = "";
    ranking.slice(0, 5).forEach((item, index) => {
      const row = document.createElement("div");
      row.className =
        "line-ranking" + (item.country === "Italy" ? " highlight" : "");
      row.innerHTML = `
        <div class="name-position">
          <div class="rank-position">#${String(index + 1).padStart(3, "0")}</div>
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
      row.className =
        "line-ranking" + (item.country === "Italy" ? " highlight" : "");
      row.innerHTML = `
        <div class="name-position">
          <div class="rank-position">#${String(index + 1).padStart(3, "0")}</div>
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
    const group = svgElement.getElementById(`_tz${timezone}`);
    if (group) {
      group.querySelectorAll("polygon, rect, path").forEach((shape) => {
        shape.style.fill = TZ_HIGHLIGHT.FILL;
        shape.style.stroke = TZ_HIGHLIGHT.STROKE;
        shape.style.strokeWidth = TZ_HIGHLIGHT.STROKE_WIDTH;
      });
    }
  }

  function waitForMapAndHighlight(timezone) {
    const tryHighlight = () => {
      const mapSvg = document.querySelector(
        ".visual-map-content .svg-holder svg",
      );
      if (mapSvg) {
        highlightTimezone(mapSvg, timezone);
        return true;
      }
      return false;
    };
    if (tryHighlight()) return;
    document.addEventListener("svg-injected", (event) => {
      if (event.detail.container?.classList.contains("visual-map-content")) {
        highlightTimezone(event.detail.svg, timezone);
      }
    });
    setTimeout(tryHighlight, 500);
    setTimeout(tryHighlight, 1000);
  }

  /***********************
   * RECAP SECTION
   ***********************/
  let userTimelineGlobal = null;
  let personalAnimated = false;
  let nationAnimated = false;

  function colorRaggiera(
    container,
    timeline,
    useT0 = false,
    useStagger = true,
  ) {
    if (!container) return;
    const svgHolder = container.querySelector(".svg-holder");
    if (!svgHolder?.querySelector("svg")) return;

    for (let hour = 0; hour < CONFIG.NUM_SEGMENTS; hour++) {
      const segmentId = `${CONFIG.SEGMENT_ID_PREFIX}${String(hour).padStart(2, "0")}${CONFIG.SEGMENT_ID_SUFFIX}`;
      const segment = svgHolder.querySelector(`#${CSS.escape(segmentId)}`);
      if (segment) {
        const activity = useT0
          ? T_0_MODEL[hour]
          : timeline?.[hour]
            ? normalizeActivity(timeline[hour].activity)
            : "Other";
        segment.style.fill = ACTIVITY_COLORS[activity] || ACTIVITY_COLORS.Other;
        segment.style.fillOpacity = CONFIG.INITIAL_OPACITY;
        if (useStagger) {
          setTimeout(() => {
            segment.style.fillOpacity = 1;
          }, hour * CONFIG.STAGGER_DELAY);
        } else {
          segment.style.fillOpacity = 1;
        }
      }
    }
  }

  function populateComparisonTable(userTimeline) {
    const container = document.querySelector("#measure-compare .rank-content");
    if (!container) return;
    container.innerHTML = "";
    for (let hour = 0; hour < 24; hour++) {
      const userActivity = userTimeline?.[hour]
        ? normalizeActivity(userTimeline[hour].activity)
        : "Other";
      const nationActivity = T_0_MODEL[hour];
      const row = document.createElement("div");
      row.className = "line-ranking";
      row.innerHTML = `
        <div class="activity-chosen" style="color: ${ACTIVITY_COLORS[userActivity]}">${ACTIVITY_DISPLAY[userActivity]}</div>
        <div class="hour-of-day">${formatHour(hour)}</div>
        <div class="activity-chosen" style="color: ${ACTIVITY_COLORS[nationActivity]}">${ACTIVITY_DISPLAY[nationActivity]}</div>
      `;
      container.appendChild(row);
    }
  }

  function waitForSvgsAndColor(userTimeline) {
    userTimelineGlobal = userTimeline;
    personalAnimated = false;
    nationAnimated = false;
    tryColorRaggiere(true);
    setTimeout(() => tryColorRaggiere(true), 500);
    setTimeout(() => tryColorRaggiere(true), 1000);
    tryAnimateAlignSvgs();
    setTimeout(() => tryAnimateAlignSvgs(), 500);
    setTimeout(() => tryAnimateAlignSvgs(), 1000);
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
      setTimeout(
        () => {
          if (!nationAnimated) {
            colorRaggiera(nationRaggiera, userTimelineGlobal, true, useStagger);
            nationAnimated = true;
          }
        },
        useStagger ? CONFIG.NUM_SEGMENTS * CONFIG.STAGGER_DELAY + 100 : 0,
      );
    }
  }

  /***********************
   * UI UPDATES
   ***********************/
  function updateFinalScore(score) {
    const scoreEl = document.getElementById("final-score");
    if (scoreEl)
      scoreEl.innerHTML = `${formatScoreItalianNoPercent(score)}<span style="font-size: 3rem">%</span>`;
  }

  function updateUserId(userId) {
    const userIdEl = document.getElementById("user-id");
    if (userIdEl) userIdEl.textContent = userId || "—";
  }

  /***********************
   * NO USER ID LAYOUT
   ***********************/
  function applyNoUserIdLayout() {
    const idSpace = document.querySelector(".id-space");
    if (idSpace) idSpace.style.display = "none";

    const pageHead = document.querySelector(".page-head.divide");
    if (pageHead) pageHead.style.justifyContent = "center";

    const personalBtn = document.getElementById("personal-value-btn");
    if (personalBtn) personalBtn.style.display = "none";

    const lineVertical = document.querySelector(".align-values .line-vertical");
    if (lineVertical) lineVertical.style.display = "none";

    const internalGraphic = document.querySelector(".internal-graphic");
    if (internalGraphic) internalGraphic.style.display = "none";

    const countryBtn = document.getElementById("country-value-btn");
    if (countryBtn) {
      countryBtn.style.width = "100%";
      countryBtn.style.display = "flex";
      countryBtn.style.flexDirection = "column";
    }

    // Sostituisci contenuto di .final-score-wrap nella sezione recap
    const finalScoreWrap = document.querySelector("#recap .final-score-wrap");
    if (finalScoreWrap) {
      finalScoreWrap.innerHTML = `
        <div class="final-score-content" style="display: flex; align-items: center; justify-content: center; height: 100%;">
          <p class="comment-content" id="recap-no-id-comment" style="text-align: center; padding: 20px;">
            Voting session ended. Your country is positioned <strong>#—</strong> on the global ranking.
          </p>
        </div>
      `;
    }

    console.log("[Timeout-Data] Applied no-user-ID layout");
  }

  function updateRecapNoIdComment(rankValue) {
    const commentEl = document.getElementById("recap-no-id-comment");
    if (!commentEl) return;

    let rankText = rankValue ? `#${rankValue}` : "#—";
    if (!rankValue && fixedRanking.length > 0) {
      const italy = fixedRanking.find((r) => r.country === "Italy");
      if (italy) rankText = `#${italy.rank}`;
    }

    commentEl.innerHTML = `Voting session ended. Your country is positioned <strong>${rankText}</strong> on the global ranking.`;
    console.log(
      "[Timeout-Data] Updated recap no-id comment with rank:",
      rankText,
    );
  }

  function updateNoUserComment() {
    const commentContent = document.querySelector(
      "#alignment .comment-section-wrap .comment-content",
    );

    const updateText = (rankValue) => {
      let rankText = rankValue ? `#${rankValue}` : "#—";
      if (!rankValue && fixedRanking.length > 0) {
        const italy = fixedRanking.find((r) => r.country === "Italy");
        if (italy) rankText = `#${italy.rank}`;
      }

      // Aggiorna commento nella sezione align
      if (commentContent) {
        commentContent.innerHTML = `Voting session ended. Your country is positioned ${rankText} on the global ranking.`;
      }

      // Aggiorna anche commento nella sezione recap
      updateRecapNoIdComment(rankValue);
    };

    updateText();
    document.addEventListener("timeout-ranking-ready", (event) => {
      if (event.detail.italyRank) updateText(event.detail.italyRank);
    });
    setTimeout(() => updateText(), 2000);
  }

  /***********************
   * OBSERVERS
   ***********************/
  function setupAlignSectionObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          if (mutation.target.classList.contains("active")) {
            setTimeout(() => tryAnimateAlignSvgs(), 100);
            setTimeout(() => tryAnimateAlignSvgs(), 300);
          }
        }
      }
    });

    ["alignment", "align-personal-overlay", "align-country-overlay"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el)
          observer.observe(el, {
            attributes: true,
            attributeFilter: ["class"],
          });
      },
    );
  }

  function onSvgInjected(event) {
    const { container } = event.detail;
    if (!container) return;

    if (userTimelineGlobal) {
      if (container?.id === "personal-measure-raggiera" && !personalAnimated) {
        colorRaggiera(container, userTimelineGlobal, false, true);
        personalAnimated = true;
      } else if (
        container?.id === "nation-measure-raggiera" &&
        !nationAnimated
      ) {
        setTimeout(
          () => {
            colorRaggiera(container, userTimelineGlobal, true, true);
            nationAnimated = true;
          },
          CONFIG.NUM_SEGMENTS * CONFIG.STAGGER_DELAY + 100,
        );
      }
    }

    if (
      container.classList?.contains("internal-graphic") &&
      !alignInternalAnimated &&
      alignPersonalScore !== null
    ) {
      animateAlignSegments(
        container,
        Math.round((alignPersonalScore / 100) * CONFIG.NUM_SEGMENTS),
        true,
      );
      alignInternalAnimated = true;
    }

    if (
      container.classList?.contains("external-graphic") &&
      !alignExternalAnimated &&
      alignCountryScore !== null
    ) {
      animateAlignSegments(
        container,
        Math.round((alignCountryScore / 100) * CONFIG.NUM_SEGMENTS),
        true,
      );
      alignExternalAnimated = true;
    }
  }

  /***********************
   * MAIN INITIALIZATION
   ***********************/
  async function init() {
    const userId = getUserIdFromUrl();
    updateUserId(userId);
    setupAlignSectionObserver();
    document.addEventListener("svg-injected", onSvgInjected);
    fetchAndFixRanking();

    // FORZA L'INIEZIONE DEGLI SVG ALIGN SUBITO
    await forceInjectAlignSvgs();

    if (!userId) {
      console.warn("[Timeout-Data] No user ID in URL");
      applyNoUserIdLayout();

      try {
        const response = await fetch(CONFIG.SHEET_URL);
        const text = await response.text();
        const data = JSON.parse(text.substring(47, text.length - 2));
        const rows = data.table.rows.map((row) => ({
          ID: row.c[1]?.v,
          Dati: row.c[2]?.v,
        }));
        const tuttiDati = rows.map((r) => r.Dati).filter(Boolean);
        const countryScore = calculateCountryScore(tuttiDati).score;

        console.log(
          "[Timeout-Data] Country score (no user):",
          countryScore.toFixed(1),
        );
        updateAlignSection(null, countryScore);
        updateNoUserComment();
        tryAnimateAlignSvgs();
        setTimeout(() => tryAnimateAlignSvgs(), 500);
      } catch (error) {
        console.error("[Timeout-Data] Error:", error);
      }
      return;
    }

    try {
      const response = await fetch(CONFIG.SHEET_URL);
      const text = await response.text();
      const data = JSON.parse(text.substring(47, text.length - 2));
      const rows = data.table.rows.map((row) => ({
        ID: row.c[1]?.v,
        Dati: row.c[2]?.v,
      }));
      const tuttiDati = rows.map((r) => r.Dati).filter(Boolean);
      const countryScore = calculateCountryScore(tuttiDati).score;
      const userRow = rows.find((r) => String(r.ID) === String(userId));

      if (userRow && userRow.Dati) {
        const userTimeline = expandTo24Hours(JSON.parse(userRow.Dati));
        const altriDati = rows
          .filter((r) => String(r.ID) !== String(userId))
          .map((r) => r.Dati)
          .filter(Boolean);

        let T_model = buildT0Vectors();
        if (altriDati.length > 0) {
          T_model = buildT0Vectors().map((row) => [...row]);
          altriDati.forEach((datiStr) => {
            try {
              const vecs = buildCitizenVectors(
                expandTo24Hours(JSON.parse(datiStr)),
              );
              vecs.forEach((vec, h) => {
                for (let c = 0; c < 4; c++) T_model[h][c] += vec[c];
              });
            } catch (e) {}
          });
          for (let h = 0; h < 24; h++) {
            for (let c = 0; c < 4; c++) T_model[h][c] /= altriDati.length + 1;
          }
        }

        const personalScore = calculateScoreVsTn(userTimeline, T_model);
        console.log(
          "[Timeout-Data] User found:",
          userId,
          "Personal:",
          personalScore.toFixed(1),
          "Country:",
          countryScore.toFixed(1),
        );

        updateFinalScore(personalScore);
        populateComparisonTable(userTimeline);
        updateAlignSection(personalScore, countryScore);
        waitForSvgsAndColor(userTimeline);
      } else {
        console.warn("[Timeout-Data] User not found:", userId);
        updateFinalScore(0);
        updateAlignSection(null, countryScore);
        tryAnimateAlignSvgs();
        setTimeout(() => tryAnimateAlignSvgs(), 500);
      }
    } catch (error) {
      console.error("[Timeout-Data] Error:", error);
      updateFinalScore(0);
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

  window.TimeoutData = {
    colorRaggiera,
    populateComparisonTable,
    updateAlignSection,
    updateWorldSection,
    highlightTimezone,
    tryAnimateAlignSvgs,
    applyNoUserIdLayout,
    updateNoUserComment,
    forceInjectAlignSvgs,
    forceInjectSvg,
    updateRecapNoIdComment,
    ACTIVITY_COLORS,
    T_0_MODEL,
    getFixedRanking: () => fixedRanking,
    getFixedTimezone: () => fixedWinnerTimezone,
    getAlignScores: () => ({
      personal: alignPersonalScore,
      country: alignCountryScore,
    }),
  };
})();
