/***********************
 * SYSTEM-TIME.JS
 * Shows previous time (fixed UTC+1) and current time (winner timezone from URL)
 *
 * On timeout.html: reads ?tz=XX from URL to show
 * the time of the winning country's timezone
 * (fixed at page load, doesn't update with ranking)
 *
 * TIMEZONE MAPPING: UTC offset = timezone_id - 12
 * Examples:
 *   tz=1  → UTC-11
 *   tz=12 → UTC+0
 *   tz=13 → UTC+1 (Central Europe / Italy)
 *   tz=14 → UTC+2 (Eastern Europe)
 *   tz=21 → UTC+9 (Japan)
 *   tz=24 → UTC+12
 *
 * PREVIOUS TIME: always UTC+1 (Central Europe / Italy)
 * CURRENT TIME: winner's timezone from URL parameter
 ***********************/

// Previous time is always UTC+1 (Italy/Central Europe)
const PREVIOUS_TIME_OFFSET = 1;

// Get timezone from URL parameter (set at page load, never changes)
function getTimezoneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tz = params.get("tz");
  if (tz === null) return null;

  const parsed = parseInt(tz, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

// Convert timezone ID to UTC offset
// Formula: offset = timezone_id - 12
function timezoneToOffset(timezoneId) {
  if (timezoneId === null || timezoneId === undefined) return null;
  return timezoneId - 12;
}

// Store timezone at load time (doesn't change)
const WINNER_TIMEZONE_ID = getTimezoneFromUrl();
const WINNER_UTC_OFFSET = timezoneToOffset(WINNER_TIMEZONE_ID);

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

// Optional: Format time as HH:MM (kept for reuse if needed elsewhere)
function formatTimeShort(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Cache DOM nodes (avoid querying every second)
const systemTimeEl = document.getElementById("system-time");
const newTimeEl = document.getElementById("new-time");

// Update time display
function updateSystemTime() {
  // --- Previous time: always UTC+1 (Italy) ---
  // FIX: show seconds as well (HH:MM:SS) in #system-time
  if (systemTimeEl) {
    const italyTime = getTimeWithOffset(PREVIOUS_TIME_OFFSET);
    systemTimeEl.textContent = formatTimeFull(italyTime);
  }

  // --- Current time: winner's timezone ---
  if (newTimeEl) {
    const offsetToUse =
      WINNER_UTC_OFFSET !== null ? WINNER_UTC_OFFSET : PREVIOUS_TIME_OFFSET;

    const timeToShow = getTimeWithOffset(offsetToUse);
    newTimeEl.textContent = formatTimeFull(timeToShow);
  }
}

// Log timezone info at startup
if (WINNER_TIMEZONE_ID !== null) {
  console.log(
    `[System-Time] Winner timezone: ${WINNER_TIMEZONE_ID} (UTC${
      WINNER_UTC_OFFSET >= 0 ? "+" : ""
    }${WINNER_UTC_OFFSET})`,
  );
  console.log(
    `[System-Time] Previous time: UTC+${PREVIOUS_TIME_OFFSET} (Italy)`,
  );
} else {
  console.log("[System-Time] No timezone in URL, using UTC+1 (Italy) for both");
}

// Start immediately
updateSystemTime();

// Update every second
setInterval(updateSystemTime, 1000);
