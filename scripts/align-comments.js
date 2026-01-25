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

    // If no user data, show a different message + button
    if (!window.ZHD?.hasUserData || window.ZHD?.personalScore === null) {
      // Pulisce contenuto
      commentEl.innerHTML = "";

      // Testo
      const message = document.createElement("p");
      message.textContent =
        "No personal data available. Visit the installation to record your daily routine.";

      // Bottone
      const button = document.createElement("button");
      button.id = "find-poll";
      button.dataset.view = "location-poll";

      button.innerHTML = `
        <span style="text-decoration: underline;">find poll near you</span>
        <span>&ensp;❯</span>
      `;

      // Aggiunge al container
      commentEl.appendChild(message);
      commentEl.appendChild(button);

      return;
    }

    const personal = window.ZHD.personalScore;
    const country = window.ZHD.italyData?.score || 0;
    const diff = formatDiffItalian(personal - country);

    let message;

    if (personal <= 20) {
      message =
        "You appear way too disaligned with your nation at the moment, bringing down your whole nation's ranking.";
    } else if (personal > 20 && personal <= 50) {
      message =
        "You appear way too disaligned with your nation at the moment, bringing down your whole nation's ranking.";
    } else if (personal > 50 && personal <= 80) {
      message = `You are ${diff}% below the average. Your result is not enough to guarantee a good position in the final ranking.`;
    } else {
      message = `You are still not perfectly aligned with national average, with a ${diff}% of difference. This risks not being enough for the final ranking.`;
    }

    commentEl.textContent = message;
  }

  /***********************
   * COMMENT SECTION - PERSONAL OVERLAY
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
      message =
        "You resulted is way too distant from the rest of your nation, with an extremely low score that barely contributes to a good position in the global rank...";
    } else if (personal > 20 && personal <= 50) {
      message =
        "You result too detached from the national average, as shown by your significantly low score...";
    } else if (personal > 50 && personal <= 80) {
      message =
        "You are showing an alignment above 50% with the measure you supplied...";
    } else {
      message =
        "You did good, but not good enough: there is still a margin between your vote and the national average...";
    }

    commentEl.innerHTML = `<p>${message}</p>`;
  }

  /***********************
   * COMMENT SECTION - COUNTRY OVERLAY
   ***********************/
  function updateCountryOverlayComment() {
    const commentEl = document.querySelector(
      "#align-country-overlay .comment-overlay-section-wrap .comment-content",
    );
    if (!commentEl) return;

    const country = window.ZHD?.italyData?.score || 0;
    let message;

    if (country <= 20) {
      message =
        "The current average of the scores of those who have already voted is too low...";
    } else if (country > 20 && country <= 50) {
      message =
        "Your country is not performing well, showing great disalignment overall...";
    } else if (country > 50 && country <= 80) {
      message =
        "More than half of your country supplied a vote that aligned over 50%...";
    } else {
      message =
        "Your national alignment is promising, but a good result is still not perfect...";
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
    if (window.ZHD?.isLoaded) {
      updateAllComments();
    }

    if (window.ZHD) {
      window.ZHD.onDataReady.push(updateAllComments);
    }

    document.addEventListener("zhd-ranking-updated", updateAllComments);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.ZHDComments = {
    updateMainCommentSection,
    updatePersonalOverlayComment,
    updateCountryOverlayComment,
    updateAllComments,
  };
})();
