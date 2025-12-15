(() => {
    let recAssign = (a, props) => {
        for (let propName in props) {
            if (a[propName] && typeof (a[propName]) === 'object') {
                recAssign(a[propName], props[propName]);
            } else {
                a[propName] = props[propName];
            }
        }
        return a;
    };
    let handler = {
        get: (target, property) => {
            return (...args) => {
                let obj = recAssign(document.createElement(property), args[0] || {});
                for (let i = 1; i < args.length; ++i) {
                    if (typeof (args[i]) === 'function') {
                        obj.appendChild(args[i]());
                    } else { obj.appendChild(args[i]); }
                };
                return obj;
            }
        }
    };
    let o = {};
    pHTML = new Proxy(o, handler);
    /* Inject blue styles for skill bars + skill headers*/
    const styleId = 'custom-skillbar-blue-fill';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
      /* Blue progress bar fill */
      #winSkillsContent .barValue,
      #floatingWinSkillsContent .barValue {
        background: linear-gradient(90deg, #3399FF, #0066CC);
        border-radius: 6px;
      }

      /* Blue semi-transparent background for skill headings */
      #winSkillsContent .barSkill,
      #floatingWinSkillsContent .barSkill {
        background: rgba(51, 153, 255, 0.18);
        border: 1px solid rgba(51, 153, 255, 0.35);
        border-radius: 3px;
        padding: 2px 3px;
        margin: 2px 0;
        font-weight: 500;
      }

      /* Checkbox spacing so it looks clean */
      #winSkillsContent .barSkill input,
      #floatingWinSkillsContent .barSkill input {
        margin-left: 3px;
      }
    `;
        document.head.appendChild(style);
    }

    GUI('winSkills', 'Show');

    const enabledSkilTrackers = JSON.parse(
        window.localStorage.getItem('totalEnhancerSkillTracking') || '{}'
    ) || {};

    const chkBoxClick = (skillName) => (e) => {
        enabledSkilTrackers[skillName] = e.currentTarget.checked;
        window.localStorage.setItem(
            'totalEnhancerSkillTracking',
            JSON.stringify(enabledSkilTrackers)
        );
    };

    const container = document.getElementById("winSkillsContent");

    for (let b of Array.from(container.querySelectorAll('div'))) {
        if (b.classList.contains('barSkill')) {
            if (!b.querySelector('input')) {
                const skillName = b.innerText.split(' ')[0];
                const inputCheckbox = pHTML.input({ type: 'checkbox', checked: enabledSkilTrackers[skillName] || false });
                inputCheckbox.name = "skillSelector";
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
            if (v) skillsToDisplay.push(k);
        }

        const floatingSkillsDiv =
            document.getElementById('floatingWinSkillsContent') ||
            document.createElement("div");

        floatingSkillsDiv.id = 'floatingWinSkillsContent';
        floatingSkillsDiv.style =
            'display:block; position:absolute; left:100px; top:20px;';
        floatingSkillsDiv.innerHTML = "";

        if (skillsToDisplay.length) {
            if (document.getElementById('winSkills').style.display === 'none') {
                GUI('winSkills', 'Show');
            }

            const container = document.getElementById("winSkillsContent");
            document.getElementById('winGame').appendChild(floatingSkillsDiv);

            for (let b of Array.from(container.querySelectorAll('div'))) {
                if (b.classList.contains('barSkill')) {
                    const skillName = b.innerText.split(' ')[0];
                    if (!b.querySelector('input')) {
                        const inputCheckbox = document.createElement("input");
                        inputCheckbox.type = 'checkbox';
                        inputCheckbox.name = 'skillSelector';
                        inputCheckbox.checked = enabledSkilTrackers[skillName] || false;
                        inputCheckbox.addEventListener('input', chkBoxClick(skillName));
                        b.appendChild(inputCheckbox);
                    }

                    if (skillsToDisplay.includes(skillName)) {
                        let skillNameContainer = pHTML.div({ innerHTML: b.innerHTML, style: { width: '190px', display: "inline-block", textAlign: 'right' } });
                        const bar = b.nextSibling.cloneNode(true);
                        bar.style = b.nextElementSibling.style;
                        recAssign(bar.style, { width: '400px', position: 'relative', top: "-18px", left: "24px", display: 'inline-block' });
                        const skillInfo = pHTML.div({ className: b.className, style: { ...b.style, position: "relative", width: '600px' } }, skillNameContainer, bar);
                        const cb = skillNameContainer.querySelector("input");
                        cb.checked = true;
                        cb.addEventListener('input', chkBoxClick(skillName));

                        floatingSkillsDiv.appendChild(skillInfo);

                    }
                }
            }
        }
    }, 1200);
})();