/***********************
 * SEARCH-COUNTRY.JS
 * Search functionality for country ranking
 ***********************/

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(
    '#world-rank-overlay input[type="search"]'
  );
  const searchBtn = document.getElementById("search-btn");
  const completeList = document.getElementById("complete-list");

  if (!searchInput || !searchBtn || !completeList) return;

  function clearPreviousFlash() {
    completeList.querySelectorAll(".name-position.flash").forEach((el) => {
      el.classList.remove("flash");
    });
  }

  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

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
        item.scrollIntoView({ behavior: "smooth", block: "center" });
        found = true;
        break;
      }
    }

    if (!found) {
      alert("No results found");
    }
  }

  searchInput.addEventListener("input", clearPreviousFlash);
  searchBtn.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });
});
