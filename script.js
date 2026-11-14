const API_URL = "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard";

const gamesContainer = document.getElementById("games");
const dateLabel = document.getElementById("date-label");
const message = document.getElementById("message");

let selectedDate = new Date();
let requestNumber = 0;

function getAPIDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function getGameStatus(game) {
  const state = game.status?.type?.state;

  if (state === "pre") {
    const time = new Date(game.date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
    return `Scheduled - ${time}`;
  }

  if (state === "post") return "Final";
  return game.status?.type?.shortDetail || "Live";
}

function createTeamRow(competitor, hasStarted) {
  const row = document.createElement("div");
  row.className = "team";

  const logoUrl = competitor.team?.logo || competitor.team?.logos?.[0]?.href;
  if (logoUrl) {
    const logo = document.createElement("img");
    logo.src = logoUrl;
    logo.alt = "";
    row.appendChild(logo);
  }

  const name = document.createElement("span");
  name.className = "team-name";
  name.textContent = competitor.team?.displayName || "Unknown team";

  const score = document.createElement("span");
  score.className = "team-score";
  score.textContent = hasStarted ? (competitor.score ?? "-") : "-";

  row.append(name, score);
  return row;
}

function createGameCard(game) {
  const competitors = game.competitions?.[0]?.competitors || [];
  const away = competitors.find(team => team.homeAway === "away");
  const home = competitors.find(team => team.homeAway === "home");
  if (!away || !home) return null;

  const card = document.createElement("article");
  card.className = "game-card";

  const status = document.createElement("p");
  status.className = "game-status";
  status.textContent = getGameStatus(game);

  const hasStarted = game.status?.type?.state !== "pre";
  card.append(status, createTeamRow(away, hasStarted), createTeamRow(home, hasStarted));
  return card;
}

function animateCards() {
  // Anime.js makes the cards fade in one after another.
  if (typeof anime === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    anime({
      targets: ".game-card",
      opacity: [0, 1],
      translateY: [15, 0],
      delay: anime.stagger(80),
      duration: 450,
      easing: "easeOutQuad"
    });
  }
}

async function loadGames() {
  const thisRequest = ++requestNumber;
  dateLabel.textContent = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  gamesContainer.replaceChildren();
  message.hidden = false;
  message.textContent = "Loading games...";

  try {
    // The dates parameter tells ESPN which day's games to return.
    const response = await fetch(`${API_URL}?dates=${getAPIDate(selectedDate)}`);
    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    if (thisRequest !== requestNumber) return;

    const games = Array.isArray(data.events) ? data.events : [];
    games.forEach(game => {
      const card = createGameCard(game);
      if (card) gamesContainer.appendChild(card);
    });

    if (gamesContainer.children.length === 0) {
      message.textContent = "No NHL games scheduled for this date.";
    } else {
      message.hidden = true;
      animateCards();
    }
  } catch (error) {
    if (thisRequest !== requestNumber) return;
    message.textContent = "Could not load games. Please try again later.";
    console.error(error);
  }
}

document.getElementById("previous-day").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  loadGames();
});

document.getElementById("next-day").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() + 1);
  loadGames();
});

loadGames();
