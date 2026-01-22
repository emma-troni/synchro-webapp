/***********************
 * SEARCH-COUNTRY.JS
 * Search functionality for country ranking
 ***********************/

document.addEventListener("DOMContentLoaded", () => {
  // Select input from #world section (not the commented overlay)
  const searchInput = document.querySelector(
    '#world .search-wrap input[type="search"]',
  );
  const completeList = document.getElementById("complete-list");

  if (!searchInput || !completeList) {
    console.warn("Search: missing searchInput or completeList");
    return;
  }

  // Add styles for highlight animation
  const style = document.createElement("style");
  style.textContent = `
    .line-ranking .name-position.flash {
      animation: flashHighlight 2s ease-out;
    }
    .line-ranking.search-highlight {
      background-color: rgba(255, 255, 255, 0.12);
      border-radius: 4px;
    }
    @keyframes flashHighlight {
      0% { background-color: rgba(33, 33, 33, 0.4); }
      100% { background-color: transparent; }
    }
  `;
  document.head.appendChild(style);

  function clearPreviousFlash() {
    completeList.querySelectorAll(".name-position.flash").forEach((el) => {
      el.classList.remove("flash");
    });
    completeList.querySelectorAll(".search-highlight").forEach((el) => {
      el.classList.remove("search-highlight");
    });
  }

  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      clearPreviousFlash();
      return;
    }

    clearPreviousFlash();

    const items = completeList.querySelectorAll(".line-ranking");
    if (!items.length) {
      console.warn("No .line-ranking elements in #complete-list");
      return;
    }

    let found = false;

    for (let item of items) {
      const countryNameEl = item.querySelector(".country-name");
      const namePositionEl = item.querySelector(".name-position");

      if (
        countryNameEl &&
        namePositionEl &&
        countryNameEl.textContent.toLowerCase().includes(query)
      ) {
        namePositionEl.classList.add("flash");
        item.classList.add("search-highlight");
        item.scrollIntoView({ behavior: "smooth", block: "center" });
        found = true;
        break;
      }
    }

    if (!found && query.length > 2) {
      console.log("🔍 No results found for:", query);
    }
  }

  // Search as you type (debounced)
  let searchTimeout = null;
  searchInput.addEventListener("input", () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 300);
  });

  // Immediate search on Enter
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      if (searchTimeout) clearTimeout(searchTimeout);
      performSearch();
    }
  });

  // Clear on Escape
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      clearPreviousFlash();
    }
  });

  // Clear when search input is cleared (X button)
  searchInput.addEventListener("search", () => {
    if (searchInput.value === "") {
      clearPreviousFlash();
    }
  });

  console.log("🔍 Search-country.js initialized");
});
