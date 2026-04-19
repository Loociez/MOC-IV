const STORAGE_KEY = "aiStats_v1";

function loadStats() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function ensureAI(stats, name) {
  if (!stats[name]) {
    stats[name] = {
      wins: 0,
      losses: 0,
      rating: 1000
    };
  }
}

export function getAIStats(name) {
  const stats = loadStats();
  ensureAI(stats, name);
  return stats[name];
}

/* =========================
   🧠 ELO SYSTEM
========================= */
function calculateElo(rA, rB, scoreA) {
  const k = 24;

  const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const newA = rA + k * (scoreA - expectedA);

  return Math.round(newA);
}

/* =========================
   🏆 RECORD RESULT
========================= */
export function recordResult(aiA, aiB, winnerName) {
  const stats = loadStats();

  ensureAI(stats, aiA);
  ensureAI(stats, aiB);

  const A = stats[aiA];
  const B = stats[aiB];

  const scoreA = winnerName === aiA ? 1 : 0;
  const scoreB = winnerName === aiB ? 1 : 0;

  const newRatingA = calculateElo(A.rating, B.rating, scoreA);
  const newRatingB = calculateElo(B.rating, A.rating, scoreB);

  A.rating = newRatingA;
  B.rating = newRatingB;

  if (scoreA) {
    A.wins++;
    B.losses++;
  } else {
    B.wins++;
    A.losses++;
  }

  saveStats(stats);
}

/* =========================
   🎲 ODDS CALCULATION
========================= */
export function getOdds(aiA, aiB) {
  const A = getAIStats(aiA);
  const B = getAIStats(aiB);

  const probA = 1 / (1 + Math.pow(10, (B.rating - A.rating) / 400));
  const probB = 1 - probA;

  return {
    [aiA]: Number((1 / probA).toFixed(2)),
    [aiB]: Number((1 / probB).toFixed(2))
  };
}

/* =========================
   📊 LEADERBOARD
========================= */
export function getLeaderboard() {
  const stats = loadStats();

  return Object.entries(stats)
    .map(([name, data]) => ({
      name,
      ...data
    }))
    .sort((a, b) => b.rating - a.rating);
}

export function renderLeaderboardUI(containerId) {
  const container = document.getElementById(containerId);
  const topAIs = getLeaderboard().slice(0, 10); // Get top 10

  container.innerHTML = topAIs.map((ai, index) => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; padding: 2px 4px; ${index === 0 ? 'color: orange; font-weight: bold;' : ''}">
      <span>${index + 1}. ${ai.name}</span>
      <span>${ai.rating}</span>
    </div>
  `).join('');
}
