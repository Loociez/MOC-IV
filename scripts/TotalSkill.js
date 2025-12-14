(() => {
  // Inject blue fill style for skill bars in both containers
  const styleId = 'custom-skillbar-blue-fill';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Change skill bar fill to blue for main and floating skill windows */
      #winSkillsContent .barValue,
      #floatingWinSkillsContent .barValue {
        background: linear-gradient(90deg, #3399FF, #0066CC);
        border-radius: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  GUI('winSkills', 'Show');

  const enabledSkilTrackers = JSON.parse(window.localStorage.getItem('totalEnhancerSkillTracking') || '{}') || {};
  const chkBoxClick = (skillName) => (e) => {
    enabledSkilTrackers[skillName] = e.currentTarget.checked;
    window.localStorage.setItem('totalEnhancerSkillTracking', JSON.stringify(enabledSkilTrackers));
  };

  const container = document.getElementById("winSkillsContent");

  for (let b of Array.from(container.querySelectorAll('div'))) {
    if (b.classList.contains('barSkill')) {
      if (!b.querySelector('input')) {
        const inputCheckbox = document.createElement("input");
        inputCheckbox.type = 'checkbox';
        const skillName = b.innerText.split(' ')[0];
        inputCheckbox.checked = enabledSkilTrackers[skillName] || false;
        inputCheckbox.addEventListener('click', chkBoxClick(skillName));
        b.appendChild(inputCheckbox);
      }
    }
  }

  if (window.totalEnhancerSkillTrackingTimer) {
    clearInterval(window.totalEnhancerSkillTrackingTimer);
  }

  window.totalEnhancerSkillTrackingTimer = setInterval(() => {
    const skillsToDisplay = ['Non-Existing-Skill'];
    for (let [k, v] of Object.entries(enabledSkilTrackers)) {
      if (v) {
        skillsToDisplay.push(k);
      }
    }

    const floatingSkillsDiv = document.getElementById('floatingWinSkillsContent') || document.createElement("div");
    floatingSkillsDiv.id = 'floatingWinSkillsContent';
    floatingSkillsDiv.style = 'display: block; position:absolute;left: 100px;top:20px;';
    floatingSkillsDiv.innerHTML = "";

    if (skillsToDisplay.length) {
      if (document.getElementById('winSkills').style.display == 'none') {
        GUI('winSkills', 'Show');
      }
      const container = document.getElementById("winSkillsContent");
      document.getElementById('winGame').appendChild(floatingSkillsDiv);
      let i = 0;
      for (let b of Array.from(container.querySelectorAll('div'))) {
        if (b.classList.contains('barSkill')) {
          const skillName = b.innerText.split(' ')[0];
          if (!b.querySelector('input')) {
            const inputCheckbox = document.createElement("input");
            inputCheckbox.type = 'checkbox';
            inputCheckbox.checked = enabledSkilTrackers[skillName] || false;
            inputCheckbox.addEventListener('input', chkBoxClick(skillName));
            b.appendChild(inputCheckbox);
          }
          if (skillsToDisplay.indexOf(skillName) >= 0) {
            const skillInfo = document.createElement('div');
            skillInfo.innerHTML = b.innerHTML;
            skillInfo.className = b.className;
            const cb = skillInfo.querySelector("input");
            cb.checked = true;
            cb.addEventListener('input', chkBoxClick(skillName));
            skillInfo.style = b.style;
            floatingSkillsDiv.appendChild(skillInfo);

            const bar = b.nextSibling.cloneNode(true);
            bar.style = b.nextElementSibling.style;
            bar.style.width = '200px';
            bar.style.position = 'relative';
            bar.style.display = "inline-block";
            floatingSkillsDiv.appendChild(bar);

            skillInfo.style.width = '500px';
          }
        }
      }
    }
  }, 1200);
})();
