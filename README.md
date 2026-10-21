# VENTURIUM — Best Management Team | BQuiz Round

A live interactive MBA crossword for the Venturium Best Management Team BQuiz Round.

## Files
- `server.js` — Express backend for submissions, scores, leaderboard, and password checks.
- `public/index.html` — participant crossword and host dashboard interface.
- `public/layout.json` — crossword grid, clues, and answer key.
- `public/bg.jpg` — the supplied Roman city background, compressed for web use.
- `data/submissions.json` — submission data file (created automatically if missing).

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## Deploy on Render
Create a **Web Service** from this repository.
- Build command: `npm install`
- Start command: `npm start`

Set these environment variables in Render:
- `PARTICIPANT_PASSWORD` = `letsgoo`
- `HOST_PASSWORD` = choose a different private password for the host dashboard.

The service uses a JSON file for submissions. For events requiring durable storage across redeploys, configure a persistent disk or move storage to a managed database.

## Event links
- Participant page: `https://YOUR-SERVICE.onrender.com/`
- Host dashboard: `https://YOUR-SERVICE.onrender.com/?host=1`

Participants enter their team name and the participant password before the timer starts. The 10-minute timer automatically submits answers when it expires. Scores are sorted by points and then by elapsed time.

Keep the host password private. The host dashboard requires it before showing the leaderboard.
