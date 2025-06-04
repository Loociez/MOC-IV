// Image stages with minPoints, image URLs, and effects config
const stages = [
  { minPoints: 0, image: "images/stage1.jpg", effect: { color: 'gold', scale: 1.2, classes: [] } }, // Stage 1
  { minPoints: 50, image: "https://i.imgur.com/TKXu7mh.png", effect: { color: 'lightblue', scale: 1.2, classes: [] } }, // Stage 2
  { minPoints: 150, image: "https://i.imgur.com/WbYVqYZ.png", effect: { color: 'limegreen', scale: 1.2, classes: ['shadowGlow'] } }, // Stage 3
  { minPoints: 300, image: "https://i.imgur.com/j3KHQwF.png", effect: { color: 'hotpink', scale: 1.4, classes: ['spin'] } }, // Stage 4
  { minPoints: 600, image: "https://i.imgur.com/ptQ7YwL.png", effect: { color: 'orange', scale: 1.5, classes: ['spin', 'pulse'] } }, // Stage 5
];

let points = 0;

const clickImage = document.getElementById('clickImage');
const pointsDisplay = document.getElementById('pointsDisplay');
const endSessionBtn = document.getElementById('endSessionBtn');
const showLeaderboardBtn = document.getElementById('showLeaderboardBtn');
const hideLeaderboardBtn = document.getElementById('hideLeaderboardBtn');
const leaderboard = document.getElementById('leaderboard');
const leaderboardList = document.getElementById('leaderboardList');

function updatePoints() {
  pointsDisplay.textContent = `Points: ${points}`;

  let currentStage = stages[0];
  for (const stage of stages) {
    if (points >= stage.minPoints) {
      currentStage = stage;
    }
  }
  clickImage.src = currentStage.image;
}

// Helper: remove all effect classes from image
function clearEffectClasses() {
  clickImage.classList.remove('clicked', 'shadowGlow', 'spin', 'pulse');
}

clickImage.addEventListener('click', () => {
  points++;
  updatePoints();

  // Determine current stage effect
  let currentStage = stages[0];
  for (const stage of stages) {
    if (points >= stage.minPoints) {
      currentStage = stage;
    }
  }

  // Clear old classes
  clearEffectClasses();

  // Add scale "pop" effect by default via clicked class,
  // but override scale in animation if needed
  clickImage.style.transform = `scale(${currentStage.effect.scale})`;
  clickImage.classList.add('clicked');

  // Add additional effect classes if any
  currentStage.effect.classes.forEach(cls => clickImage.classList.add(cls));

  // Remove all effect classes and reset transform after 500ms (animation duration)
  setTimeout(() => {
    clearEffectClasses();
    clickImage.style.transform = '';
  }, 500);

  // Create floating +1 element with stage color
  const floatingText = document.createElement('div');
  floatingText.classList.add('floating-text');
  floatingText.textContent = '+1';
  floatingText.style.color = currentStage.effect.color || 'gold';

  const rect = clickImage.getBoundingClientRect();
  floatingText.style.top = `${rect.top - 10 + window.scrollY}px`;
  floatingText.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;

  document.body.appendChild(floatingText);

  floatingText.addEventListener('animationend', () => {
    floatingText.remove();
  });
});

// Leaderboard functions (unchanged)...

function loadLeaderboard() {
  const data = localStorage.getItem('clickerLeaderboard');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveLeaderboard(list) {
  localStorage.setItem('clickerLeaderboard', JSON.stringify(list));
}

function showLeaderboard() {
  const list = loadLeaderboard();
  if (list.length === 0) {
    leaderboardList.innerHTML = '<li>No scores yet.</li>';
  } else {
    list.sort((a, b) => b.points - a.points);
    leaderboardList.innerHTML = '';
    for (const entry of list) {
      const li = document.createElement('li');
      li.textContent = `${entry.name}: ${entry.points} points`;
      leaderboardList.appendChild(li);
    }
  }
  leaderboard.style.display = 'block';
  showLeaderboardBtn.style.display = 'none';
  hideLeaderboardBtn.style.display = 'inline-block';
}

function hideLeaderboard() {
  leaderboard.style.display = 'none';
  showLeaderboardBtn.style.display = 'inline-block';
  hideLeaderboardBtn.style.display = 'none';
}

endSessionBtn.addEventListener('click', () => {
  if (points === 0) {
    alert("You don't have any points to save!");
    return;
  }
  let name = prompt("Enter your name for the leaderboard:", "");
  if (!name) {
    alert("Name cannot be empty.");
    return;
  }
  const leaderboardData = loadLeaderboard();
  leaderboardData.push({ name: name.trim(), points });
  saveLeaderboard(leaderboardData);
  alert(`Thanks, ${name}! Your score of ${points} points was saved.`);
  points = 0;
  updatePoints();
});

showLeaderboardBtn.addEventListener('click', showLeaderboard);
hideLeaderboardBtn.addEventListener('click', hideLeaderboard);

// Initialize display
updatePoints();
