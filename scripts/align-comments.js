/***********************
 * COMMENTS.JS
 * Gestione centralizzata di tutti i commenti dinamici per index.html
 * Dipende da window.ZHD (zhd-data.js deve essere caricato prima)
 ***********************/

(function () {
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
    if (!window.ZHD?.hasUserData || window.ZHD?.personalScore === null) {
      commentEl.textContent =
        "No personal data available. Visit the installation to record your daily routine.";
      return;
    }

    const personal = window.ZHD.personalScore;
    const country = window.ZHD.italyData?.score || 0;
    const diff = formatDiffItalian(personal - country);

    let message;

    if (personal <= 20) {
      // Score <= 20%
      message =
        "You appear way too disaligned with your nation at the moment, bringing down your whole nation's ranking.";
    } else if (personal > 20 && personal <= 50) {
      // Score 21% - 50%
      message =
        "You appear way too disaligned with your nation at the moment, bringing down your whole nation's ranking.";
    } else if (personal > 50 && personal <= 80) {
      // Score 51% - 80%
      message = `You are ${diff}% below the average. Your result is not enough to guarantee a good position in the final ranking.`;
    } else {
      // Score > 80%
      message = `You are still not perfectly aligned with national average, with a ${diff}% of difference. This risks not being enough for the final ranking.`;
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
    if (!window.ZHD?.hasUserData || window.ZHD?.personalScore === null) {
      commentEl.innerHTML = `<p>No personal data available. Visit the installation to record your daily routine.</p>`;
      return;
    }

    const personal = window.ZHD.personalScore;
    let message;

    if (personal <= 20) {
      // Score <= 20%
      message =
        "You resulted is way too distant from the rest of your nation, with an extremely low score that barely contributes to a good position in the global rank. This is going to significantly reduce your chances at determining the new unified timezone. Your personal detachment is potentially precluding the chance of winning and determining the new unified timezone.";
    } else if (personal > 20 && personal <= 50) {
      // Score 21% - 50%
      message =
        "You result too detached from the national average, as shown by your significantly low score. This contributes negatively to your nation's final position in the global rank, potentially precluding the chance of winning and determining the new unified timezone. Even if somehow your country performed well overall, you still need to better align yourself with the rest of your nation.";
    } else if (personal > 50 && personal <= 80) {
      // Score 51% - 80%
      message =
        "You are showing an alignment above 50% with the measure you supplied, but this is still not enough for a significant contribution to the global rank. Choosing to misalign the measure of your day may result in a great loss overall and potentially precluding victory to your country. Your poor performance will probably cost you positions in the global ranking.";
    } else {
      // Score > 80%
      message =
        "You did good, but not good enough: there is still a margin between your vote and the national average. Keep in mind that even the slightest disalignment could cause your country to fall down in the ranking, meaning having to face the consequences of a time zone different from the one that best suits your nation's needs. Good performance overall, but still needs to be better next time.";
    }

    commentEl.innerHTML = `<p>${message}</p>`;
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

    const country = window.ZHD?.italyData?.score || 0;
    let message;

    if (country <= 20) {
      // Score <= 20%
      message =
        "The current average of the scores of those who have already voted is too low, meaning an insignificant position in the ranking. There is still time but statistically your score will not suffice for victory. Your nation is showing lack of cohesion.";
    } else if (country > 20 && country <= 50) {
      // Score 21% - 50%
      message =
        "Your country is not performing well, showing great disalignment overall. The people of your nation have shown significant differences in their measures and this is likely going to impact on the chance of winning the rank.";
    } else if (country > 50 && country <= 80) {
      // Score 51% - 80%
      message =
        "More than half of your country supplied a vote that aligned over 50% to your national average. But the result overall shows that still there is a great amount of disalignment, and the final position in the rank may suffer because of it.";
    } else {
      // Score > 80%
      message =
        "Your national alignment is promising, but a good result is still not perfect. We need to remind you of the stakes of this vote, and even the slightest misstep could cause your country to fall behind.";
    }

    commentEl.innerHTML = `<p>${message}</p>`;
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
   * INITIALIZATION
   ***********************/
  function init() {
    // Check if ZHD is already loaded
    if (window.ZHD?.isLoaded) {
      updateAllComments();
    }

    // Register callback for when data becomes ready
    if (window.ZHD) {
      window.ZHD.onDataReady.push(updateAllComments);
    }

    // Also listen for ranking updates (in case scores change)
    document.addEventListener("zhd-ranking-updated", updateAllComments);
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export functions for external use if needed
  window.ZHDComments = {
    updateMainCommentSection,
    updatePersonalOverlayComment,
    updateCountryOverlayComment,
    updateAllComments,
  };
})();
