(function () {
  const imageReplacementMap = [
    { match: img => img.src.includes('header.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/header.png' },
    { match: img => img.src.includes('stats1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/stats1.png' },
    { match: img => img.src.includes('dungeons1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/dungeons1.png' },
    { match: img => img.src.includes('guilds1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/guilds1.png' },
    { match: img => img.src.includes('mobile1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/mobile1.png' },
    { match: img => img.src.includes('quit1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/quit1.png' },
    { match: img => img.src.includes('settings1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/settings1.png' },
    { match: img => img.src.includes('shop1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/shop1.png' },
    { match: img => img.src.includes('trade1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/trade1.png' },
    { match: img => /serpdrag\.png(\?.*)?$/.test(img.src), newSrc: 'https://loociez.github.io/MOC-IV/images/serpdrag.png' }
  ];

  function replaceImages() {
    document.querySelectorAll('img').forEach(img => {
      if (img.dataset.replaced) return;
      for (const rule of imageReplacementMap) {
        if (rule.match(img)) {
          img.src = rule.newSrc;
          img.dataset.replaced = "true";
          break;
        }
      }
    });
  }

  function replaceBackgrounds() {
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return;
      if (bg.includes('serpdrag.png')) {
        const newBg = bg.replace(/url\(['"]?[^'"]*serpdrag\.png['"]?\)/, `url('https://loociez.github.io/MOC-IV/images/serpdrag.png')`);
        el.style.backgroundImage = newBg;
      }
    });
  }

  // Initial run
  replaceImages();
  replaceBackgrounds();

  // Watch for DOM changes
  const observer = new MutationObserver(() => {
    replaceImages();
    replaceBackgrounds();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
