(() => {
  const idPrefix = "loocie-items-";
  const iframeUrl = "https://loociez.github.io/MOC-IV/itemslast.html";

  // Create the button container
  const container = document.createElement("div");
  container.id = idPrefix + "container";
  container.style.position = "fixed";
  container.style.top = "10px";
  container.style.left = "10px";
  container.style.zIndex = "99999";
  container.style.userSelect = "none";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  document.body.appendChild(container);

  // Create the toggle button
  const toggleButton = document.createElement("button");
  toggleButton.innerText = "📦 Items";
  toggleButton.style.margin = "2px";
  toggleButton.style.padding = "6px 8px";
  toggleButton.style.border = "1px solid #333";
  toggleButton.style.background = "#111";
  toggleButton.style.color = "#fff";
  toggleButton.style.cursor = "pointer";
  toggleButton.style.borderRadius = "6px";
  toggleButton.style.fontSize = "13px";
  toggleButton.title = "Toggle Items Overlay";
  container.appendChild(toggleButton);

  // Create the iframe overlay (initially hidden)
  const iframeOverlay = document.createElement("iframe");
  iframeOverlay.src = iframeUrl;
  iframeOverlay.style.position = "fixed";
  iframeOverlay.style.top = "50%";
  iframeOverlay.style.left = "50%";
  iframeOverlay.style.transform = "translate(-50%, -50%)";
  iframeOverlay.style.width = "700px";
  iframeOverlay.style.height = "600px";
  iframeOverlay.style.zIndex = "99998";
  iframeOverlay.style.border = "2px solid #555";
  iframeOverlay.style.borderRadius = "8px";
  iframeOverlay.style.display = "none";
  iframeOverlay.style.background = "#000";
  document.body.appendChild(iframeOverlay);

  // Toggle visibility on click
  let isVisible = false;
  toggleButton.addEventListener("click", () => {
    isVisible = !isVisible;
    iframeOverlay.style.display = isVisible ? "block" : "none";
  });

  // Make the container draggable
  makeDraggable(container);

  function makeDraggable(el) {
    let isDragging = false;
    let offsetX, offsetY;
    el.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    });
    function onMouseMove(e) {
      if (!isDragging) return;
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    }
    function onMouseUp() {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
  }
})();
