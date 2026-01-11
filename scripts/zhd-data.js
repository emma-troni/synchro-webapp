/***********************
 * ZHD-DATA.JS
 * Zero Hour Day - Data Integration for index.html
 * Integrates score.js and app.js logic
 ***********************/

/***********************
 * CONFIGURATION
 ***********************/

const ZHD_CONFIG = {
  SHEET_ID: "19eSx-gfbzfAWqs1OYJLPqaqqev62wfokldr9JP6Uezk",
  APP_SCRIPT_ID:
    "AKfycbxA3Pcrdu8E8Hg66VjdiIFWjx8ujo0Z9ibDlsmbSMZVdJzsDmmJfnke2JN9hiftFflQ",
  RANKING_REFRESH_INTERVAL: 180000,
  INITIAL_DELAY: 1000,
};

ZHD_CONFIG.SHEET_URL = `https://docs.google.com/spreadsheets/d/${ZHD_CONFIG.SHEET_ID}/gviz/tq?tqx=out:json`;
ZHD_CONFIG.SCRIPT_URL = `https://script.google.com/macros/s/${ZHD_CONFIG.APP_SCRIPT_ID}/exec`;

/***********************
 * SCORE.JS - Constants & Functions
 ***********************/

const ACTIVITIES = ["Sleep", "Work", "Other", "Eat"];

const ACTIVITY_MAP = {
  "Sleeping time": "Sleep",
  "Working time": "Work",
  "Other time": "Other",
  "Eating time": "Eat",
};

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

const D_MAX = Math.sqrt(96);

function normalizeActivity(activity) {
  return ACTIVITY_MAP[activity] || "Other";
}

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

function calculateScoreVsT0(timeline) {
  const t0Vectors = buildT0Vectors();
  const citizenVectors = buildCitizenVectors(timeline);
  const distance = calculateEuclideanDistance(citizenVectors, t0Vectors);
  return distanceToScore(distance);
}

function calculateScoreVsTn(timeline, T_model) {
  if (!T_model) return calculateScoreVsT0(timeline);
  const citizenVectors = buildCitizenVectors(timeline);
  const distance = calculateEuclideanDistance(citizenVectors, T_model);
  return distanceToScore(distance);
}

/***********************
 * APP.JS - Base Ranking Data
 ***********************/

const BASE_RANKING = [
  { country: "Japan", baseScore: 87.3 },
  { country: "Germany", baseScore: 86.2 },
  { country: "Switzerland", baseScore: 84.8 },
  { country: "Netherlands", baseScore: 84.3 },
  { country: "South Korea", baseScore: 84.3 },
  { country: "Denmark", baseScore: 84.1 },
  { country: "Finland", baseScore: 84.0 },
  { country: "North Korea", baseScore: 83.8 },
  { country: "Sweden", baseScore: 81.8 },
  { country: "Norway", baseScore: 81.4 },
  { country: "Czechia", baseScore: 80.9 },
  { country: "Austria", baseScore: 80.8 },
  { country: "Singapore", baseScore: 80.5 },
  { country: "Estonia", baseScore: 79.6 },
  { country: "Taiwan", baseScore: 78.9 },
  { country: "Belgium", baseScore: 78.5 },
  { country: "Hungary", baseScore: 78.4 },
  { country: "Hong Kong", baseScore: 78.3 },
  { country: "Slovakia", baseScore: 78.1 },
  { country: "Poland", baseScore: 77.9 },
  { country: "United Kingdom", baseScore: 77.8 },
  { country: "Slovenia", baseScore: 77.5 },
  { country: "China", baseScore: 77.3 },
  { country: "France", baseScore: 76.8 },
  { country: "Lithuania", baseScore: 76.5 },
  { country: "Latvia", baseScore: 76.2 },
  { country: "Vatican City", baseScore: 76.0 },
  { country: "Ireland", baseScore: 75.6 },
  { country: "New Zealand", baseScore: 75.6 },
  { country: "Luxembourg", baseScore: 75.0 },
  { country: "Italy", baseScore: 74.3 },
  { country: "Belarus", baseScore: 74.1 },
  { country: "Croatia", baseScore: 73.1 },
  { country: "United States", baseScore: 73.0 },
  { country: "Vietnam", baseScore: 72.4 },
  { country: "Monaco", baseScore: 72.1 },
  { country: "Portugal", baseScore: 71.9 },
  { country: "Australia", baseScore: 71.7 },
  { country: "Chile", baseScore: 71.5 },
  { country: "Israel", baseScore: 71.2 },
  { country: "Turkmenistan", baseScore: 71.0 },
  { country: "Romania", baseScore: 71.0 },
  { country: "Costa Rica", baseScore: 70.8 },
  { country: "Uruguay", baseScore: 70.6 },
  { country: "Bulgaria", baseScore: 70.5 },
  { country: "Serbia", baseScore: 70.5 },
  { country: "Malta", baseScore: 70.4 },
  { country: "Mauritius", baseScore: 70.1 },
  { country: "Spain", baseScore: 70.1 },
  { country: "San Marino", baseScore: 69.9 },
  { country: "Greece", baseScore: 69.5 },
  { country: "Russia", baseScore: 68.9 },
  { country: "Cuba", baseScore: 68.8 },
  { country: "Turkey", baseScore: 68.6 },
  { country: "Thailand", baseScore: 68.5 },
  { country: "Brunei", baseScore: 68.2 },
  { country: "Ukraine", baseScore: 68.2 },
  { country: "Malaysia", baseScore: 68.1 },
  { country: "Barbados", baseScore: 68.0 },
  { country: "Andorra", baseScore: 67.8 },
  { country: "Tunisia", baseScore: 67.6 },
  { country: "Moldova", baseScore: 67.5 },
];

/***********************
 * GLOBAL STATE (exported for other scripts)
 ***********************/

window.ZHD = {
  currentRanking: [],
  italyData: { rank: 0, score: 0, citizens: 0 },
  personalScore: null, // null = no user data
  userTimeline: null,
  userId: null,
  isLoaded: false,
  hasUserData: false, // flag to indicate if user was found
  onDataReady: [],
};

/***********************
 * UTILITY FUNCTIONS
 ***********************/

function zhdGetUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function zhdFormatScoreItalian(score) {
  if (score === null || score === undefined) return "—";
  return score.toFixed(1).replace(".", ",") + "%";
}

function zhdExpandTo24Hours(blocks) {
  const hours = Array(24).fill(null);
  blocks.forEach((block) => {
    for (let h = block.s; h < block.e; h++) {
      hours[h] = { hour: h, activity: block.a };
    }
  });
  return hours;
}

function zhdGenerateLocalRanking(italyScore) {
  const ranking = BASE_RANKING.map((country) => ({
    country: country.country,
    score: country.country === "Italy" ? italyScore : country.baseScore,
    baseScore: country.baseScore,
  }));

  ranking.sort((a, b) => b.score - a.score);
  ranking.forEach((r, i) => (r.rank = i + 1));

  return ranking;
}

/***********************
 * T_n MODEL CALCULATION (LEAVE-ONE-OUT)
 ***********************/

function zhdCalcolaScorePaese(rowsDati) {
  const tutteTimeline = [];
  rowsDati.forEach((datiStr) => {
    try {
      const blocks = JSON.parse(datiStr);
      tutteTimeline.push(zhdExpandTo24Hours(blocks));
    } catch (e) {}
  });

  const N = tutteTimeline.length;

  if (N === 0) {
    return {
      score: 0,
      numCittadini: 0,
      T_model: buildT0Vectors(),
    };
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

  return {
    score: sommaScore / N,
    numCittadini: N,
    T_model: T_model_full,
  };
}

/***********************
 * API FUNCTIONS
 ***********************/

function zhdUpdateItalyOnSheet(scoreItalia) {
  const params = new URLSearchParams({
    action: "update",
    scoreItalia: scoreItalia.toString(),
    t: Date.now().toString(),
  });

  const img = new Image();
  img.src = `${ZHD_CONFIG.SCRIPT_URL}?${params.toString()}`;
  console.log("📤 Italy score sent:", scoreItalia.toFixed(1));
}

async function zhdFetchServerRanking() {
  try {
    const response = await fetch(
      `${ZHD_CONFIG.SCRIPT_URL}?action=ranking&top=50&t=${Date.now()}`
    );
    const data = await response.json();

    if (data.error) {
      console.error("❌ Server ranking error:", data.error);
      return;
    }

    window.ZHD.currentRanking = data.ranking;
    window.ZHD.italyData = data.italy;

    zhdUpdateCountryScore();
    zhdTriggerRankingUpdate();

    console.log("🔄 Ranking updated from server:", window.ZHD.italyData.rank);
  } catch (error) {
    console.error("❌ Failed to fetch ranking:", error);
  }
}

/***********************
 * UI UPDATE FUNCTIONS
 ***********************/

function zhdUpdatePersonalScore() {
  const personalBtn = document.getElementById("personal-value-btn");
  if (personalBtn) {
    const valueEl = personalBtn.querySelector(".value-percentage");
    if (valueEl) {
      valueEl.textContent = zhdFormatScoreItalian(window.ZHD.personalScore);
    }
  }

  const personalOverlay = document.querySelector(
    "#align-personal-overlay .view-score"
  );
  if (personalOverlay) {
    personalOverlay.textContent = zhdFormatScoreItalian(
      window.ZHD.personalScore
    );
  }

  // trigger visual update if score-svg-display.js is loaded
  if (typeof updatePersonalVisual === "function") {
    updatePersonalVisual();
  }
}

function zhdUpdateCountryScore() {
  const countryBtn = document.getElementById("country-value-btn");
  if (countryBtn) {
    const valueEl = countryBtn.querySelector(".value-percentage");
    if (valueEl) {
      valueEl.textContent = zhdFormatScoreItalian(window.ZHD.italyData.score);
    }
  }

  const countryOverlay = document.querySelector(
    "#align-country-overlay .view-score"
  );
  if (countryOverlay) {
    countryOverlay.textContent = zhdFormatScoreItalian(
      window.ZHD.italyData.score
    );
  }

  zhdUpdateCommentSection();

  // Trigger visual update if score-svg-display.js is loaded
  if (typeof updateCountryVisual === "function") {
    updateCountryVisual();
  }
}

function zhdUpdateCommentSection() {
  const commentEl = document.querySelector(
    ".comment-section-wrap .comment-content"
  );
  if (!commentEl) return;

  // If no user data, show a different message
  if (!window.ZHD.hasUserData || window.ZHD.personalScore === null) {
    commentEl.textContent = "No personal data available. Visit the installation to record your daily routine.";
    return;
  }

  const personal = window.ZHD.personalScore;
  const country = window.ZHD.italyData.score;
  const diff = personal - country;

  let message;
  if (diff >= 0) {
    message = `You are currently overperforming. You're ${Math.abs(
      diff
    ).toFixed(0)}% above your country's average.`;
  } else {
    message = `You are currently underperforming. You're ${Math.abs(
      diff
    ).toFixed(0)}% below your country's average.`;
  }

  commentEl.textContent = message;
}

function zhdUpdateUserId() {
  const userIdEl = document.getElementById("user-id");
  if (userIdEl) {
    if (window.ZHD.userId) {
      userIdEl.textContent = window.ZHD.userId;
    } else {
      userIdEl.textContent = "—";
    }
  }
}

function zhdTriggerRankingUpdate() {
  const event = new CustomEvent("zhd-ranking-updated", {
    detail: {
      ranking: window.ZHD.currentRanking,
      italy: window.ZHD.italyData,
    },
  });
  document.dispatchEvent(event);
}

/***********************
 * MAIN INITIALIZATION
 ***********************/

async function zhdInit() {
  const userId = zhdGetUserIdFromUrl();
  window.ZHD.userId = userId;
  zhdUpdateUserId();

  try {
    const response = await fetch(ZHD_CONFIG.SHEET_URL);
    const text = await response.text();
    const jsonText = text.substring(47, text.length - 2);
    const data = JSON.parse(jsonText);

    const rows = data.table.rows.map((row) => ({
      ID: row.c[1]?.v,
      Dati: row.c[2]?.v,
    }));

    // Get all data for Italy score calculation
    const tuttiDati = rows.map((r) => r.Dati).filter(Boolean);
    const risultato = zhdCalcolaScorePaese(tuttiDati);

    // Generate ranking with calculated Italy score
    window.ZHD.currentRanking = zhdGenerateLocalRanking(risultato.score);

    const italyInRanking = window.ZHD.currentRanking.find(
      (r) => r.country === "Italy"
    );
    window.ZHD.italyData = {
      rank: italyInRanking ? italyInRanking.rank : 0,
      score: risultato.score,
      citizens: risultato.numCittadini,
    };

    // Try to find user data (only if userId is provided)
    let userRow = null;
    if (userId) {
      userRow = rows.find((r) => String(r.ID) === String(userId));
    }

    if (userRow && userRow.Dati) {
      // User found - calculate personal score
      window.ZHD.hasUserData = true;

      const blocks = JSON.parse(userRow.Dati);
      window.ZHD.userTimeline = zhdExpandTo24Hours(blocks);

      // Calculate T_model excluding current user for fair comparison
      const altriDati = rows
        .filter((r) => String(r.ID) !== String(userId))
        .map((r) => r.Dati)
        .filter(Boolean);

      const risultatoAltri =
        altriDati.length > 0
          ? zhdCalcolaScorePaese(altriDati)
          : { T_model: buildT0Vectors() };

      window.ZHD.personalScore = calculateScoreVsTn(
        window.ZHD.userTimeline,
        risultatoAltri.T_model
      );

      console.log("✅ ZHD initialized with user data");
      console.log("   User ID:", userId);
      console.log("   Personal:", window.ZHD.personalScore.toFixed(1));
    } else {
      // User not found or no ID - still show Italy data
      window.ZHD.hasUserData = false;
      window.ZHD.personalScore = null;
      window.ZHD.userTimeline = null;

      if (userId) {
        console.warn("⚠️ User ID not found in sheet:", userId);
      } else {
        console.warn("⚠️ No user ID in URL");
      }
      console.log("✅ ZHD initialized (country data only)");
    }

    console.log("   Italy:", risultato.score.toFixed(1));
    console.log("   Italy Rank:", window.ZHD.italyData.rank);

    // Update UI
    zhdUpdatePersonalScore();
    zhdUpdateCountryScore();
    zhdTriggerRankingUpdate();

    window.ZHD.isLoaded = true;
    window.ZHD.onDataReady.forEach((cb) => cb());

    // Update Italy score on sheet
    zhdUpdateItalyOnSheet(risultato.score);

    // Start server ranking refresh
    setTimeout(zhdFetchServerRanking, ZHD_CONFIG.INITIAL_DELAY);
    setInterval(zhdFetchServerRanking, ZHD_CONFIG.RANKING_REFRESH_INTERVAL);

  } catch (error) {
    console.error("❌ ZHD init error:", error);
    
    // Even on error, mark as loaded so UI doesn't hang
    window.ZHD.isLoaded = true;
    window.ZHD.onDataReady.forEach((cb) => cb());
  }
}

document.addEventListener("DOMContentLoaded", zhdInit);
