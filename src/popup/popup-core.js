// Shared popup state and the one write path for the current site; renderers register themselves here.
(function (root) {
  "use strict";

  const DS = root.DarkSwitch;
  const store = DS.createSettingsStore({ local: chrome.storage.local, sync: chrome.storage.sync });
  const ctx = { tabId: null, host: "", site: DS.normalizeSite(null), palette: {} };
  const renderers = [];

  const $ = (id) => document.getElementById(id);

  function onRender(renderer) {
    renderers.push(renderer);
  }

  function render() {
    for (const renderer of renderers) renderer(ctx);
  }

  /** Example: setSite((s) => ({ ...s, enabled: true })) */
  async function setSite(patch) {
    ctx.site = await store.updateSite(ctx.host, patch);
    render();
  }

  function sendToTab(message) {
    return chrome.tabs.sendMessage(ctx.tabId, message, { frameId: 0 });
  }

  /** "" for chrome://, file:, the Web Store, etc. Example: hostOfUrl("https://www.x.com/a") -> "x.com" */
  function hostOfUrl(url) {
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) return "";
      return DS.normalizeHost(parsed.hostname);
    } catch {
      return "";
    }
  }

  function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  root.DarkSwitchPopup = { ctx, store, $, onRender, render, setSite, sendToTab, hostOfUrl, createElement };
})(globalThis);
