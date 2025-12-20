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
                    } else if (args[i] instanceof Node) {
                        obj.appendChild(args[i]);
                    } else {
                        // Fix for appending strings safely
                        obj.appendChild(document.createTextNode(String(args[i])));
                    }
                };
                return obj;
            }
        }
    };
    let o = {};
    pHTML = new Proxy(o, handler);

    /* --- THEMES DEFINITION --- */
    const themes = {
        blue: {
            barGradient: 'linear-gradient(90deg, #3399FF, #0066CC)',
            barBg: 'rgba(51, 153, 255, 0.18)',
            barBorder: 'rgba(51, 153, 255, 0.35)'
        },
        red: {
            barGradient: 'linear-gradient(90deg, #FF4C4C, #CC0000)',
            barBg: 'rgba(255, 76, 76, 0.18)',
            barBorder: 'rgba(204, 0, 0, 0.35)'
        },
        green: {
            barGradient: 'linear-gradient(90deg, #33CC33, #009900)',
            barBg: 'rgba(51, 204, 51, 0.18)',
            barBorder: 'rgba(0, 153, 0, 0.35)'
        }
    };

    // Load saved theme or default to blue
    let currentTheme = localStorage.getItem('skillTrackerTheme') || 'blue';

    function applyTheme(themeName) {
        const theme = themes[themeName] || themes.blue;

        let styleEl = document.getElementById('custom-skillbar-blue-fill');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'custom-skillbar-blue-fill';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = `
      /* Bar fill */
      #winSkillsContent .barValue,
      #floatingWinSkillsContent .barValue {
        background: ${theme.barGradient};
        border-radius: 6px;
      }

      /* Bar background */
      #winSkillsContent .barSkill,
      #floatingWinSkillsContent .barSkill {
        background: ${theme.barBg};
        border: 1px solid ${theme.barBorder};
        border-radius: 3px;
        padding: 2px 3px;
        margin: 2px 0;
        font-weight: 500;
      }

      /* Checkbox spacing */
      #winSkillsContent .barSkill input,
      #floatingWinSkillsContent .barSkill input {
        margin-left: 3px;
      }

      #floatingWinSkillsContent {
        position: absolute;
        z-index: 9999;
        user-select: none;
        cursor: move;
      }

      .skill-gain-flash {
        animation: skillFlash 0.35s ease-out;
      }

      @keyframes skillFlash {
        from { filter: brightness(1.7); }
        to { filter: brightness(1); }
      }

      /* Controls container styling */
      .overlay-controls {
        display: flex;
        gap: 8px;
        padding: 6px 10px 8px 10px;
        background: rgba(0,0,0,0.4);
        border-radius: 5px;
        color: white;
        font-size: 13px;
        user-select: none;
        margin-bottom: 4px;
      }
      .overlay-button {
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 3px;
        background: rgba(255,255,255,0.15);
        transition: background 0.2s;
      }
      .overlay-button:hover {
        background: rgba(255,255,255,0.3);
      }
      .theme-popup {
        position: absolute;
        background: rgba(0,0,0,0.8);
        border-radius: 6px;
        padding: 6px 10px;
        margin-top: 4px;
        color: white;
        font-size: 13px;
        user-select: none;
        box-shadow: 0 0 8px rgba(0,0,0,0.8);
        z-index: 10000;
      }
      .theme-option {
        cursor: pointer;
        margin: 4px 0;
        padding: 4px 8px;
        border-radius: 3px;
        transition: background 0.2s;
      }
      .theme-option:hover {
        background: rgba(255,255,255,0.15);
      }
      .theme-option.selected {
        background: rgba(255,255,255,0.3);
        font-weight: bold;
      }
      `;
    }
    applyTheme(currentTheme);

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

    // --- DRAG LOGIC ---
    let dragging = false;
    let offsetX = 0, offsetY = 0;

    function enableDrag(el) {
        el.addEventListener('mousedown', (e) => {
            dragging = true;
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
        });
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            el.style.left = (e.clientX - offsetX) + 'px';
            el.style.top = (e.clientY - offsetY) + 'px';
        });
        document.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            window.localStorage.setItem('floatingSkillPos', JSON.stringify({
                left: floatingSkillsDiv.style.left,
                top: floatingSkillsDiv.style.top
            }));
        });
    }

    // --- FLASH & THEME STATE ---
    let flashEnabled = localStorage.getItem('skillFlashEnabled');
    if (flashEnabled === null) flashEnabled = true;
    else flashEnabled = flashEnabled === 'true';

    let themePopupOpen = false;

    if (window.totalEnhancerSkillTrackingTimer) {
        clearInterval(window.totalEnhancerSkillTrackingTimer);
    }

    const lastWidths = {};

    window.totalEnhancerSkillTrackingTimer = setInterval(() => {
        const skillsToDisplay = ['Non-Existing-Skill'];
        for (let [k, v] of Object.entries(enabledSkilTrackers)) {
            if (v) skillsToDisplay.push(k);
        }

        let floatingSkillsDiv =
            document.getElementById('floatingWinSkillsContent') ||
            document.createElement("div");

        floatingSkillsDiv.id = 'floatingWinSkillsContent';

        // Load saved position or default
        const savedPos = JSON.parse(window.localStorage.getItem('floatingSkillPos') || '{}');
        if (savedPos.left) floatingSkillsDiv.style.left = savedPos.left;
        else floatingSkillsDiv.style.left = '100px';
        if (savedPos.top) floatingSkillsDiv.style.top = savedPos.top;
        else floatingSkillsDiv.style.top = '20px';

        floatingSkillsDiv.style.position = 'absolute';
        floatingSkillsDiv.style.display = 'block';

        floatingSkillsDiv.innerHTML = "";

        if (skillsToDisplay.length) {
            if (document.getElementById('winSkills').style.display === 'none') {
                GUI('winSkills', 'Show');
            }

            const container = document.getElementById("winSkillsContent");
            document.getElementById('winGame').appendChild(floatingSkillsDiv);

            // Controls container (flash toggle + cog)
            const controls = pHTML.div({ className: 'overlay-controls' });

            // Flash toggle button
            const flashBtn = pHTML.div({
                className: 'overlay-button',
                title: 'Toggle XP flash animation'
            }, flashEnabled ? 'Flash: ON' : 'Flash: OFF');
            flashBtn.onclick = () => {
                flashEnabled = !flashEnabled;
                localStorage.setItem('skillFlashEnabled', flashEnabled);
                flashBtn.textContent = flashEnabled ? 'Flash: ON' : 'Flash: OFF';
            };
            controls.appendChild(flashBtn);

            // Cog button to toggle theme popup
            const cogBtn = pHTML.div({
                className: 'overlay-button',
                title: 'Open theme selector'
            }, '⚙️');
            controls.appendChild(cogBtn);

            floatingSkillsDiv.appendChild(controls);

            // Theme popup container (initially hidden)
            let themePopup = document.getElementById('skillTrackerThemePopup');
            if (!themePopup) {
                themePopup = pHTML.div({ id: 'skillTrackerThemePopup', className: 'theme-popup', style: { display: 'none' } });
                floatingSkillsDiv.appendChild(themePopup);
            }
            themePopup.style.display = themePopupOpen ? 'block' : 'none';

            cogBtn.onclick = () => {
                themePopupOpen = !themePopupOpen;
                themePopup.style.display = themePopupOpen ? 'block' : 'none';
                if (themePopupOpen) {
                    // Populate theme options
                    themePopup.innerHTML = '';
                    for (const themeName in themes) {
                        const opt = pHTML.div({
                            className: 'theme-option' + (themeName === currentTheme ? ' selected' : ''),
                            title: `Select ${themeName} theme`
                        }, themeName.charAt(0).toUpperCase() + themeName.slice(1));
                        opt.onclick = () => {
                            currentTheme = themeName;
                            localStorage.setItem('skillTrackerTheme', currentTheme);
                            applyTheme(currentTheme);
                            themePopupOpen = false;
                            themePopup.style.display = 'none';
                        };
                        themePopup.appendChild(opt);
                    }
                }
            };

            enableDrag(floatingSkillsDiv);

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

                        // Flash effect when width changes and flashEnabled is true
                        if (flashEnabled && bar.querySelector('.barValue')) {
                            const currentWidth = bar.querySelector('.barValue').style.width;
                            if (lastWidths[skillName] && lastWidths[skillName] !== currentWidth) {
                                bar.querySelector('.barValue').classList.add('skill-gain-flash');
                                setTimeout(() => {
                                    bar.querySelector('.barValue').classList.remove('skill-gain-flash');
                                }, 400);
                            }
                            lastWidths[skillName] = currentWidth;
                        } else if (bar.querySelector('.barValue')) {
                            bar.querySelector('.barValue').classList.remove('skill-gain-flash');
                        }

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
