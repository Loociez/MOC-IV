(function () {
  if (document.getElementById("floatingRewardBtn")) return;

  const btn = document.createElement("div");
  btn.id = "floatingRewardBtn";
  btn.textContent = "📦";
  btn.title = "Claim Daily Reward";

  Object.assign(btn.style, {
    position: "fixed",
    top: "10px",
    right: "10px",
    zIndex: 99999,
    fontSize: "18px",                // Smaller font
    background: "rgba(0, 0, 0, 0.6)",
    color: "#fff",
    padding: "4px 8px",              // Less padding
    borderRadius: "6px",            // Slightly tighter radius
    cursor: "pointer",
    userSelect: "none",
  });

  btn.addEventListener("mouseenter", () => btn.style.background = "rgba(100, 100, 100, 0.8)");
  btn.addEventListener("mouseleave", () => btn.style.background = "rgba(0, 0, 0, 0.6)");

  btn.onclick = async () => {
    try {
      if (typeof GUI === "function") {
        GUI("winGame", "Quests");
      }

      await new Promise(r => setTimeout(r, 300));
      const adventurerBtn = [...document.querySelectorAll("button")]
        .find(btn => btn.textContent.trim() === "Adventurer");

      if (adventurerBtn) adventurerBtn.click();
      else return alert("Could not find 'Adventurer' button.");

      await new Promise(r => setTimeout(r, 300));
      const claimBtn = [...document.querySelectorAll("button")]
        .find(btn => btn.textContent.trim() === "Claim Daily Reward");

      if (claimBtn) claimBtn.click();
      else alert("Could not find 'Claim Daily Reward' button.");
    } catch (e) {
      alert("Error while trying to open reward: " + e.message);
    }
  };

  document.body.appendChild(btn);
})();
