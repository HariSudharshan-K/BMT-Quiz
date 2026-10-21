const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');
const DEFAULT_SESSION = 'main';
const PARTICIPANT_PASSWORD = process.env.PARTICIPANT_PASSWORD || 'letsgoo';
const HOST_PASSWORD = process.env.HOST_PASSWORD || 'set-a-private-host-password';

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/auth', (req, res) => {
  const { role, password } = req.body || {};
  const expected = role === 'host' ? HOST_PASSWORD : role === 'participant' ? PARTICIPANT_PASSWORD : null;
  if (!expected || typeof password !== 'string' || password !== expected) {
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }
  res.json({ ok: true });
});

// Data shape: { [session]: { [team]: record } }
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  saveData({});
}

function getSession(req) {
  const s = req.query.session || req.body?.session;
  return (s && String(s).trim()) || DEFAULT_SESSION;
}

// Get a specific team's submission within a session (if any) — used to restore state on reload
app.get('/api/submission/:team', (req, res) => {
  const data = loadData();
  const session = getSession(req);
  const team = req.params.team;
  if (data[session] && data[session][team]) {
    res.json(data[session][team]);
  } else {
    res.status(404).json({ error: 'not found' });
  }
});

// Submit final answers — locked, one-time per session (unless reset)
app.post('/api/submit', (req, res) => {
  const { team, grid, score, total, elapsedSeconds } = req.body;
  const session = getSession(req);
  if (!team || typeof team !== 'string' || !team.trim()) {
    return res.status(400).json({ error: 'team name required' });
  }
  const data = loadData();
  if (!data[session]) data[session] = {};
  if (data[session][team]) {
    // already submitted in this session — return existing record instead of overwriting
    return res.json(data[session][team]);
  }
  const record = {
    team: team.trim(),
    score,
    total,
    elapsedSeconds: elapsedSeconds || null,
    submittedAt: new Date().toISOString(),
    grid,
  };
  data[session][team] = record;
  saveData(data);
  res.json(record);
});

// Leaderboard for a specific session, sorted best-first
app.get('/api/leaderboard', (req, res) => {
  const data = loadData();
  const session = getSession(req);
  const records = Object.values(data[session] || {});
  records.sort((a, b) => b.score - a.score || (a.elapsedSeconds ?? 1e9) - (b.elapsedSeconds ?? 1e9));
  res.json(records);
});

// List all known session names (handy for the host to see what's on record)
app.get('/api/sessions', (req, res) => {
  const data = loadData();
  res.json(Object.keys(data));
});

// Host-only: reset one session, or everything if no session given + explicit confirm
app.post('/api/reset', (req, res) => {
  const { confirm, session } = req.body;
  const data = loadData();
  if (session) {
    // reset just this one session — lighter-weight, no special confirm phrase needed
    delete data[session];
    saveData(data);
    return res.json({ ok: true, reset: session });
  }
  if (confirm !== 'YES_RESET_EVERYTHING') {
    return res.status(400).json({ error: 'confirmation required to reset ALL sessions' });
  }
  saveData({});
  res.json({ ok: true, reset: 'ALL' });
});

app.listen(PORT, () => {
  console.log(`Venturium BQuiz server running on port ${PORT}`);
});
