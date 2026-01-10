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

  // Render preview (top 10 from currentRanking)
  function renderPreview(ranking) {
    if (!preview) return;
    
    // Clear preview but keep the button
    const button = preview.querySelector("button");
    preview.innerHTML = "";
    if (button) preview.appendChild(button);

    // Sort by score descending and add rank
    const sortedRanking = [...ranking].sort((a, b) => b.score - a.score);
    sortedRanking.forEach((r, i) => (r.rank = i + 1));

    // Add first 10 to preview
    sortedRanking.slice(0, 10).forEach((item) => {
      const isItaly = item.country === "Italy";
      const line = createRankingRow(item.rank, item.country, item.score, isItaly);
      
      const button = preview.querySelector("button");
      if (button) {
        preview.insertBefore(line, button);
      } else {
        preview.appendChild(line);
      }
    });
  }

  // Render complete list (all countries from fullRanking)
  function renderCompleteList(ranking) {
    if (!container) return;
    
    // Clear container
    container.innerHTML = "";

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
    });
    
    console.log(`📊 Rendered ${sortedRanking.length} countries in complete list`);
  }

  // Initial render with placeholder if ZHD not loaded yet
  function initWithPlaceholder() {
    // Check if ZHD data is already available
    if (window.ZHD && window.ZHD.isLoaded) {
      if (window.ZHD.currentRanking.length > 0) {
        renderPreview(window.ZHD.currentRanking);
      }
      if (window.ZHD.fullRanking.length > 0) {
        renderCompleteList(window.ZHD.fullRanking);
      }
    } else {
      // Show placeholder until data loads
      container.innerHTML = '<div class="loading">Loading ranking...</div>';
      if (preview) {
        preview.innerHTML = '<div class="loading">Loading preview...</div>';
      }
    }
  }

  // Listen for ranking updates from zhd-data.js
  document.addEventListener("zhd-ranking-updated", (event) => {
    const { ranking, fullRanking } = event.detail;
    
    // Update preview with top 10
    if (ranking && ranking.length > 0) {
      renderPreview(ranking);
    }
    
    // Update complete list with all countries from sheet
    if (fullRanking && fullRanking.length > 0) {
      renderCompleteList(fullRanking);
    }
  });

  // Register callback if ZHD exists but hasn't loaded yet
  if (window.ZHD) {
    if (window.ZHD.isLoaded) {
      renderPreview(window.ZHD.currentRanking);
      renderCompleteList(window.ZHD.fullRanking);
    } else {
      window.ZHD.onDataReady.push(() => {
        renderPreview(window.ZHD.currentRanking);
        renderCompleteList(window.ZHD.fullRanking);
      });
    }
  }

  // Initialize
  initWithPlaceholder();
});
