# NHL Game Center

A simple NHL scoreboard made for a college web development project. It shows games for a selected date, including team logos, scores, and game status.

**Live website:** https://eli-cub.github.io/Project-5-API/ (enable GitHub Pages to publish)

## Features

- NHL games loaded from the ESPN Scoreboard API using `fetch()`
- Previous and next day navigation
- Animated game cards that fade in and slide up
- Responsive layout using CSS Grid and Flexbox

## Technologies

- HTML, CSS, and vanilla JavaScript
- [ESPN NHL Scoreboard API](https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard) (unofficial)
- [Anime.js](https://animejs.com/) (version 3.2.2, loaded from a CDN)

## Run locally

Open `index.html` in a browser, or use a simple local web server such as VS Code Live Server. An internet connection is needed for the API and Anime.js.

## GitHub Pages

Go to the repository's **Settings > Pages**, choose **Deploy from a branch**, then select the `main` branch and the `/ (root)` folder. Save the settings and open the live website link above once deployment finishes.

ESPN's endpoint is unofficial, so its availability and response format may change.
