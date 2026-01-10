// Disabilita zoom su doppio click (desktop)
document.addEventListener(
  "dblclick",
  function (e) {
    e.preventDefault();
  },
  { passive: false }
);

// Disabilita doppio tap (mobile – iOS / Android)
let lastTouchEnd = 0;

document.addEventListener(
  "touchend",
  function (e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);
