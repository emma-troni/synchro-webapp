/***********************
 * COMPLETE-LIST-GENERATOR.JS
 * Generates ranking list from ZHD real data
 * Updates in real-time when ranking changes
 ***********************/

(function () {
  const container = document.getElementById("complete-list");
  const preview = document.getElementById("rank-preview");

  if (!container) return;

  // Store the button reference from preview
  let previewButton = preview ? preview.querySelector("button") : null;

  // Format score in Italian style (XX,X%)
  function formatScoreItalian(score) {
    return score.toFixed(1).replace(".", ",") + "%";
  }

  // Create a ranking row element
  function createRankingRow(rank, country, score, isItaly = false, isLast = false) {
    const line = document.createElement("div");
    line.className = "line-ranking" + (isItaly ? " italy-row" : "");
    
    if (isLast) {
      line.style.marginBottom = "64px";
    }

    line.innerHTML = `
      <div class="name-position">
        <div class="rank-position">#${String(rank).padStart(3, "0")}</div>
        <div class="country-name">${country}</div>
      </div>
      <div class="country-rank-score">${formatScoreItalian(score)}</div>
    `;
    return line;
  }

  // Render ranking list
  function renderRankingList(ranking) {
    if (!ranking || ranking.length === 0) return;

    // Clear complete list
    container.innerHTML = "";

    // Clear preview but preserve button
    if (preview) {
      previewButton = preview.querySelector("button");
      preview.innerHTML = "";
    }

    // Sort by score descending
    const sortedRanking = [...ranking].sort((a, b) => b.score - a.score);

    // Render all rows
    sortedRanking.forEach((item, i) => {
      const rank = i + 1;
      const isItaly = item.country === "Italy";
      const isLast = i === sortedRanking.length - 1;
      const line = createRankingRow(rank, item.country, item.score, isItaly, isLast);

      container.appendChild(line);

      // Add first 10 to preview
      if (i < 10 && preview) {
        const clone = line.cloneNode(true);
        clone.style.marginBottom = ""; // Reset margin for preview
        preview.appendChild(clone);
      }
    });

    // Re-add button at the end of preview
    if (preview && previewButton) {
      preview.appendChild(previewButton);
    }

    console.log("📊 Ranking rendered:", sortedRanking.length, "countries");
  }

  // Listen for ranking updates from zhd-data.js
  document.addEventListener("zhd-ranking-updated", (event) => {
    const { ranking } = event.detail;
    renderRankingList(ranking);
  });

  // Initial render if ZHD already loaded
  function tryInitialRender() {
    if (window.ZHD && window.ZHD.currentRanking && window.ZHD.currentRanking.length > 0) {
      renderRankingList(window.ZHD.currentRanking);
      return true;
    }
    return false;
  }

  // Try immediately
  if (!tryInitialRender()) {
    // If not ready, register callback
    if (window.ZHD) {
      window.ZHD.onDataReady.push(() => {
        renderRankingList(window.ZHD.currentRanking);
      });
    }
    
    // Also show loading state
    container.innerHTML = '<div class="loading" style="padding: 20px; text-align: center;">Loading ranking...</div>';
  }
})();
