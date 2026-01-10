document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("complete-list");
  const preview = document.getElementById("rank-preview");
  if (!container) return; // sicurezza se l'elemento non esiste

  // Trova il button dentro il preview, se esiste
  const previewButton = preview ? preview.querySelector("button") : null;

  // Genera 200 valori percentuali casuali
  const scores = Array.from({ length: 200 }, () =>
    (Math.random() * 100).toFixed(1)
  );

  // Ordina in modo decrescente
  scores.sort((a, b) => b - a);

  for (let i = 0; i < 200; i++) {
    const line = document.createElement("div");
    line.className = "line-ranking";

    // Applica margine di 64px all'ultimo elemento
    if (i === 199) {
      line.style.marginBottom = "64px";
    }

    line.innerHTML = `
      <div class="name-position">
        <div class="rank-position">#${String(i + 1).padStart(3, "0")}</div>
        <div class="country-name">Country ${i + 1}</div>
      </div>
      <div class="country-rank-score">${scores[i]}%</div>
    `;

    container.appendChild(line);

    // Inserisci i primi 10 elementi anche nel rank-preview prima del button
    if (i < 10 && preview) {
      const clone = line.cloneNode(true);
      if (previewButton) {
        preview.insertBefore(clone, previewButton);
      } else {
        preview.appendChild(clone);
      }
    }
  }
});
