// Funzione per aggiornare l'ora di sistema e l'ora di Toronto
function updateSystemTime() {
  const now = new Date(); // Ora locale del sistema

  // --- Ora locale ---
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const formattedLocalTime = `${hours}:${minutes}:${seconds}`;

  const systemTimeEl = document.getElementById("system-time");
  if (systemTimeEl) {
    systemTimeEl.textContent = formattedLocalTime;
  }

  // --- Ora di Toronto ---
  const torontoTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

  const newTimeEl = document.getElementById("new-time");
  if (newTimeEl) {
    newTimeEl.textContent = torontoTime;
  }
}

// Aggiorna subito al caricamento della pagina
updateSystemTime();

// Aggiorna ogni secondo per mantenere i secondi in tempo reale
setInterval(updateSystemTime, 1000);
