/* location-poll.js */
(() => {
  // =========================================================
  // CONFIG
  // =========================================================
  const GEO_MAX_DISTANCE_KM = 20; // quando premi il bottone geolocalizzazione
  const SEARCH_MAX_DISTANCE_KM = 30; // quando cerchi città/CAP/indirizzo
  const RESULTS_LIMIT = 200;

  // Geocoding (Nominatim OSM)
  const COUNTRY_CODES = ""; // "" = globale (necessario per cercare paesi tipo Canada)
  const NOMINATIM_LIMIT = 8;

  // =========================================================
  // DATA (assicurati che ogni sede abbia country ISO-2)
  // =========================================================
  const POLL_STATIONS = [
    {
      id: "mi-bovisa-1",
      locationInfo: "Milano Bovisa - Politecnico",
      indirizzo: "Via Raffaele Lambruschini 4, 20156 Milano MI",
      lat: 45.50688,
      lng: 9.15739,
      zip: "20156",
      country: "IT",
    },
    {
      id: "mi-centro-1",
      locationInfo: "Milano Centro - Duomo",
      indirizzo: "Piazza del Duomo, 20122 Milano MI",
      lat: 45.46412,
      lng: 9.19193,
      zip: "20122",
      country: "IT",
    },
    {
      id: "roma-centro-1",
      locationInfo: "Roma Centro - Campidoglio",
      indirizzo: "Piazza del Campidoglio, 00186 Roma RM",
      lat: 41.89287,
      lng: 12.4823,
      zip: "00186",
      country: "IT",
    },

    {
      id: "ottawa-centre-1",
      locationInfo: "Ottawa Centre - City Hall",
      indirizzo: "110 Laurier Ave W, Ottawa, ON K1P 1J1, Canada",
      lat: 45.42153,
      lng: -75.69719,
      zip: "K1P",
      country: "CA",
    },

    // =======================
    // ITALIA
    // =======================
    {
      id: "roma-centro-1",
      locationInfo: "Roma Centro - Campidoglio",
      indirizzo: "Piazza del Campidoglio, 00186 Roma RM",
      lat: 41.89287,
      lng: 12.4823,
      zip: "00186",
      country: "IT",
    },
    {
      id: "venezia-centro-1",
      locationInfo: "Venezia Centro - San Marco",
      indirizzo: "Piazza San Marco, 30124 Venezia VE",
      lat: 45.43416,
      lng: 12.33874,
      zip: "30124",
      country: "IT",
    },
    {
      id: "firenze-centro-1",
      locationInfo: "Firenze Centro - Palazzo Vecchio",
      indirizzo: "Piazza della Signoria, 50122 Firenze FI",
      lat: 43.76956,
      lng: 11.25581,
      zip: "50122",
      country: "IT",
    },
    {
      id: "napoli-centro-1",
      locationInfo: "Napoli Centro - Municipio",
      indirizzo: "Piazza Municipio, 80133 Napoli NA",
      lat: 40.83892,
      lng: 14.25254,
      zip: "80133",
      country: "IT",
    },
    {
      id: "torino-centro-1",
      locationInfo: "Torino Centro - Palazzo Civico",
      indirizzo: "Piazza Palazzo di Città, 10122 Torino TO",
      lat: 45.07327,
      lng: 7.68686,
      zip: "10122",
      country: "IT",
    },
    {
      id: "bologna-centro-1",
      locationInfo: "Bologna Centro - Palazzo d'Accursio",
      indirizzo: "Piazza Maggiore, 40124 Bologna BO",
      lat: 44.49381,
      lng: 11.34305,
      zip: "40124",
      country: "IT",
    },

    // =======================
    // EUROPA (CAPITALI)
    // =======================
    {
      id: "paris-centre-1",
      locationInfo: "Paris Centre - Hôtel de Ville",
      indirizzo: "Place de l'Hôtel de Ville, 75004 Paris, France",
      lat: 48.85661,
      lng: 2.35222,
      zip: "75004",
      country: "FR",
    },
    {
      id: "london-centre-1",
      locationInfo: "London Centre - City Hall",
      indirizzo: "The Queen's Walk, London SE1 2AA, UK",
      lat: 51.50477,
      lng: -0.07863,
      zip: "SE1",
      country: "GB",
    },
    {
      id: "berlin-centre-1",
      locationInfo: "Berlin Centre - Rathaus",
      indirizzo: "Rathausstraße 15, 10178 Berlin, Germany",
      lat: 52.51862,
      lng: 13.40805,
      zip: "10178",
      country: "DE",
    },
    {
      id: "madrid-centre-1",
      locationInfo: "Madrid Centre - Ayuntamiento",
      indirizzo: "Plaza de Cibeles, 28014 Madrid, Spain",
      lat: 40.4192,
      lng: -3.69224,
      zip: "28014",
      country: "ES",
    },
    {
      id: "vienna-centre-1",
      locationInfo: "Vienna Centre - Rathaus",
      indirizzo: "Friedrich-Schmidt-Platz 1, 1010 Wien, Austria",
      lat: 48.21003,
      lng: 16.35712,
      zip: "1010",
      country: "AT",
    },

    // =======================
    // AMERICA
    // =======================
    {
      id: "washington-centre-1",
      locationInfo: "Washington DC - City Hall",
      indirizzo: "1350 Pennsylvania Ave NW, Washington, DC 20004, USA",
      lat: 38.89511,
      lng: -77.03637,
      zip: "20004",
      country: "US",
    },
    {
      id: "ottawa-centre-1",
      locationInfo: "Ottawa Centre - City Hall",
      indirizzo: "110 Laurier Ave W, Ottawa, ON K1P 1J1, Canada",
      lat: 45.42153,
      lng: -75.69719,
      zip: "K1P",
      country: "CA",
    },
    {
      id: "mexico-city-centre-1",
      locationInfo: "Mexico City - Zócalo",
      indirizzo: "Plaza de la Constitución, Centro, CDMX, Mexico",
      lat: 19.43261,
      lng: -99.13321,
      zip: "06000",
      country: "MX",
    },

    // =======================
    // ASIA
    // =======================
    {
      id: "tokyo-centre-1",
      locationInfo: "Tokyo Centre - Chiyoda",
      indirizzo: "1 Chiyoda, Tokyo 100-8111, Japan",
      lat: 35.68518,
      lng: 139.7528,
      zip: "100-8111",
      country: "JP",
    },
    {
      id: "seoul-centre-1",
      locationInfo: "Seoul Centre - City Hall",
      indirizzo: "110 Sejong-daero, Jung-gu, Seoul, South Korea",
      lat: 37.5663,
      lng: 126.97794,
      zip: "04524",
      country: "KR",
    },
    {
      id: "beijing-centre-1",
      locationInfo: "Beijing Centre - Tiananmen",
      indirizzo: "Tiananmen Square, Beijing, China",
      lat: 39.9042,
      lng: 116.4074,
      zip: "100006",
      country: "CN",
    },

    // =======================
    // AFRICA
    // =======================
    {
      id: "cairo-centre-1",
      locationInfo: "Cairo Centre - Tahrir Square",
      indirizzo: "Tahrir Square, Cairo, Egypt",
      lat: 30.04442,
      lng: 31.23571,
      zip: "11511",
      country: "EG",
    },

    // =======================
    // OCEANIA
    // =======================
    {
      id: "canberra-centre-1",
      locationInfo: "Canberra Centre - Parliament",
      indirizzo: "Parliament Dr, Canberra ACT 2600, Australia",
      lat: -35.30806,
      lng: 149.12444,
      zip: "2600",
      country: "AU",
    },
  ];


  // =========================================================
  // DOM
  // =========================================================
  const input = document.getElementById("location-search");
  const resultsWrap = document.getElementById("polls-stations");
  const geoBtn = document.querySelector("#location-poll .search-wrap button");

  if (!input || !resultsWrap || !geoBtn) {
    console.warn(
      "[location-poll] DOM non trovato: #location-search, #polls-stations o button.",
    );
    return;
  }

  // =========================================================
  // STATE
  // =========================================================
  let userCenter = null; // {lat, lng} SOLO dopo geolocalizzazione

  // =========================================================
  // SUGGESTIONS BOX
  // =========================================================
  const suggestList = document.createElement("div");
  suggestList.id = "location-suggestions-list";
  suggestList.style.position = "absolute";
  suggestList.style.left = "0";
  suggestList.style.right = "0";
  suggestList.style.top = "100%";
  suggestList.style.zIndex = "9999";
  suggestList.style.display = "none";

  const parent = input.parentElement;
  parent.style.position = parent.style.position || "relative";
  parent.appendChild(suggestList);

  // =========================================================
  // UTILS
  // =========================================================
  const escapeHtml = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[c],
    );

  function haversineKm(aLat, aLng, bLat, bLng) {
    const R = 6371;
    const toRad = (v) => (v * Math.PI) / 180;

    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const lat1 = toRad(aLat);
    const lat2 = toRad(bLat);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);

    const h =
      sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function mapsSearchUrl(address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  function clearResults() {
    resultsWrap.innerHTML = "";
  }

  function renderEmpty(top, bottom) {
    resultsWrap.innerHTML = `
      <div class="line-wrap" style="cursor: default; text-decoration: none;">
        <div class="place-name">
          <div class="location-info">${escapeHtml(top)}</div>
          <div class="indirizzo">${escapeHtml(bottom)}</div>
        </div>
        <div></div>
      </div>
    `;
  }

  function renderResults(items, showKm) {
    clearResults();

    if (!items.length) {
      renderEmpty("Nessun risultato", "Nessuna sede trovata.");
      return;
    }

    const frag = document.createDocumentFragment();

    items.slice(0, RESULTS_LIMIT).forEach(({ station, kmShown }) => {
      const a = document.createElement("a");
      a.className = "line-wrap";
      a.href = mapsSearchUrl(station.indirizzo);
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const kmText =
        showKm && Number.isFinite(kmShown) ? ` • ${kmShown.toFixed(1)} km` : "";

      a.innerHTML = `
        <div class="place-name">
          <div class="location-info">${escapeHtml(station.locationInfo)}</div>
          <div class="indirizzo">${escapeHtml(station.indirizzo)}${kmText}</div>
        </div>
        <div>❯</div>
      `;

      frag.appendChild(a);
    });

    resultsWrap.appendChild(frag);
  }

  // =========================================================
  // FILTERS
  // =========================================================
  function filterStationsWithinKm(
    filterLat,
    filterLng,
    maxKm,
    distanceLat = null,
    distanceLng = null,
  ) {
    return POLL_STATIONS.map((station) => {
      if (typeof station.lat !== "number" || typeof station.lng !== "number")
        return null;

      const kmFilter = haversineKm(
        filterLat,
        filterLng,
        station.lat,
        station.lng,
      );
      if (!Number.isFinite(kmFilter) || kmFilter > maxKm) return null;

      const kmShown =
        typeof distanceLat === "number" && typeof distanceLng === "number"
          ? haversineKm(distanceLat, distanceLng, station.lat, station.lng)
          : NaN;

      return { station, kmFilter, kmShown };
    })
      .filter(Boolean)
      .sort((a, b) => a.kmFilter - b.kmFilter);
  }

  function filterStationsByCountry(countryIso2) {
    const iso = String(countryIso2 || "").toUpperCase();
    return POLL_STATIONS.filter(
      (s) => String(s.country || "").toUpperCase() === iso,
    ).map((station) => ({ station, kmShown: NaN }));
  }

  // =========================================================
  // GEOCODING (Nominatim) + country detection robusta
  // =========================================================
  const geocodeCache = new Map();

  async function geocode(query) {
    const q = query.trim();
    if (!q) return [];

    const key = q.toLowerCase();
    if (geocodeCache.has(key)) return geocodeCache.get(key);

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", q);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(NOMINATIM_LIMIT));
    if (COUNTRY_CODES) url.searchParams.set("countrycodes", COUNTRY_CODES);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const data = await res.json();

    const parsed = (Array.isArray(data) ? data : [])
      .map((item) => {
        const addr = item.address || {};
        return {
          display: item.display_name,
          lat: Number(item.lat),
          lng: Number(item.lon),
          class: (item.class || "").toLowerCase(), // spesso "boundary", "place"...
          type: (item.type || "").toLowerCase(), // es. "country", "city", "postcode"
          countryCode: (addr.country_code || "").toUpperCase(),
          raw: item,
        };
      })
      .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));

    geocodeCache.set(key, parsed);
    return parsed;
  }

  // ✅ Consideriamo "nazione" SOLO se Nominatim la classifica come paese
  // così "Milano" non può mai diventare "Italia".
  function isCountryResult(item) {
    return item && item.type === "country";
  }

  // =========================================================
  // SUGGESTIONS UI
  // =========================================================
  function hideSuggestions() {
    suggestList.style.display = "none";
    suggestList.innerHTML = "";
  }

  function showSuggestions(items, onPick) {
    if (!items || !items.length) {
      hideSuggestions();
      return;
    }

    suggestList.innerHTML = "";
    suggestList.style.display = "block";

    items.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "location-suggestion"
      btn.innerHTML = escapeHtml(it.display);

      btn.style.width = "100%";
      btn.style.textAlign = "left";
      btn.style.cursor = "pointer";
      btn.style.border = "none";

      btn.addEventListener("click", () => {
        onPick(it);
        hideSuggestions();
      });

      suggestList.appendChild(btn);
    });
  }

  document.addEventListener("click", (e) => {
    if (!suggestList.contains(e.target) && e.target !== input)
      hideSuggestions();
  });

  // =========================================================
  // SEARCH LOGIC
  // =========================================================
  async function performSearchFromGeocodeItem(item) {
    // 1) Se è nazione -> mostra tutte le sedi di quel paese
    if (isCountryResult(item) && item.countryCode) {
      const list = filterStationsByCountry(item.countryCode);
      if (!list.length) {
        renderEmpty(
          "Nessun risultato",
          "Nessuna sede trovata per questa nazione.",
        );
        return;
      }
      renderResults(list, false);
      return;
    }

    // 2) Altrimenti (città/CAP/indirizzo) -> entro 20km dalla località cercata
    const list = filterStationsWithinKm(
      item.lat,
      item.lng,
      SEARCH_MAX_DISTANCE_KM,
      null,
      null,
    );
    if (!list.length) {
      renderEmpty(
        "Nessun risultato",
        `Nessuna sede entro ${SEARCH_MAX_DISTANCE_KM} km da questa località.`,
      );
      return;
    }
    renderResults(list, false); // ✅ da input NON mostriamo mai km
  }

  let debounceTimer = null;

  async function handleInputSearch(onlySuggest = false) {
    const q = input.value.trim();
    if (!q) {
      hideSuggestions();
      clearResults();
      return;
    }

    const suggestions = await geocode(q);

    showSuggestions(suggestions, (picked) => {
      input.value = picked.display;
      performSearchFromGeocodeItem(picked);
    });

    if (onlySuggest) return;

    hideSuggestions();
    if (!suggestions[0]) {
      renderEmpty(
        "Nessun risultato",
        "Non riesco a trovare questa località/CAP/nazione.",
      );
      return;
    }

    performSearchFromGeocodeItem(suggestions[0]);
  }

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => handleInputSearch(true), 300);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputSearch(false);
    }
    if (e.key === "Escape") {
      hideSuggestions();
    }
  });

  // =========================================================
  // GEOLOCATION BUTTON
  // =========================================================
  function getCurrentPosition(opts = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalizzazione non supportata dal browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, opts);
    });
  }

  geoBtn.addEventListener("click", async () => {
    hideSuggestions();

    try {
      const pos = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      userCenter = { lat, lng };

      // ✅ geolocalizzazione: entro 10km + mostra km
      const list = filterStationsWithinKm(
        lat,
        lng,
        GEO_MAX_DISTANCE_KM,
        lat,
        lng,
      );
      if (!list.length) {
        renderEmpty(
          "Nessun risultato",
          `Nessuna sede entro ${GEO_MAX_DISTANCE_KM} km dalla tua posizione.`,
        );
        return;
      }
      renderResults(list, true);
      input.value = "Posizione corrente";
    } catch (err) {
      console.warn("[location-poll] geolocation error:", err);
      userCenter = null;
      renderEmpty(
        "Geolocalizzazione non disponibile",
        err && err.code === 1
          ? "Permesso negato. Abilita la geolocalizzazione e riprova."
          : "Impossibile ottenere la posizione. Riprova o cerca una località/CAP/nazione.",
      );
    }
  });

  // INIT
  clearResults();
})();
