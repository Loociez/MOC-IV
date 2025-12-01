// ==UserScript==
// @name         Mirage Online TotalEnhance Loader
// @namespace    https://loociez.github.io/MOC-IV/
// @version      1.0
// @description  Automatically loads TotalEnhance mod script on play.consty.com
// @author       YourName
// @match        https://play.consty.com/*
// @grant        none
// ==/UserScript==

(function() {
    function loadScript(url, callback) {
        if (document.querySelector(`script[src="${url}"]`)) {
            if(callback) callback();
            return;
        }
        const s = document.createElement('script');
        s.src = url;
        s.onload = callback;
        s.onerror = () => console.error(`Failed to load script: ${url}`);
        document.head.appendChild(s);
    }

    // Wait until the game environment is ready before injecting mod script
    function waitForGameReady() {
        // You may need to adjust this condition depending on the game internals
        // Here is a simple placeholder that waits for a global variable "game" or similar
        if (window.game && window.game.isLoggedIn) {
            loadScript('https://loociez.github.io/MOC-IV/scripts/TotalEnhance.js');
        } else {
            setTimeout(waitForGameReady, 1000);
        }
    }

    waitForGameReady();
})();
