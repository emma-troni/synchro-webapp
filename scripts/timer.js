document.addEventListener("DOMContentLoaded", () => {
  /* ===================== ELEMENTI DOM ====================== */

  const timer = document.getElementById("timer");
  const headerTimerSpace = document.querySelector(".timer-space");
  const headerTimerText = document.querySelector(".timer-text");
  const recapTimerContent = document.querySelector(".timer-content");
  const navButtons = document.querySelectorAll("nav button");

  if (!timer || !headerTimerSpace || !recapTimerContent) {
    console.error("Timer elements missing in DOM");
    return;
  }

  /* ===================== COUNTDOWN ====================== */

  const endTime = new Date("2026-01-10T00:00:00").getTime();
  let timerInterval = null;

  function updateTimer() {
    const now = Date.now();
    let remaining = endTime - now;

    if (remaining <= 0) {
      remaining = 0;
      clearInterval(timerInterval);
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    timer.textContent =
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0");
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);

  /* ===================== POSIZIONE TIMER ====================== */

  function updateTimerPosition() {
    const activeView = document.querySelector(".view.active");

    if (!activeView) return;

    if (activeView.id === "recap-lock") {
      // Mostra il timer nel recap
      recapTimerContent.appendChild(timer);
      if (headerTimerText) headerTimerText.style.display = "none";
    } else if (activeView.id === "recap-unlock") {
      // Rimuovi il timer dal DOM
      if (timer.parentNode) timer.parentNode.removeChild(timer);
    } else if (activeView.id === "final-vote-overlay") {
      // Rimuovi il timer dal DOM
      if (timer.parentNode) timer.parentNode.removeChild(timer);
    } else {
      // Timer normale in header
      headerTimerSpace.appendChild(timer);
      if (headerTimerText) headerTimerText.style.display = "";
    }
  }

  /* ===================== NAVIGAZIONE ====================== */

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetView = button.dataset.view;

      document.querySelectorAll(".view").forEach((view) => {
        view.classList.toggle("active", view.id === targetView);
      });

      updateTimerPosition();
    });
  });

  /* ===================== STATO INIZIALE ====================== */

  updateTimerPosition();
});
