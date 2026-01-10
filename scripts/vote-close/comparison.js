document.addEventListener("DOMContentLoaded", () => {
  const measureContainer = document.getElementById("measure-compare");
  const activities = ["eat", "sleep", "work", "other"];
  const rankContent = measureContainer.querySelector(".rank-content");
  rankContent.innerHTML = "";

  for (let hour = 0; hour < 24; hour++) {
    const line = document.createElement("div");
    line.className = "line-ranking";
    const hourStr = String(hour).padStart(2, "0") + ":00";
    const activity1 = activities[Math.floor(Math.random() * activities.length)];
    const activity2 = activities[Math.floor(Math.random() * activities.length)];
    line.innerHTML = `
      <div class="activity-chosen">${activity1}</div>
      <div class="hour-of-day">${hourStr}</div>
      <div class="activity-chosen">${activity2}</div>
    `;
    rankContent.appendChild(line);
  }
});
