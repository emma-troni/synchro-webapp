/***********************
 * TIMEOUT-LINK.JS
 * Updates the "Powered by SYNCHRO" link to include
 * the current winner's timezone as a URL parameter
 *
 * This ensures that when user clicks the link,
 * timeout.html will show the correct timezone
 ***********************/

(function () {
  // Find the link to timeout.html
  function getTimeoutLink() {
    const btn = document.getElementById("overlay-align-btn");
    if (btn) {
      return btn.querySelector('a[href*="timeout.html"]');
    }
    return document.querySelector('a[href*="timeout.html"]');
  }

  // Update the link with current timezone
  function updateLink() {
    const link = getTimeoutLink();
    if (!link) return;

    const timezone = window.ZHD?.winnerTimezone;

    if (timezone) {
      // Preserve user id if present
      const currentParams = new URLSearchParams(window.location.search);
      const userId = currentParams.get("id");

      const newParams = new URLSearchParams();
      if (userId) newParams.set("id", userId);
      newParams.set("tz", timezone);

      link.href = `./timeout.html?${newParams.toString()}`;
    }
  }

  // Listen for ranking updates to keep link current
  document.addEventListener("zhd-ranking-updated", updateLink);

  // Also update on ZHD ready
  if (window.ZHD?.isLoaded) {
    updateLink();
  } else if (window.ZHD?.onDataReady) {
    window.ZHD.onDataReady.push(updateLink);
  }

  // Initial attempt
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(updateLink, 100);
  });
})();
