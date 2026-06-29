/***********************
 * TIMER.JS
 * Updates the timer
 * that indicates the ending of
 * Zero hour day election
 * TIMER FORMAT --> hh:mm:ss
 ***********************/

document.addEventListener("DOMContentLoaded", () => {
  /* ===================== ELEMENTI DOM ====================== */

  const timer = document.getElementById("timer");
  const headerTimerSpace = document.querySelector(".timer-space");
  const headerTimerText = document.querySelector(".timer-text");
  const recapTimerContent = document.querySelector(".timer-content"); // May be null if commented out
  const navButtons = document.querySelectorAll("nav button");

  // Only timer and headerTimerSpace are required
  if (!timer || !headerTimerSpace) {
    console.error("Timer: required elements missing (timer or timer-space)");
    return;
  }

  // recapTimerContent is optional
  if (!recapTimerContent) {
    console.log("Timer: .timer-content not found (optional element)");
  }

  /* ===================== COUNTDOWN ====================== */

  const endTime = new Date("2026-07-11T23:59:59").getTime();
  let timerInterval = null;

  function updateTimer() {
    const now = Date.now();
    let remaining = endTime - now;

    if (remaining <= 0) {
      remaining = 0;
      clearInterval(timerInterval);

      // Redirect to timeout.html preserving URL parameters (e.g., id)
      const currentParams = window.location.search;
      window.location.href = "/timeout.html" + currentParams;
      return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    const timeString =
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0");

    timer.textContent = timeString;

    // Update recap timer if it exists
    if (recapTimerContent) {
      recapTimerContent.textContent = timeString;
    }
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);

  /* ===================== POSIZIONE TIMER ====================== */

  function updateTimerPosition() {
    // This function can be extended if needed
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

  console.log("Timer initialized");
});
