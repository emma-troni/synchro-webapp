document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("track");
  const text = document.getElementById("text");
  const container = document.querySelector(".marquee");

  const speed = 0.5; // px per frame
  let pos = 0;

  // Misure
  const textWidth = text.offsetWidth;
  const containerWidth = container.offsetWidth;

  // Creiamo almeno due copie per il loop fluido
  track.innerHTML = "";
  track.appendChild(text);
  const clone1 = text.cloneNode(true);
  const clone2 = text.cloneNode(true);
  track.appendChild(clone1);
  track.appendChild(clone2);

  const totalWidth = text.offsetWidth * 3; // tre copie

  function animateMarquee() {
    pos -= speed;

    // Se abbiamo superato la larghezza di una copia, resettiamo pos
    if (pos <= -textWidth) {
      pos += textWidth;
    }

    track.style.transform = `translateX(${pos}px)`;
    requestAnimationFrame(animateMarquee);
  }

  animateMarquee();
});
