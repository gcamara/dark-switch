// Element picker: hover highlights, click hides (Shift+click keeps picking), Esc exits.
(function (root) {
  "use strict";

  const ACCENT = "#9d8cff";
  let activeStop = null;

  function styled(tag, styles) {
    const el = document.createElement(tag);
    for (const [prop, value] of Object.entries(styles)) el.style.setProperty(prop, value, "important");
    el.setAttribute("data-darkswitch", "");
    return el;
  }

  // Attached to <html>, not <body>, so the theme's `body *` rule never restyles them.
  function makeOverlay() {
    const box = styled("div", {
      position: "fixed", "z-index": "2147483647", "pointer-events": "none", display: "none",
      outline: `2px solid ${ACCENT}`, background: "rgba(157,140,255,0.15)", "border-radius": "4px",
      transition: "all 80ms cubic-bezier(0.2,0.8,0.2,1)",
    });
    const tip = styled("div", {
      position: "fixed", "z-index": "2147483647", "pointer-events": "none", bottom: "16px", left: "50%",
      transform: "translateX(-50%)", background: "#18171f", color: "#ecebf2", border: `1px solid ${ACCENT}`,
      padding: "8px 12px", "border-radius": "10px", font: "500 12px/1.5 system-ui, sans-serif",
    });
    tip.textContent = "Click to hide · Shift+click to hide more · Esc to exit";
    return { box, tip };
  }

  function outline(box, target) {
    const rect = target.getBoundingClientRect();
    const place = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    for (const [prop, px] of Object.entries(place)) box.style.setProperty(prop, `${px}px`, "important");
    box.style.setProperty("display", "block", "important");
  }

  function selectorFor(el) {
    const matchesOnly = (selector) => {
      try {
        const found = document.querySelectorAll(selector);
        return found.length === 1 && found[0] === el;
      } catch {
        return false;
      }
    };
    return root.DarkSwitch.buildSelector(el, { matchesOnly, escape: CSS.escape });
  }

  function isOwn(el) {
    return !el || el.hasAttribute?.("data-darkswitch") || el === document.documentElement;
  }

  /** Example: startPicker((selector) => store.updateSite(host, (s) => addHidden(s, selector))) */
  function startPicker(onPick) {
    if (activeStop) return;
    const { box, tip } = makeOverlay();
    document.documentElement.append(box, tip);
    let current = null;
    const swallow = (e) => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
    const handlers = {
      mousemove: (e) => { if (!isOwn(e.target)) { current = e.target; outline(box, current); } },
      mousedown: swallow,
      mouseup: swallow,
      click: (e) => { swallow(e); if (current) onPick(selectorFor(current)); if (!e.shiftKey) activeStop(); },
      keydown: (e) => { if (e.key === "Escape") { swallow(e); activeStop(); } },
    };
    for (const [type, fn] of Object.entries(handlers)) window.addEventListener(type, fn, true);
    activeStop = () => {
      for (const [type, fn] of Object.entries(handlers)) window.removeEventListener(type, fn, true);
      box.remove();
      tip.remove();
      activeStop = null;
    };
  }

  root.DarkSwitch = Object.assign(root.DarkSwitch || {}, { startPicker });
})(globalThis);
