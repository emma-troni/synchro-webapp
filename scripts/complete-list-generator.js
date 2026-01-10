/***********************
 * COMPLETE-LIST-GENERATOR.JS
 * Generates ranking list from ZHD real data
 ***********************/

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("complete-list");
  const preview = document.getElementById("rank-preview");
  if (!container) return;

  // Format score in Italian style (XX,X%)
  function formatScoreItalian(score) {
    return score.toFixed(1).replace(".", ",") + "%";
  }

  // Create a ranking row element
  function createRankingRow(rank, country, score, isItaly = false) {
    const line = document.createElement("div");
    line.className = "line-ranking" + (isItaly ? " italy-row" : "");
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
    // Clear containers
    container.innerHTML = "";
    
    // Clear preview but keep the button
    if (preview) {
      const button = preview.querySelector("button");
      preview.innerHTML = "";
      if (button) preview.appendChild(button);
    }

    // Sort by score descending and add rank
    const sortedRanking = [...ranking].sort((a, b) => b.score - a.score);
    sortedRanking.forEach((r, i) => (r.rank = i + 1));

    // Render all rows
    sortedRanking.forEach((item, i) => {
      const isItaly = item.country === "Italy";
      const line = createRankingRow(item.rank, item.country, item.score, isItaly);

      // Add margin to last element
      if (i === sortedRanking.length - 1) {
        line.style.marginBottom = "64px";
      }

      container.appendChild(line);

      // Add first 10 to preview
      if (i < 10 && preview) {
        const clone = line.cloneNode(true);
        const button = preview.querySelector("button");
        if (button) {
          preview.insertBefore(clone, button);
        } else {
          preview.appendChild(clone);
        }
      }
    });
  }

  // Initial render with placeholder if ZHD not loaded yet
  function initWithPlaceholder() {
    // Check if ZHD data is already available
    if (window.ZHD && window.ZHD.isLoaded && window.ZHD.currentRanking.length > 0) {
      renderRankingList(window.ZHD.currentRanking);
    } else {
      // Show placeholder until data loads
      container.innerHTML = '<div class="loading">Loading ranking...</div>';
    }
  }

  // Listen for ranking updates from zhd-data.js
  document.addEventListener("zhd-ranking-updated", (event) => {
    const { ranking } = event.detail;
    if (ranking && ranking.length > 0) {
      renderRankingList(ranking);
    }
  });

  // Register callback if ZHD exists but hasn't loaded yet
  if (window.ZHD) {
    if (window.ZHD.isLoaded) {
      renderRankingList(window.ZHD.currentRanking);
    } else {
      window.ZHD.onDataReady.push(() => {
        renderRankingList(window.ZHD.currentRanking);
      });
    }
  }

  // Initialize
  initWithPlaceholder();
});
