function calculateGold(npc) {
  const hp = npc.vitals?.hp || 0;
  const atk = npc.stats?.atk || 0;
  const def = npc.stats?.def || 0;

  return Math.floor((hp + atk * 2 + def * 2) / 200);
}

async function loadNPCs() {
  const res = await fetch('https://loociez.github.io/MOC-IV/npc.json');
  const data = await res.json();

  const tbody = document.querySelector('#npcTable tbody');

  data.forEach(npc => {
    const gold = calculateGold(npc);

    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${npc.name}</td>
      <td>${npc.vitals.hp}</td>
      <td>${npc.stats.atk}</td>
      <td>${npc.stats.def}</td>
      <td>${gold}</td>
    `;

    tbody.appendChild(row);
  });
}

loadNPCs();