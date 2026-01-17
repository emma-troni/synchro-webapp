/***********************
 * SYSTEM-TIME.JS
 * Shows system time and winner's timezone time
 *
 * On timeout.html: reads ?tz=XX from URL to show
 * the time of the winning country's timezone
 * (fixed at page load, doesn't update with ranking)
 *
 * PREVIOUS TIME: always UTC+1 (Central Europe / Italy)
 * CURRENT TIME: winner's timezone from URL parameter
 ***********************/

// Mapping timezone ID (1-26) to UTC offset in hours
// CORRECTED: tz14 = UTC+2, etc.
const TIMEZONE_OFFSETS = {
  1: -12, // UTC-12 (Baker Island)
  2: -11, // UTC-11 (American Samoa)
  3: -10, // UTC-10 (Hawaii)
  4: -9, // UTC-9 (Alaska)
  5: -8, // UTC-8 (Pacific Time)
  6: -7, // UTC-7 (Mountain Time)
  7: -6, // UTC-6 (Central Time)
  8: -5, // UTC-5 (Eastern Time US)
  9: -4, // UTC-4 (Atlantic Time)
  10: -3, // UTC-3 (Brazil)
  11: -2, // UTC-2 (Mid-Atlantic)
  12: -1, // UTC-1 (Azores)
  13: 0, // UTC+0 (UK, Portugal)
  14: 2, // UTC+2 (Eastern Europe) - CORRECTED
  15: 3, // UTC+3 (Moscow, Middle East)
  16: 4, // UTC+4 (Gulf)
  17: 5, // UTC+5 (Pakistan)
  18: 5.5, // UTC+5:30 (India)
  19: 6, // UTC+6 (Bangladesh)
  20: 7, // UTC+7 (Thailand, Vietnam)
  21: 8, // UTC+8 (China, Singapore)
  22: 9, // UTC+9 (Japan, Korea)
  23: 10, // UTC+10 (Australia East)
  24: 11, // UTC+11 (Solomon Islands)
  25: 12, // UTC+12 (New Zealand)
  26: 1, // UTC+1 (Central Europe) - Italy timezone
};

// Previous time is always UTC+1 (Italy/Central Europe)
const PREVIOUS_TIME_OFFSET = 1;

// Get timezone from URL parameter (set at page load, never changes)
function getTimezoneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tz = params.get("tz");
  return tz ? parseInt(tz, 10) : null;
}

// Store timezone at load time (doesn't change)
const WINNER_TIMEZONE_ID = getTimezoneFromUrl();
const WINNER_UTC_OFFSET = WINNER_TIMEZONE_ID
  ? TIMEZONE_OFFSETS[WINNER_TIMEZONE_ID]
  : null;

// Calculate time with a specific UTC offset
function getTimeWithOffset(utcOffset) {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcTime + utcOffset * 3600000);
}

// Format time as HH:MM:SS
function formatTimeFull(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// Format time as HH:MM
function formatTimeShort(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Update time display
function updateSystemTime() {
  // --- Previous time: always UTC+1 (Italy) ---
  const systemTimeEl = document.getElementById("system-time");
  if (systemTimeEl) {
    const italyTime = getTimeWithOffset(PREVIOUS_TIME_OFFSET);
    systemTimeEl.textContent = formatTimeShort(italyTime);
  }

  // --- Current time: winner's timezone ---
  const newTimeEl = document.getElementById("new-time");
  if (newTimeEl) {
    if (WINNER_UTC_OFFSET !== null) {
      // Use winner's timezone (from URL parameter, fixed at load)
      const winnerTime = getTimeWithOffset(WINNER_UTC_OFFSET);
      newTimeEl.textContent = formatTimeFull(winnerTime);
    } else {
      // Fallback: UTC+1 (Italy)
      const italyTime = getTimeWithOffset(PREVIOUS_TIME_OFFSET);
      newTimeEl.textContent = formatTimeFull(italyTime);
    }
  }
}

// Log timezone info at startup
if (WINNER_TIMEZONE_ID) {
  console.log(
    `[System-Time] Winner timezone: ${WINNER_TIMEZONE_ID} (UTC${
      WINNER_UTC_OFFSET >= 0 ? "+" : ""
    }${WINNER_UTC_OFFSET})`
  );
  console.log(
    `[System-Time] Previous time: UTC+${PREVIOUS_TIME_OFFSET} (Italy)`
  );
} else {
  console.log("[System-Time] No timezone in URL, using UTC+1 (Italy) for both");
}

// Start immediately
updateSystemTime();

// Update every second
setInterval(updateSystemTime, 1000);
