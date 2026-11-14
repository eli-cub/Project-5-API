const API_URL = "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard";
const SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=";

const gamesContainer = document.getElementById("games");
const dateLabel = document.getElementById("date-label");
const message = document.getElementById("message");
const statsMessage = document.getElementById("stats-message");
const statsTable = document.getElementById("stats-table");
const statsHead = document.getElementById("stats-head");
const statsBody = document.getElementById("stats-body");

let selectedDate = new Date();
let requestNumber = 0;
let activeTab = "points";
let playerStats = { points: [], goals: [], goalies: [] };
let failedGames = 0;

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
  // Anime.js fades in each scoreboard card with a short delay.
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

// ESPN supplies each player's stats in an array, with matching labels.
function getStat(group, entry, names) {
  const labels = group.labels || [];
  const index = labels.findIndex(label => {
    const name = String(label).toUpperCase().replace(/%/g, "PCT").replace(/[^A-Z0-9]/g, "");
    return names.includes(name);
  });

  if (index < 0) return null;
  const raw = String(entry.stats?.[index] ?? "").replace(/[% ,]/g, "");
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function readBoxscore(data, skaters, goalies) {
  for (const teamBlock of data.boxscore?.players || []) {
    const team = teamBlock.team?.abbreviation || "";
    const seen = new Set();

    for (const group of teamBlock.statistics || []) {
      const groupName = String(group.name || "").toLowerCase();
      const isGoalie = groupName.includes("goalie");
      const isSkater = ["forwards", "defenses", "defensemen", "skaters"].includes(groupName);
      if (!isGoalie && !isSkater) continue;

      for (const entry of group.athletes || []) {
        const athlete = entry.athlete || {};
        if (!athlete.displayName || !Array.isArray(entry.stats)) continue;

        const base = {
          name: athlete.displayName,
          team,
          photo: athlete.headshot?.href || ""
        };

        if (isGoalie) {
          const saves = getStat(group, entry, ["SV", "SAVES"]) ?? 0;
          const against = getStat(group, entry, ["GA", "GOALSAGAINST"]) ?? 0;
          const shots = getStat(group, entry, ["SA", "SHOTSAGAINST"]) ?? saves + against;
          if (shots === 0 && saves === 0) continue;

          const reportedPct = getStat(group, entry, ["SVPCT", "SAVEPCT", "SAVEPERCENTAGE"]);
          const savePct = reportedPct === null
            ? (shots > 0 ? saves / shots : 0)
            : (reportedPct > 1 ? reportedPct / 100 : reportedPct);

          goalies.push({ ...base, saves, shots, against, savePct });
        } else {
          const id = athlete.id || athlete.displayName;
          if (seen.has(id)) continue;
          seen.add(id);

          const goals = getStat(group, entry, ["G", "GOALS"]) ?? 0;
          const assists = getStat(group, entry, ["A", "AST", "ASSISTS"]) ?? 0;
          if (goals + assists > 0) {
            skaters.push({ ...base, goals, assists, points: goals + assists });
          }
        }
      }
    }
  }
}

function makeCell(text, isHeader = false) {
  const cell = document.createElement(isHeader ? "th" : "td");
  cell.textContent = text;
  return cell;
}

function renderPlayerStats() {
  const titles = { points: "Point Leaders", goals: "Goal Scorers", goalies: "Goalie Stats" };
  const rows = playerStats[activeTab];
  const goalieTab = activeTab === "goalies";

  document.getElementById("stats-title").textContent = titles[activeTab];
  document.getElementById("stats-count").textContent = rows.length ? `${rows.length} players` : "";
  statsHead.replaceChildren();
  statsBody.replaceChildren();

  const header = document.createElement("tr");
  (goalieTab ? ["Player", "SV", "SA", "GA", "SV%"] : ["Player", "G", "A", "PTS"])
    .forEach(label => header.appendChild(makeCell(label, true)));
  statsHead.appendChild(header);

  rows.forEach(player => {
    const row = document.createElement("tr");
    const infoCell = document.createElement("td");
    const info = document.createElement("div");
    info.className = "player-info";

    if (player.photo) {
      const photo = document.createElement("img");
      photo.src = player.photo;
      photo.alt = "";
      info.appendChild(photo);
    }

    const details = document.createElement("div");
    const name = document.createElement("span");
    name.className = "player-name";
    name.textContent = player.name;

    const team = document.createElement("span");
    team.className = "player-team";
    team.textContent = player.team;
    details.append(name, team);
    info.appendChild(details);
    infoCell.appendChild(info);
    row.appendChild(infoCell);

    const numbers = goalieTab
      ? [player.saves, player.shots, player.against, player.savePct.toFixed(3)]
      : [player.goals, player.assists, player.points];
    numbers.forEach(value => row.appendChild(makeCell(value)));
    statsBody.appendChild(row);
  });

  statsTable.hidden = rows.length === 0;

  if (rows.length === 0) {
    statsMessage.hidden = false;
    statsMessage.textContent = failedGames
      ? "Player stats could not be loaded for one or more games."
      : "No player stats available for this category yet.";
  } else if (failedGames) {
    statsMessage.hidden = false;
    statsMessage.textContent = `Some game stats are unavailable (${failedGames} game(s)).`;
  } else {
    statsMessage.hidden = true;
    statsMessage.textContent = "";
  }
}

async function loadPlayerStats(games, thisRequest) {
  const started = games.filter(game => game.id && game.status?.type?.state !== "pre");

  if (started.length === 0) {
    statsMessage.textContent = "Player stats will appear when games begin.";
    statsTable.hidden = true;
    return;
  }

  // A game summary contains the skater and goalie box score for that game.
  const results = await Promise.all(started.map(async game => {
    try {
      const response = await fetch(`${SUMMARY_URL}${encodeURIComponent(game.id)}`);
      if (!response.ok) throw new Error("Summary request failed");
      return await response.json();
    } catch (error) {
      console.error("Could not load game stats:", game.id, error);
      return null;
    }
  }));

  if (thisRequest !== requestNumber) return;

  const skaters = [];
  const goalies = [];
  failedGames = results.filter(result => result === null).length;
  results.filter(Boolean).forEach(result => readBoxscore(result, skaters, goalies));

  playerStats = {
    points: skaters.sort((a, b) => b.points - a.points || b.goals - a.goals),
    goals: skaters.filter(player => player.goals > 0)
      .sort((a, b) => b.goals - a.goals || b.points - a.points),
    goalies: goalies.sort((a, b) => b.saves - a.saves)
  };

  renderPlayerStats();
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
  statsTable.hidden = true;
  statsMessage.hidden = false;
  statsMessage.textContent = "Loading player stats...";
  document.getElementById("stats-count").textContent = "";
  playerStats = { points: [], goals: [], goalies: [] };
  failedGames = 0;

  try {
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

    await loadPlayerStats(games, thisRequest);
  } catch (error) {
    if (thisRequest !== requestNumber) return;
    message.textContent = "Could not load games. Please try again later.";
    statsMessage.textContent = "Could not load player stats.";
    console.error(error);
  }
}

document.querySelectorAll(".stat-tab").forEach(button => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    document.querySelectorAll(".stat-tab").forEach(tab => {
      const selected = tab === button;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-pressed", selected);
    });
    if (!statsMessage.textContent.startsWith("Loading")) renderPlayerStats();
  });
});

document.getElementById("previous-day").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  loadGames();
});

document.getElementById("next-day").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() + 1);
  loadGames();
});

loadGames();
