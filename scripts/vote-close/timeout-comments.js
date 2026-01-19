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
        "You resulted too detached from the rest of your nation, with an extremely low score that barely contributed to a good position in the global rank. This is going to significantly reduce your chances at determining the new unified timezone. Your personal detachment is very likely precluding the chance of winning and determining the new unified timezone.";
    } else if (personal > 20 && personal <= 50) {
      // Score 21% - 50%
      message =
        "You resulted too detached from the national average, as shown by your significantly low score. This contributed negatively to your nation's final position in the global rank, potentially precluding the chance of winning and determining the new unified timezone. Even if somehow your country performed well overall, you still need to better align yourself with the rest of your nation.";
    } else if (personal > 50 && personal <= 80) {
      // Score 51% - 80%
      message =
        "You showed an alignment above 50%, which is still not enough for a significant contribution to the global rank. Choosing to misalign the measure of your day may result in a great loss overall and potentially precluding victory to your country. Your poor performance has probably cost you positions in the global ranking.";
    } else {
      // Score > 80%
      message =
        "You voted well, but not well enough, as shown by the margin that remains between your and your nation's measure. Keep in mind that even the slightest disalignment could cause your country to fall down in the ranking, meaning having to face the consequences of a time zone different from the one that best suits your nation's needs. Good performance overall, but still needs to be better next time.";
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
        "The final national average is too low. The lack of alignment among the people of your country in what constitutes a good measure of a day shows that you should not have the right to impose your time as the new unified one.";
    } else if (country > 20 && country <= 50) {
      // Score 21% - 50%
      message =
        "Your national average showed an overall disalignment. More than half of the measures were way below the optimal score, meaning that your country should not have the right to impose your time as the new unified one.";
    } else if (country > 50 && country <= 80) {
      // Score 51% - 80%
      message =
        "Your nation final result shows a mediocre performance, that emphasize the need to a more unified internal measure of how you schedule your days. Still not a good enough result to determine the new universal timezone.";
    } else {
      // Score > 80%
      message =
        "Your final national alignment is promising, but a good result is still not perfect. Maybe a good enough result for the right to choose the new timezone but still showing that work needs to be done. An almost perfect measure is still not perfect.";
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
