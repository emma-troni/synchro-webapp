function setVh() {
  // 1% dell’altezza viewport reale
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

// Aggiorna al load e al resize
setVh();
window.addEventListener("resize", setVh);
