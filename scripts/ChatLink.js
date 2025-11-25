(async function() {
  'use strict';

  // Load items JSON data
  const response = await fetch("https://loociez.github.io/MOC-IV/last.json");
  const itemsData = await response.json();

  // Elements
  const inventory = document.getElementById("winInventory");
  const chatInput = document.getElementById("txtChatMessage");
  const chatBox = document.getElementById("winGameChatbox");
  const txtInvDesc = document.getElementById("txtInvDesc");

  if (!inventory || !chatInput || !chatBox || !txtInvDesc) {
    console.warn("Required elements missing: #winInventory, #txtChatMessage, #winGameChatbox, #txtInvDesc");
    return;
  }

  // Insert text at cursor helper
  function insertTextAtCursor(el, text) {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const val = el.value;
      el.value = val.slice(0, start) + text + val.slice(end);
      el.selectionStart = el.selectionEnd = start + text.length;
    } else if (el.isContentEditable) {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.value = (el.value || "") + text;
    }
    el.focus();
  }

  // Get hovered item name from #txtInvDesc - now grab the FIRST <p><span> text, regardless of color
  function getNameFromInvDesc() {
    if (txtInvDesc.style.visibility !== "visible") return null;
    const firstP = txtInvDesc.querySelector("p");
    if (!firstP) return null;
    const span = firstP.querySelector("span");
    if (!span) return null;
    return span.textContent.trim();
  }

  // Inventory canvas handling: shift + left click inserts item name tag into chat input
  const canvases = inventory.querySelectorAll("canvas");
  let currentHoveredName = null;

  canvases.forEach(canvas => {
    canvas.style.cursor = "pointer";

    // Update hovered name continuously while moving mouse over the canvas
    canvas.addEventListener("mousemove", () => {
      currentHoveredName = getNameFromInvDesc();
    });

    canvas.addEventListener("mouseleave", () => {
      currentHoveredName = null;
    });

    canvas.addEventListener("click", (e) => {
      if (!e.shiftKey || e.button !== 0) return; // Shift + Left Click only
      if (!currentHoveredName) {
        console.warn("No hovered item name detected!");
        return;
      }
      const insertion = `[item=${currentHoveredName}]`;
      insertTextAtCursor(chatInput, insertion);
      e.preventDefault();
    });
  });

  // Find item data by name (case-insensitive)
  function findItemByName(name) {
    return itemsData.find(item => item.name.toLowerCase() === name.toLowerCase());
  }

  // Format item details nicely for tooltip (excluding specified keys, skip falsy/0 stats)
  function formatItemDetails(item) {
    if (!item) return "<em>Item not found</em>";

    let html = `<div style="font-weight:bold; font-size:16px; margin-bottom:4px; color:#00ff00;">${item.name}</div>`;

    if (item.desc && item.desc.trim()) {
      html += `<div style="font-style: italic; margin-bottom:6px; color:#bfbfbf;">${item.desc}</div>`;
    }

    html += "<div style='margin-bottom:6px;'>";
    if (item.uses) html += `<div>Uses: ${item.uses}</div>`;
    if (item.limit) html += `<div>Limit: ${item.limit}</div>`;
    if (item.cooldown_delay) html += `<div>Cooldown: ${item.cooldown_delay} ms</div>`;
    if (item.repair_cost) html += `<div>Repair Cost: ${item.repair_cost}</div>`;
    if (item.break_chance) html += `<div>Break Chance: ${item.break_chance}%</div>`;
    if (item.recycle_value) html += `<div>Recycle Value: ${item.recycle_value}</div>`;
    if (item.level_req) html += `<div>Level Requirement: ${item.level_req}</div>`;
    if (item.death_drop !== undefined) html += `<div>Drop on Death: ${item.death_drop ? "Yes" : "No"}</div>`;
    if (item.transferable !== undefined) html += `<div>Transferable: ${item.transferable ? "Yes" : "No"}</div>`;
    html += "</div>";

    if (item.data) {
      html += "<div style='font-weight:bold; margin-bottom:4px;'>Stats:</div><ul style='margin-top:0; padding-left:16px;'>";
      const excludedKeys = new Set(["sprite_rotation", "scale", "sprite_color", "damage_stat", "hue", "move", "spin", "sprite", "alpha"]);
      for (const [key, value] of Object.entries(item.data)) {
        if (excludedKeys.has(key)) continue;
        if (!value && value !== 0) continue; // Skip null/undefined/false but allow 0 (will skip below)
        if (value === 0) continue; // explicitly skip zeros
        const valStr = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
        const keyPretty = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        html += `<li>${keyPretty}: ${valStr}</li>`;
      }
      html += "</ul>";
    }

    return html;
  }

  // Tooltip container
  const tooltip = document.createElement("div");
  Object.assign(tooltip.style, {
    position: "fixed",
    background: "rgba(0, 0, 0, 0.85)",
    color: "#0f0",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #0f0",
    maxWidth: "300px",
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
    zIndex: "9999999",
    pointerEvents: "auto",
    whiteSpace: "normal",
    display: "none",
    boxShadow: "0 0 10px #0f0",
    userSelect: "none",
  });
  document.body.appendChild(tooltip);

  // Show tooltip near mouse, prefer above cursor with extra margin to avoid clipping bottom
  function showTooltipAtPosition(html, x, y) {
    tooltip.innerHTML = html;

    const padding = 10;
    const extraUpMargin = 120; // more offset upward
    const tooltipWidth = 300; // maxWidth
    const tooltipHeight = tooltip.offsetHeight || 150;

    let left = x + padding;

    // Adjust horizontal position if overflowing right edge
    if (left + tooltipWidth > window.innerWidth) {
      left = x - tooltipWidth - padding;
    }

    // Prefer tooltip above cursor with extra upward margin
    let top = y - tooltipHeight - padding - extraUpMargin;

    // If above is off-screen, place below cursor
    if (top < 0) {
      top = y + padding;
    }

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
    tooltip.style.display = "block";
  }

  // Hide tooltip
  function hideTooltip() {
    tooltip.style.display = "none";
  }

  // Parse chat messages to replace [item=Name] text nodes with clickable spans
  function parseChatItems() {
    const itemRegex = /\[item=([^\]]+)\]/gi;

    // Select all <li><span> inside chatBox
    const spans = [...chatBox.querySelectorAll("li > span")];

    spans.forEach(span => {
      if (span.dataset.processed) return;

      const text = span.textContent;
      let lastIndex = 0;
      const fragment = document.createDocumentFragment();

      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        // Append text before match
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        // Create clickable span for item name
        const itemName = match[1];
        const link = document.createElement("span");
        link.className = "chat-item-link";
        link.style.color = "#0f0";
        link.style.textDecoration = "underline";
        link.style.cursor = "pointer";
        link.dataset.itemName = itemName;
        link.textContent = itemName;

        fragment.appendChild(link);

        lastIndex = match.index + match[0].length;
      }

      // Append remaining text after last match
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      // Replace span content if matches found
      if (fragment.childNodes.length > 0) {
        span.textContent = ""; // Clear old text
        span.appendChild(fragment);
        span.dataset.processed = "true";
      }
    });
  }

  // Run parsing every second for new chat messages
  setInterval(parseChatItems, 1000);

  // Tooltip show/hide on chat item link clicks
  chatBox.addEventListener("click", e => {
    const target = e.target;
    if (target.classList.contains("chat-item-link")) {
      const itemName = target.dataset.itemName;
      if (!itemName) return;

      const item = findItemByName(itemName);
      const html = formatItemDetails(item);

      showTooltipAtPosition(html, e.clientX, e.clientY);
      e.stopPropagation();
    } else {
      hideTooltip();
    }
  });

  // Hide tooltip when clicking outside
  document.body.addEventListener("click", e => {
    if (!tooltip.contains(e.target)) {
      hideTooltip();
    }
  });

})();
