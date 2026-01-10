document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(
    '#world-rank-overlay input[type="search"]'
  );
  const searchBtn = document.getElementById("search-btn");
  const completeList = document.getElementById("complete-list");

  if (!searchInput || !searchBtn || !completeList) return;

  function clearPreviousFlash() {
    completeList.querySelectorAll(".name-position.flash").forEach((el) => {
      // Rimuove la classe per poter riapplicare l'animazione
      el.classList.remove("flash");
    });
  }

  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    clearPreviousFlash();

    const items = completeList.querySelectorAll(".line-ranking");
    if (!items.length) {
      console.warn("Nessun elemento .line-ranking presente in #complete-list");
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
        // Applica l'animazione flash
        namePositionEl.classList.add("flash");

        // Scrolla fino all'elemento trovato
        item.scrollIntoView({ behavior: "smooth", block: "center" });

        found = true;
        break; // evidenzia e scrolla solo il primo match
      }
    }

    if (!found) {
      alert("Nessun risultato trovato");
    }
  }

  // Rimuove l'animazione se l'utente digita un nuovo testo
  searchInput.addEventListener("input", clearPreviousFlash);

  // Ricerca al click sul bottone
  searchBtn.addEventListener("click", performSearch);

  // Ricerca al tasto Invio
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });
});
