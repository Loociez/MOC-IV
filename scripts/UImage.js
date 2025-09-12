// imageReplacer.js
(function () {
  // Define a mapping of original images to the new images
  const imageReplacementMap = [
    {
      match: img => img.src.includes('header.png'),
      newSrc: chrome.runtime.getURL('images/header.png')
    },
    {
      match: img => img.src.includes('stats1.png'),
      newSrc: chrome.runtime.getURL('images/stats1.png')
    },
    {
      match: img => img.src.includes('dungeons1.png'),
      newSrc: chrome.runtime.getURL('images/dungeons1.png')
    },
    {
      match: img => img.src.includes('guilds1.png'),
      newSrc: chrome.runtime.getURL('images/guilds1.png')
    },
    {
      match: img => img.src.includes('mobile1.png'),
      newSrc: chrome.runtime.getURL('images/mobile1.png')
    },
    {
      match: img => img.src.includes('quit1.png'),
      newSrc: chrome.runtime.getURL('images/quit1.png')
    },
    {
      match: img => img.src.includes('settings1.png'),
      newSrc: chrome.runtime.getURL('images/settings1.png')
    },
    {
      match: img => img.src.includes('shop1.png'),
      newSrc: chrome.runtime.getURL('images/shop1.png')
    },
    {
      match: img => img.src.includes('trade1.png'),
      newSrc: chrome.runtime.getURL('images/trade1.png')
    },
    {
      match: img => img.src.includes('serpdrag.png'),
      newSrc: chrome.runtime.getURL('images/serpdrag.png')
    }
  ];

  function replaceImages() {
    document.querySelectorAll('img').forEach(img => {
      for (const rule of imageReplacementMap) {
        if (rule.match(img)) {
          if (img.dataset.replaced) return; // prevent infinite loop
          img.src = rule.newSrc;
          img.dataset.replaced = "true";
          break;
        }
      }
    });
  }

  // Run once when loaded
  replaceImages();

  // Run again whenever the DOM updates (handles dynamic UI changes)
  const observer = new MutationObserver(replaceImages);
  observer.observe(document.body, { childList: true, subtree: true });
})();
