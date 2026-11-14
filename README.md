# NHL Game Center

A simple NHL scoreboard made for a college web development project. It shows games for a selected date, including team logos, scores, game status, and player box-score stats.

**Live website:** https://eli-cub.github.io/Project-5-API/ (enable GitHub Pages to publish)

## Features

- NHL games loaded from the ESPN Scoreboard API using `fetch()`
- Previous and next day navigation
- Daily player stats from ESPN game summaries:
  - Point leaders (goals, assists, points)
  - Every goal scorer for the selected date
  - Goalies (saves, shots against, goals against, save percentage)
- Three tabs to switch between player stat categories
- Animated scoreboard cards that fade in and slide up
- Responsive layout using CSS Grid and Flexbox

## Technologies

- HTML, CSS, and vanilla JavaScript
- ESPN NHL [Scoreboard](https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard) and [Game Summary](https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary?event=401688263) APIs (unofficial)
- [Anime.js](https://animejs.com/) (version 3.2.2, loaded from a CDN)

## Run locally

Open `index.html` in a browser, or use VS Code Live Server. An internet connection is needed for the API and Anime.js.

## GitHub Pages

Go to the repository's **Settings > Pages**, choose **Deploy from a branch**, then select the `main` branch and the `/ (root)` folder. Save the settings and open the live website link above once deployment finishes.

Player statistics are per game on the selected date, not season totals. Only games that have started have box scores. Some stats may be missing if a game summary is unavailable. ESPN's endpoints are unofficial, so their availability and response formats may change.
