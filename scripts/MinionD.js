(() => {
  const observer = new MutationObserver(() => {
    const popup = document.querySelector('#winPopup');
    const title = document.querySelector('#txtPopupTitle');
    if (
      popup &&
      popup.style.display !== 'none' &&
      title?.textContent.trim() === 'Minion'
    ) {
      const buttons = popup.querySelectorAll('button');
      const dismissBtn = Array.from(buttons).find(btn =>
        btn.textContent.trim().toLowerCase().includes('dismiss')
      );
      if (dismissBtn) {
        dismissBtn.click();
        console.log('[autoDismissMinion] Dismiss button clicked.');
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[autoDismissMinion] Watching for Minion popup...');
})();
