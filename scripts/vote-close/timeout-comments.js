/***********************
 * TIMEOUT-COMMENTS.JS
 * Gestione centralizzata di tutti i commenti dinamici per timeout.html
 * Dipende da window.TimeoutData (timeout-data.js deve essere caricato prima)
 ***********************/

(function () {
  /***********************
   * STATE - scores received from timeout-data.js
   ***********************/
  let _personalScore = null;
  let _countryScore = null;

  /***********************
   * UTILITY
   ***********************/
  function formatDiffItalian(value) {
    return Math.abs(value).toFixed(2).replace(".", ",");
  }

  /***********************
   * COMMENT SECTION - ALIGN PAGE (main)
   * Selettore: .comment-section-wrap .comment-content
   ***********************/
  function updateMainCommentSection() {
    const commentEl = document.querySelector(
      ".comment-section-wrap .comment-content",
    );
    if (!commentEl) return;

    // If no user data, show a different message
    if (_personalScore === null || _personalScore === undefined) {
      commentEl.textContent =
        "No personal data available. Visit the installation to record your daily routine.";
      return;
    }

    const personal = _personalScore;
    const diff = formatDiffItalian(personal - _countryScore);

    let message;

    if (personal <= 20) {
      // Score <= 20%
      message =
        "With your measure, you appeared way too far from your national average, with almost your entire measure disaligned with everyone else's.";
    } else if (personal > 20 && personal <= 50) {
      // Score 21% - 50%
      message =
        "With your measure, you appeared way too far from your national average, with more than half of your measure disaligned with the rest of the nation.";
    } else if (personal > 50 && personal <= 80) {
      // Score 51% - 80%
      message = `You are ${diff}% below the nation's average. This measure contributed in bringing down your nation's position in the final ranking.`;
    } else {
      // Score > 80%
      message = `You missed perfect alignment with the national average, with a ${diff}% of difference.`;
    }

    commentEl.textContent = message;
  }

  /***********************
   * COMMENT SECTION - PERSONAL OVERLAY
   * Selettore: #align-personal-overlay .comment-overlay-section-wrap .comment-content
   ***********************/
  function updatePersonalOverlayComment() {
    const commentEl = document.querySelector(
      "#align-personal-overlay .comment-overlay-section-wrap .comment-content",
    );
    if (!commentEl) return;

    // If no user data, show a different message
    if (_personalScore === null || _personalScore === undefined) {
      commentEl.innerHTML = `<p><span style="font-weight: 500; line-height: 1.4" class="hl-sweep">Personal statistic</span><br><br>No personal data available. Visit the installation to record your daily routine.</p>`;
      return;
    }

    const personal = _personalScore;
    let message;

    if (personal <= 20) {
      // Score <= 20%
      message =
        "Your final result was way too distant from the rest of your nation, with an extremely low score that barely contributed to a good position in the global rank. Your personal detachment precluded the chance of winning and determining the new unified timezone.";
    } else if (personal > 20 && personal <= 50) {
      // Score 21% - 50%
      message =
        "Your final result was too detached from the national average, as shown by your significantly low score. This contributed negatively to your nation's final position in the global rank. Even if somehow your country performed well overall, you failed to align yourself with the rest of your nation.";
    } else if (personal > 50 && personal <= 80) {
      // Score 51% - 80%
      message =
        "You showed an alignment above 50% with the measure you supplied, but this was still not enough for a significant contribution to the global rank. Your choice to misalign the measure of your day may have resulted in a great loss overall for your country.";
    } else {
      // Score > 80%
      message =
        "You did good, but not good enough: there was still a margin between your vote and the national average. Even the slightest disalignment could have caused your country to fall down in the ranking. Good performance overall, but it needed to be better.";
    }

    commentEl.innerHTML = `<p><span style="font-weight: 500; line-height: 1.4" class="hl-sweep">Personal statistic</span><br><br>${message}</p>`;
  }

  /***********************
   * COMMENT SECTION - COUNTRY OVERLAY
   * Selettore: #align-country-overlay .comment-overlay-section-wrap .comment-content
   ***********************/
  function updateCountryOverlayComment() {
    const commentEl = document.querySelector(
      "#align-country-overlay .comment-overlay-section-wrap .comment-content",
    );
    if (!commentEl) return;

    const country = _countryScore || 0;
    let message;

    if (country <= 20) {
      // Score <= 20%
      message =
        "The final average of scores was too low, meaning an insignificant position in the ranking. Your nation showed lack of cohesion and failed to compete for the unified timezone.";
    } else if (country > 20 && country <= 50) {
      // Score 21% - 50%
      message =
        "Your country did not perform well, showing great disalignment overall. The people of your nation showed significant differences in their measures and this impacted on the chance of winning the rank.";
    } else if (country > 50 && country <= 80) {
      // Score 51% - 80%
      message =
        "More than half of your country supplied a vote that aligned over 50% to your national average. But the result overall showed that still there was a great amount of disalignment, and the final position in the rank suffered because of it.";
    } else {
      // Score > 80%
      message =
        "Your national alignment was promising, but a good result is still not perfect. Even the slightest misstep could have caused your country to fall behind in the final ranking.";
    }

    commentEl.innerHTML = `<p><span style="font-weight: 500; line-height: 1.4" class="hl-sweep">National statistic</span><br><br>${message}</p>`;
  }

  /***********************
   * UPDATE ALL COMMENTS
   ***********************/
  function updateAllComments() {
    updateMainCommentSection();
    updatePersonalOverlayComment();
    updateCountryOverlayComment();
  }

  /***********************
   * SET SCORES (called by timeout-data.js)
   ***********************/
  function setScores(personalScore, countryScore) {
    _personalScore = personalScore;
    _countryScore = countryScore;
    updateAllComments();
  }

  /***********************
   * INITIALIZATION
   ***********************/
  function init() {
    // Comments will be updated when timeout-data.js calls setScores()
    console.log("[Timeout-Comments] Initialized, waiting for scores...");
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export functions for external use
  window.TimeoutComments = {
    setScores,
    updateMainCommentSection,
    updatePersonalOverlayComment,
    updateCountryOverlayComment,
    updateAllComments,
  };
})();
