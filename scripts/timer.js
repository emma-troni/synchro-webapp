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
  const recapTimerContent = document.querySelector(".timer-content");
  const navButtons = document.querySelectorAll("nav button");

  if (!timer || !headerTimerSpace || !recapTimerContent) {
    console.error("Timer elements missing in DOM");
    return;
  }

  /* ===================== COUNTDOWN ====================== */

  const endTime = new Date("2026-02-03T23:00:00").getTime();
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
