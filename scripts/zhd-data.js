/***********************
 * ZHD-DATA.JS
 * Zero Hour Day - Data Integration for index.html
 * Integrates score.js and app.js logic
 *
 * NOTE: Comment sections are now handled by comments.js
 ***********************/

/***********************
 * CONFIGURATION
 ***********************/

const ZHD_CONFIG = {
  SHEET_ID: "19eSx-gfbzfAWqs1OYJLPqaqqev62wfokldr9JP6Uezk",
  APP_SCRIPT_ID:
    "AKfycbyYyqsaSuWRgE1ipYzAqW_rDzwxwAIYxR3TGO-ohX0AUB0t0c1wTJMtbTFqjJqlN4IH",
  RANKING_REFRESH_INTERVAL: 5000,
  INITIAL_DELAY: 1000,
  EVENT_DEBOUNCE_MS: 100, // Debounce time for ranking update events
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
  { country: "Japan", baseScore: 87.3, currentScore: 98.0 },
  { country: "Greenland", baseScore: 94.0, currentScore: 100.0 },
  { country: "Germany", baseScore: 86.2, currentScore: 95.7 },
  { country: "Switzerland", baseScore: 84.8, currentScore: 91.4 },
  { country: "Netherlands", baseScore: 84.3, currentScore: 92.1 },
  { country: "South Korea", baseScore: 84.3, currentScore: 87.5 },
  { country: "Denmark", baseScore: 84.1, currentScore: 73.5 },
  { country: "Finland", baseScore: 84.0, currentScore: 93.9 },
  { country: "North Korea", baseScore: 83.8, currentScore: 82.1 },
  { country: "Sweden", baseScore: 81.8, currentScore: 73.6 },
  { country: "Norway", baseScore: 81.4, currentScore: 78.9 },
  { country: "Czechia", baseScore: 80.9, currentScore: 82.5 },
  { country: "Austria", baseScore: 80.8, currentScore: 72.7 },
  { country: "Singapore", baseScore: 80.5, currentScore: 82.3 },
  { country: "Estonia", baseScore: 79.6, currentScore: 86.7 },
  { country: "Taiwan", baseScore: 78.9, currentScore: 71.8 },
  { country: "Belgium", baseScore: 78.5, currentScore: 69.9 },
  { country: "Hungary", baseScore: 78.4, currentScore: 82.3 },
  { country: "Slovakia", baseScore: 78.1, currentScore: 84.3 },
  { country: "Poland", baseScore: 77.9, currentScore: 66.6 },
  { country: "United Kingdom", baseScore: 77.8, currentScore: 82.3 },
  { country: "Slovenia", baseScore: 77.5, currentScore: 70.9 },
  { country: "China", baseScore: 77.3, currentScore: 80.7 },
  { country: "France", baseScore: 76.8, currentScore: 76.4 },
  { country: "Lithuania", baseScore: 76.5, currentScore: 74.1 },
  { country: "Latvia", baseScore: 76.2, currentScore: 67.8 },
  { country: "Vatican City", baseScore: 76.0, currentScore: 71.2 },
  { country: "New Zealand", baseScore: 75.6, currentScore: 73.2 },
  { country: "Ireland", baseScore: 75.6, currentScore: 82.7 },
  { country: "Luxembourg", baseScore: 75.0, currentScore: 69.9 },
  { country: "Liechtenstein", baseScore: 74.8, currentScore: 76.5 },
  { country: "Canada", baseScore: 74.4, currentScore: 63.4 },
  { country: "Italy", baseScore: 74.3, currentScore: 69.8 },
  { country: "Belarus", baseScore: 74.0, currentScore: 64.2 },
  { country: "Iceland", baseScore: 73.2, currentScore: 63.1 },
  { country: "Croatia", baseScore: 73.1, currentScore: 68.6 },
  { country: "United States", baseScore: 73.0, currentScore: 78.1 },
  { country: "Vietnam", baseScore: 72.4, currentScore: 63.9 },
  { country: "Monaco", baseScore: 72.1, currentScore: 71.3 },
  { country: "Portugal", baseScore: 71.9, currentScore: 74.2 },
  { country: "Australia", baseScore: 71.7, currentScore: 78.4 },
  { country: "Chile", baseScore: 71.5, currentScore: 72.2 },
  { country: "Israel", baseScore: 71.2, currentScore: 79.6 },
  { country: "Turkmenistan", baseScore: 71.0, currentScore: 65.9 },
  { country: "Romania", baseScore: 71.0, currentScore: 64.7 },
  { country: "Costa Rica", baseScore: 70.8, currentScore: 76.9 },
  { country: "Uruguay", baseScore: 70.6, currentScore: 77.2 },
  { country: "Serbia", baseScore: 70.5, currentScore: 72.4 },
  { country: "Bulgaria", baseScore: 70.5, currentScore: 74.2 },
  { country: "Malta", baseScore: 70.4, currentScore: 68.4 },
  { country: "Spain", baseScore: 70.1, currentScore: 62.4 },
  { country: "Mauritius", baseScore: 70.1, currentScore: 77.2 },
  { country: "San Marino", baseScore: 69.9, currentScore: 64.3 },
  { country: "Greece", baseScore: 69.5, currentScore: 75.7 },
  { country: "Russia", baseScore: 68.9, currentScore: 76.2 },
  { country: "Cuba", baseScore: 68.8, currentScore: 60.0 },
  { country: "Turkey", baseScore: 68.6, currentScore: 68.8 },
  { country: "Thailand", baseScore: 68.5, currentScore: 69.6 },
  { country: "Brunei", baseScore: 68.2, currentScore: 62.0 },
  { country: "Ukraine", baseScore: 68.2, currentScore: 74.7 },
  { country: "Malaysia", baseScore: 68.1, currentScore: 67.1 },
  { country: "Barbados", baseScore: 68.0, currentScore: 61.1 },
  { country: "Andorra", baseScore: 67.8, currentScore: 74.5 },
  { country: "Tunisia", baseScore: 67.6, currentScore: 73.9 },
  { country: "Moldova", baseScore: 67.5, currentScore: 58.4 },
  { country: "Mexico", baseScore: 67.3, currentScore: 73.6 },
  { country: "Panama", baseScore: 67.1, currentScore: 64.4 },
  { country: "Albania", baseScore: 66.9, currentScore: 64.4 },
  { country: "North Macedonia", baseScore: 66.8, currentScore: 69.7 },
  { country: "Trinidad and Tobago", baseScore: 66.6, currentScore: 62.8 },
  { country: "Bosnia and Herzegovina", baseScore: 66.3, currentScore: 63.8 },
  { country: "Armenia", baseScore: 66.2, currentScore: 73.1 },
  { country: "Bhutan", baseScore: 66.1, currentScore: 70.4 },
  { country: "Cyprus", baseScore: 66.1, currentScore: 58.9 },
  { country: "Argentina", baseScore: 65.7, currentScore: 72.8 },
  { country: "Saint Lucia", baseScore: 65.7, currentScore: 73.8 },
  { country: "Seychelles", baseScore: 65.6, currentScore: 61.5 },
  { country: "Morocco", baseScore: 65.6, currentScore: 63.6 },
  { country: "Uzbekistan", baseScore: 65.5, currentScore: 71.8 },
  { country: "Sri Lanka", baseScore: 65.3, currentScore: 73.6 },
  { country: "Rwanda", baseScore: 65.1, currentScore: 61.4 },
  { country: "Jordan", baseScore: 65.0, currentScore: 62.5 },
  { country: "Dominican Republic", baseScore: 65.0, currentScore: 74.0 },
  { country: "Kosovo", baseScore: 64.9, currentScore: 67.7 },
  { country: "Cabo Verde", baseScore: 64.9, currentScore: 63.3 },
  { country: "Kazakhstan", baseScore: 64.8, currentScore: 59.9 },
  { country: "Oman", baseScore: 64.6, currentScore: 70.0 },
  { country: "Azerbaijan", baseScore: 64.5, currentScore: 66.1 },
  { country: "Georgia", baseScore: 64.4, currentScore: 63.8 },
  { country: "Botswana", baseScore: 64.3, currentScore: 72.4 },
  { country: "Jamaica", baseScore: 64.3, currentScore: 63.3 },
  { country: "El Salvador", baseScore: 64.2, currentScore: 71.8 },
  { country: "Philippines", baseScore: 63.8, currentScore: 64.6 },
  { country: "Iran", baseScore: 63.7, currentScore: 70.3 },
  { country: "Saint Kitts and Nevis", baseScore: 63.5, currentScore: 59.9 },
  { country: "Antigua and Barbuda", baseScore: 63.5, currentScore: 58.0 },
  { country: "Algeria", baseScore: 63.4, currentScore: 66.9 },
  { country: "Colombia", baseScore: 63.0, currentScore: 57.2 },
  { country: "South Africa", baseScore: 63.0, currentScore: 68.7 },
  { country: "Peru", baseScore: 62.8, currentScore: 53.5 },
  { country: "Montenegro", baseScore: 62.6, currentScore: 53.3 },
  { country: "Bahrain", baseScore: 62.6, currentScore: 65.8 },
  { country: "Ecuador", baseScore: 62.5, currentScore: 57.2 },
  { country: "Bahamas", baseScore: 62.5, currentScore: 58.1 },
  { country: "Samoa", baseScore: 62.4, currentScore: 68.4 },
  { country: "Lebanon", baseScore: 62.4, currentScore: 60.0 },
  { country: "Sao Tome and Principe", baseScore: 62.2, currentScore: 64.7 },
  { country: "Namibia", baseScore: 62.2, currentScore: 70.9 },
  { country: "Grenada", baseScore: 62.2, currentScore: 54.9 },
  {
    country: "Saint Vincent and the Grenadines",
    baseScore: 62.2,
    currentScore: 59.1,
  },
  { country: "Tonga", baseScore: 62.2, currentScore: 60.1 },
  { country: "Kyrgyzstan", baseScore: 62.1, currentScore: 57.7 },
  { country: "Indonesia", baseScore: 62.1, currentScore: 60.7 },
  { country: "Brazil", baseScore: 62.0, currentScore: 67.0 },
  { country: "Paraguay", baseScore: 62.0, currentScore: 65.8 },
  { country: "Egypt", baseScore: 61.7, currentScore: 68.7 },
  { country: "United Arab Emirates", baseScore: 61.0, currentScore: 64.4 },
  { country: "Afghanistan", baseScore: 60.9, currentScore: 55.1 },
  { country: "Kuwait", baseScore: 60.7, currentScore: 66.4 },
  { country: "Eswatini", baseScore: 60.6, currentScore: 59.4 },
  { country: "Qatar", baseScore: 60.5, currentScore: 64.1 },
  { country: "Saudi Arabia", baseScore: 60.4, currentScore: 61.1 },
  { country: "Fiji", baseScore: 60.3, currentScore: 67.5 },
  { country: "Dominica", baseScore: 60.2, currentScore: 52.8 },
  { country: "Suriname", baseScore: 60.2, currentScore: 52.8 },
  { country: "Maldives", baseScore: 60.1, currentScore: 64.0 },
  { country: "Mongolia", baseScore: 60.1, currentScore: 53.4 },
  { country: "Gabon", baseScore: 59.9, currentScore: 59.6 },
  { country: "Lesotho", baseScore: 59.9, currentScore: 53.6 },
  { country: "Cambodia", baseScore: 59.6, currentScore: 55.5 },
  { country: "Senegal", baseScore: 59.6, currentScore: 56.5 },
  { country: "Guatemala", baseScore: 59.6, currentScore: 63.5 },
  { country: "Bolivia", baseScore: 59.4, currentScore: 63.8 },
  { country: "Tajikistan", baseScore: 59.3, currentScore: 59.6 },
  { country: "Honduras", baseScore: 59.3, currentScore: 62.9 },
  { country: "Palestine", baseScore: 59.3, currentScore: 59.7 },
  { country: "Nicaragua", baseScore: 59.2, currentScore: 52.9 },
  { country: "Laos", baseScore: 59.2, currentScore: 61.8 },
  { country: "India", baseScore: 58.5, currentScore: 55.1 },
  { country: "Palau", baseScore: 57.8, currentScore: 56.5 },
  { country: "Kiribati", baseScore: 57.8, currentScore: 53.0 },
  { country: "Nauru", baseScore: 57.8, currentScore: 51.7 },
  { country: "Tuvalu", baseScore: 57.8, currentScore: 56.1 },
  { country: "Guyana", baseScore: 57.7, currentScore: 54.5 },
  { country: "Belize", baseScore: 57.6, currentScore: 51.9 },
  { country: "Bangladesh", baseScore: 57.6, currentScore: 62.2 },
  { country: "Myanmar", baseScore: 57.1, currentScore: 62.8 },
  { country: "Kenya", baseScore: 57.1, currentScore: 56.5 },
  { country: "Nepal", baseScore: 56.9, currentScore: 50.3 },
  { country: "Ghana", baseScore: 56.9, currentScore: 56.0 },
  { country: "Djibouti", baseScore: 56.9, currentScore: 55.7 },
  { country: "Venezuela", baseScore: 56.9, currentScore: 49.8 },
  { country: "Zambia", baseScore: 56.7, currentScore: 64.9 },
  { country: "Equatorial Guinea", baseScore: 56.4, currentScore: 63.2 },
  { country: "Gambia", baseScore: 55.9, currentScore: 53.4 },
  { country: "Iraq", baseScore: 55.9, currentScore: 49.4 },
  { country: "Pakistan", baseScore: 55.3, currentScore: 54.9 },
  { country: "Ethiopia", baseScore: 55.0, currentScore: 59.0 },
  { country: "Tanzania", baseScore: 54.8, currentScore: 49.4 },
  { country: "Micronesia", baseScore: 54.7, currentScore: 58.4 },
  { country: "Uganda", baseScore: 54.7, currentScore: 60.6 },
  { country: "Cameroon", baseScore: 54.4, currentScore: 48.5 },
  { country: "Malawi", baseScore: 54.3, currentScore: 55.4 },
  { country: "Nigeria", baseScore: 54.3, currentScore: 57.0 },
  { country: "Zimbabwe", baseScore: 54.2, currentScore: 55.6 },
  { country: "Benin", baseScore: 54.1, currentScore: 46.9 },
  { country: "Cote d\'Ivoire", baseScore: 54.0, currentScore: 60.8 },
  { country: "Marshall Islands", baseScore: 54.0, currentScore: 49.0 },
  { country: "Mauritania", baseScore: 54.0, currentScore: 60.7 },
  { country: "Angola", baseScore: 53.6, currentScore: 56.2 },
  { country: "East Timor", baseScore: 53.2, currentScore: 60.9 },
  { country: "Libya", baseScore: 52.9, currentScore: 55.7 },
  { country: "Sudan", baseScore: 52.7, currentScore: 59.7 },
  { country: "Mozambique", baseScore: 52.6, currentScore: 51.6 },
  { country: "Madagascar", baseScore: 52.5, currentScore: 59.7 },
  { country: "Burkina Faso", baseScore: 52.4, currentScore: 54.0 },
  { country: "Comoros", baseScore: 52.4, currentScore: 53.3 },
  { country: "Congo (Brazzaville)", baseScore: 52.1, currentScore: 51.6 },
  { country: "Togo", baseScore: 52.0, currentScore: 45.7 },
  { country: "Eritrea", baseScore: 51.7, currentScore: 57.4 },
  { country: "Vanuatu", baseScore: 50.0, currentScore: 52.2 },
  { country: "Mali", baseScore: 50.0, currentScore: 48.3 },
  { country: "Guinea", baseScore: 49.8, currentScore: 46.6 },
  { country: "Burundi", baseScore: 49.8, currentScore: 54.0 },
  { country: "Sierra Leone", baseScore: 49.6, currentScore: 43.6 },
  { country: "Liberia", baseScore: 49.4, currentScore: 53.4 },
  { country: "Guinea-Bissau", baseScore: 49.1, currentScore: 55.4 },
  { country: "Solomon Islands", baseScore: 48.3, currentScore: 49.7 },
  { country: "Syria", baseScore: 47.1, currentScore: 42.2 },
  { country: "Niger", baseScore: 47.1, currentScore: 50.3 },
  { country: "Chad", baseScore: 47.0, currentScore: 47.4 },
  { country: "Central African Republic", baseScore: 46.8, currentScore: 44.7 },
  { country: "Haiti", baseScore: 46.8, currentScore: 50.5 },
  { country: "Papua New Guinea", baseScore: 46.8, currentScore: 49.2 },
  { country: "Yemen", baseScore: 44.8, currentScore: 47.5 },
  { country: "Congo (DRC)", baseScore: 44.4, currentScore: 39.7 },
];

/***********************
 * GLOBAL STATE (exported for other scripts)
 ***********************/

window.ZHD = {
  currentRanking: [],
  italyData: { rank: 0, score: 0, citizens: 0 },
  winnerTimezone: null, // timezone of the winning country
  personalScore: null, // null = no user data
  userTimeline: null,
  userId: null,
  isLoaded: false,
  hasUserData: false, // flag to indicate if user was found
  onDataReady: [], // callbacks to run when data is ready
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
    // Use currentScore for all countries, italyScore only for Italy
    score:
      country.country === "Italy"
        ? italyScore
        : country.currentScore || country.baseScore,
    baseScore: country.baseScore,
    currentScore: country.currentScore || country.baseScore,
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

/**
 * Fetch both ranking AND winner timezone in parallel
 * This ensures they update at the same time
 */
async function zhdFetchServerRanking() {
  try {
    // Fetch ALL countries ranking and winner in parallel
    const [rankingResponse, winnerResponse] = await Promise.all([
      fetch(`${ZHD_CONFIG.SCRIPT_URL}?action=ranking&all=true&t=${Date.now()}`),
      fetch(`${ZHD_CONFIG.SCRIPT_URL}?action=winner&t=${Date.now()}`),
    ]);

    const [rankingData, winnerData] = await Promise.all([
      rankingResponse.json(),
      winnerResponse.json(),
    ]);

    // Process ranking data
    if (rankingData.error) {
      console.error("Server ranking error:", rankingData.error);
    } else {
      // Use server ranking directly (all 196 countries with current_score)
      if (rankingData.ranking && rankingData.ranking.length > 0) {
        window.ZHD.currentRanking = rankingData.ranking;
        window.ZHD.italyData = rankingData.italy;
        console.log(
          `📊 Loaded ${rankingData.ranking.length} countries from server`,
        );
      } else {
        // Fallback to local ranking if server returns empty
        const italyScore =
          rankingData.italy?.score || window.ZHD.italyData.score || 74.3;
        window.ZHD.currentRanking = zhdGenerateLocalRanking(italyScore);
        window.ZHD.italyData = {
          ...rankingData.italy,
          rank:
            window.ZHD.currentRanking.find((r) => r.country === "Italy")
              ?.rank || 0,
        };
      }
      zhdUpdateCountryScore();
    }

    // Process winner timezone data
    if (winnerData.error) {
      console.error("Server winner error:", winnerData.error);
    } else {
      // Validate timezone (1-26 range)
      const tz = winnerData.timezone;
      if (tz !== undefined && tz !== null && tz >= 1 && tz <= 26) {
        window.ZHD.winnerTimezone = tz;
      } else {
        console.warn("[ZHD-Data] Invalid timezone from API:", tz);
        // Keep previous value or use default
        if (window.ZHD.winnerTimezone === null) {
          window.ZHD.winnerTimezone = 21; // Default to Japan (UTC+9 = 21)
        }
      }
    }

    // Trigger single event with both ranking AND timezone (debounced)
    zhdTriggerRankingUpdate();

    console.log("🔄 Ranking & Timezone updated:", {
      rank: window.ZHD.italyData.rank,
      timezone: window.ZHD.winnerTimezone,
    });
  } catch (error) {
    console.error("Failed to fetch ranking/winner:", error);
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
    "#align-personal-overlay .view-score",
  );
  if (personalOverlay) {
    personalOverlay.textContent = zhdFormatScoreItalian(
      window.ZHD.personalScore,
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
    "#align-country-overlay .view-score",
  );
  if (countryOverlay) {
    countryOverlay.textContent = zhdFormatScoreItalian(
      window.ZHD.italyData.score,
    );
  }

  // Trigger visual update if score-svg-display.js is loaded
  if (typeof updateCountryVisual === "function") {
    updateCountryVisual();
  }
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

/***********************
 * DEBOUNCED EVENT TRIGGER
 * Prevents duplicate events from firing in quick succession
 ***********************/

let _rankingUpdateTimeout = null;
let _lastEventData = null;

function zhdTriggerRankingUpdate() {
  // Clear any pending event
  if (_rankingUpdateTimeout) {
    clearTimeout(_rankingUpdateTimeout);
  }

  // Store the current data
  const eventData = {
    ranking: window.ZHD.currentRanking,
    italy: window.ZHD.italyData,
    timezone: window.ZHD.winnerTimezone,
  };

  // Check if data actually changed
  const dataString = JSON.stringify(eventData);
  if (dataString === _lastEventData) {
    // Data hasn't changed, skip event
    return;
  }

  // Debounce: wait a bit before firing to avoid duplicates
  _rankingUpdateTimeout = setTimeout(() => {
    _lastEventData = dataString;

    const event = new CustomEvent("zhd-ranking-updated", {
      detail: eventData,
    });
    document.dispatchEvent(event);

    _rankingUpdateTimeout = null;
  }, ZHD_CONFIG.EVENT_DEBOUNCE_MS);
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
      (r) => r.country === "Italy",
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
        risultatoAltri.T_model,
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

    // Update UI (scores only, comments handled by comments.js)
    zhdUpdatePersonalScore();
    zhdUpdateCountryScore();

    window.ZHD.isLoaded = true;
    window.ZHD.onDataReady.forEach((cb) => cb());

    // Update Italy score on sheet
    zhdUpdateItalyOnSheet(risultato.score);

    // Fetch server data immediately (ranking + timezone together)
    // This ensures the map highlights as soon as possible
    await zhdFetchServerRanking();

    // Then start periodic refresh
    setInterval(zhdFetchServerRanking, ZHD_CONFIG.RANKING_REFRESH_INTERVAL);
  } catch (error) {
    console.error("❌ ZHD init error:", error);

    // Even on error, mark as loaded so UI doesn't hang
    window.ZHD.isLoaded = true;
    window.ZHD.onDataReady.forEach((cb) => cb());
  }
}

document.addEventListener("DOMContentLoaded", zhdInit);
