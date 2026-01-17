/***********************
 * SYSTEM-TIME.JS
 * Shows system time and winner's timezone time
 * 
 * On timeout.html: reads ?tz=XX from URL to show
 * the time of the winning country's timezone
 * (fixed at page load, doesn't update with ranking)
 ***********************/

// Mapping timezone ID (1-26) to UTC offset in hours
const TIMEZONE_OFFSETS = {
  1: -12,   // UTC-12 (Baker Island)
  2: -11,   // UTC-11 (American Samoa)
  3: -10,   // UTC-10 (Hawaii)
  4: -9,    // UTC-9 (Alaska)
  5: -8,    // UTC-8 (Pacific Time)
  6: -7,    // UTC-7 (Mountain Time)
  7: -6,    // UTC-6 (Central Time)
  8: -5,    // UTC-5 (Eastern Time)
  9: -4,    // UTC-4 (Atlantic Time)
  10: -3,   // UTC-3 (Brazil)
  11: -2,   // UTC-2 (Mid-Atlantic)
  12: -1,   // UTC-1 (Azores)
  13: 0,    // UTC+0 (UK, Portugal)
  14: 1,    // UTC+1 (Central Europe)
  15: 2,    // UTC+2 (Eastern Europe)
  16: 3,    // UTC+3 (Moscow, Middle East)
  17: 4,    // UTC+4 (Gulf)
  18: 5,    // UTC+5 (Pakistan)
  19: 5.5,  // UTC+5:30 (India)
  20: 6,    // UTC+6 (Bangladesh)
  21: 9,    // UTC+9 (Japan, Korea)
  22: 10,   // UTC+10 (Australia East)
  23: 11,   // UTC+11 (Solomon Islands)
  24: 12,   // UTC+12 (New Zealand)
  25: 7,    // UTC+7 (Thailand, Vietnam)
  26: 8,    // UTC+8 (China, Singapore)
};

// Get timezone from URL parameter (set at page load, never changes)
function getTimezoneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tz = params.get('tz');
  return tz ? parseInt(tz, 10) : null;
}

// Store timezone at load time (doesn't change)
const WINNER_TIMEZONE_ID = getTimezoneFromUrl();
const WINNER_UTC_OFFSET = WINNER_TIMEZONE_ID ? TIMEZONE_OFFSETS[WINNER_TIMEZONE_ID] : null;

// Calculate time with a specific UTC offset
function getTimeWithOffset(utcOffset) {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcTime + (utcOffset * 3600000));
}

// Format time as HH:MM:SS
function formatTimeFull(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Format time as HH:MM
function formatTimeShort(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Update time display
function updateSystemTime() {
  const now = new Date();
  
  // --- System time (previous time) - always local ---
  const systemTimeEl = document.getElementById("system-time");
  if (systemTimeEl) {
    systemTimeEl.textContent = formatTimeShort(now);
  }

  // --- New time (current time) ---
  const newTimeEl = document.getElementById("new-time");
  if (newTimeEl) {
    if (WINNER_UTC_OFFSET !== null) {
      // Use winner's timezone (from URL parameter, fixed at load)
      const winnerTime = getTimeWithOffset(WINNER_UTC_OFFSET);
      newTimeEl.textContent = formatTimeFull(winnerTime);
    } else {
      // Fallback: Toronto time (original behavior)
      const torontoTime = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Toronto",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      newTimeEl.textContent = torontoTime;
    }
  }
}

// Log timezone info at startup
if (WINNER_TIMEZONE_ID) {
  console.log(`[System-Time] Using winner timezone: ${WINNER_TIMEZONE_ID} (UTC${WINNER_UTC_OFFSET >= 0 ? '+' : ''}${WINNER_UTC_OFFSET})`);
} else {
  console.log('[System-Time] No timezone in URL, using Toronto fallback');
}

// Start immediately
updateSystemTime();

// Update every second
setInterval(updateSystemTime, 1000);
