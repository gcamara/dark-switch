// Popup entry: finds the tab's site, wires the switch, mode and dark-site confirmation.
(function (root) {
  "use strict";

  const P = root.DarkSwitchPopup;
  const { ctx, $ } = P;

  function renderHeader() {
    $("enabled").checked = ctx.site.enabled;
    for (const radio of document.querySelectorAll('input[name="mode"]')) radio.checked = radio.value === ctx.site.mode;
  }

  function showUnavailable(message) {
    $("unavailable").textContent = message;
    $("unavailable").hidden = false;
    $("controls").hidden = true;
    $("enabled").disabled = true;
  }

  function showDarkConfirm(visible) {
    $("dark-confirm").hidden = !visible;
  }

  async function onToggle(event) {
    const enable = (s) => ({ ...s, enabled: true });
    if (!event.target.checked) return P.setSite((s) => ({ ...s, enabled: false }));
    if (ctx.site.overrideDark) return P.setSite(enable);
    const answer = await P.sendToTab({ type: "detect" }).catch(() => ({ dark: false }));
    if (!answer?.dark) return P.setSite(enable);
    event.target.checked = false;
    showDarkConfirm(true);
  }

  function onOverride() {
    showDarkConfirm(false);
    return P.setSite((s) => ({ ...s, enabled: true, overrideDark: true }));
  }

  function wireEvents() {
    $("enabled").addEventListener("change", onToggle);
    $("override").addEventListener("click", onOverride);
    $("keep-site").addEventListener("click", () => showDarkConfirm(false));
    document.querySelector(".segmented").addEventListener("change", (e) => P.setSite((s) => ({ ...s, mode: e.target.value })));
    P.wireColors();
    P.wireLists();
    P.onRender(renderHeader);
  }

  async function contentReachable() {
    try {
      return Boolean(await P.sendToTab({ type: "ping" }));
    } catch {
      return false;
    }
  }

  async function init() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    Object.assign(ctx, { tabId: tab?.id ?? null, host: P.hostOfUrl(tab?.url || "") });
    $("host").textContent = ctx.host || "This page";
    wireEvents();
    if (!ctx.host || !(await contentReachable())) {
      // Tabs opened before install have no content script until they reload.
      showUnavailable(ctx.host ? "Reload this tab to use DarkSwitch here." : "DarkSwitch can't run on browser pages.");
      return P.renderSites(ctx);
    }
    [ctx.site, ctx.palette] = await Promise.all([P.store.getSite(ctx.host), P.store.getGlobalPalette()]);
    P.render();
  }

  init();
})(globalThis);
