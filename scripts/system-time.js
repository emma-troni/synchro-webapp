/***********************
 * SYSTEM-TIME.JS
 * Shows previous time (fixed UTC+1) and current time (winner timezone)
 *
 * On timeout.html: gets winner timezone from timeout-data.js
 * via window.TimeoutData.getFixedTimezone()
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
 * CURRENT TIME: winner's timezone from timeout-data.js API
 ***********************/

(function () {
  // Previous time is always UTC+1 (Italy/Central Europe)
  const PREVIOUS_TIME_OFFSET = 1;

  const tz = params.get("tz");
  // Winner timezone (will be set when timeout-data.js loads it)
  let winnerTimezoneId = null;
  let winnerUtcOffset = null;

  // Convert timezone ID to UTC offset
  // Formula: offset = timezone_id - 12
  function timezoneToOffset(timezoneId) {
    if (timezoneId === null || timezoneId === undefined) return null;
    return timezoneId - 12;
  }

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

  // Cache DOM nodes (avoid querying every second)
  const systemTimeEl = document.getElementById("system-time");
  const newTimeEl = document.getElementById("new-time");

  // Try to get winner timezone from timeout-data.js
  function updateWinnerTimezone() {
    if (
      window.TimeoutData &&
      typeof window.TimeoutData.getFixedTimezone === "function"
    ) {
      const tz = window.TimeoutData.getFixedTimezone();
      if (tz !== null && tz !== winnerTimezoneId) {
        winnerTimezoneId = tz;
        winnerUtcOffset = timezoneToOffset(tz);
        console.log(
          `[System-Time] Winner timezone loaded: ${winnerTimezoneId} (UTC${
            winnerUtcOffset >= 0 ? "+" : ""
          }${winnerUtcOffset})`,
        );
      }
    }
  }

  // Update time display
  function updateSystemTime() {
    // Try to get winner timezone if not yet loaded
    if (winnerTimezoneId === null) {
      updateWinnerTimezone();
    }

    // --- Previous time: always UTC+1 (Italy) ---
    if (systemTimeEl) {
      const italyTime = getTimeWithOffset(PREVIOUS_TIME_OFFSET);
      systemTimeEl.textContent = formatTimeFull(italyTime);
    }

    // --- Current time: winner's timezone ---
    if (newTimeEl) {
      const offsetToUse =
        winnerUtcOffset !== null ? winnerUtcOffset : PREVIOUS_TIME_OFFSET;

      const timeToShow = getTimeWithOffset(offsetToUse);
      newTimeEl.textContent = formatTimeFull(timeToShow);
    }
  }

  // Log initial state
  console.log(
    `[System-Time] Previous time: UTC+${PREVIOUS_TIME_OFFSET} (Italy)`,
  );
  console.log(
    "[System-Time] Waiting for winner timezone from timeout-data.js...",
  );

  // Start immediately
  updateSystemTime();

  // Update every second
  setInterval(updateSystemTime, 1000);
})();
