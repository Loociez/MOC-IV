(function (d, w) {
    GUI('winSkills', 'Show');
    
    const enabledSkilTrackers = JSON.parse(w.localStorage.getItem('totalEnhancerSkillTracking') || '{}') || {};
    const chkBoxClick = (skillName)=>(e) => { 
        enabledSkilTrackers[skillName] = e.currentTarget.checked;
        w.localStorage.setItem('totalEnhancerSkillTracking', JSON.stringify(enabledSkilTrackers));
    };
    const container = d.getElementById("winSkillsContent");
    for (let b of Array.from(container.querySelectorAll('div'))) {
        if (b.classList.contains('barSkill')) {
            if (!b.querySelector('input')) {
                const inputCheckbox = d.createElement("input");
                inputCheckbox.type = 'checkbox';
                const skillName = b.innerText.split(' ')[0];
                inputCheckbox.checked = enabledSkilTrackers[skillName] || false;
                inputCheckbox.addEventListener('click', chkBoxClick(skillName));
                b.appendChild(inputCheckbox); 
                } 
            } 
        } 
        if (w.totalEnhancerSkillTrackingTimer) {
            clearInterval(w.totalEnhancerSkillTrackingTimer);
            
        }
        w.totalEnhancerSkillTrackingTimer = setInterval(() => {
            const skillsToDisplay = ['Non-Existing-Skill'];
            for (let [k, v] of Object.entries(enabledSkilTrackers)) {
                if (v) { skillsToDisplay.push(k); } 
            } 
            const floatingSkillsDiv = d.getElementById('floatingWinSkillsContent') || document.createElement("div");
            floatingSkillsDiv.id = 'floatingWinSkillsContent';
            floatingSkillsDiv.style = 'display: block; position:absolute;left: 100px;top:20px;'; 
            floatingSkillsDiv.innerHTML = "";
            if (skillsToDisplay.length) { 
                if (d.getElementById('winSkills').style.display == 'none'){
                    GUI('winSkills', 'Show');
                }
                const container = d.getElementById("winSkillsContent");
                d.getElementById('winGame').appendChild(floatingSkillsDiv);
                let i = 0;
                for (let b of Array.from(container.querySelectorAll('div'))) {
                     if (b.classList.contains('barSkill')) {
                        const skillName = b.innerText.split(' ')[0];
                        if (!b.querySelector('input')) {
                            const inputCheckbox = d.createElement("input");
                            inputCheckbox.type = 'checkbox';
                            const skillName = b.innerText.split(' ')[0];
                            inputCheckbox.checked = enabledSkilTrackers[skillName] || false;
                            inputCheckbox.addEventListener('input', chkBoxClick(skillName));
                            b.appendChild(inputCheckbox); 
                        } 
                        if (skillsToDisplay.indexOf(skillName) >= 0) { 
                            const skillInfo = d.createElement('div'); 
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
                            floatingSkillsDiv.appendChild(bar);
                            skillInfo.style.width = '500px';
                            bar.style.display = "inline-block";
                        } 
                    } 
                } 
            } 
        }, 1200); 
    })(document, window);