// Runs at document_start in every frame: reads this site's record and injects CSS before first paint.
(function () {
  "use strict";

  const DS = globalThis.DarkSwitch;
  const hostname = DS.topHostname(location);
  if (!hostname) return;
  const host = DS.normalizeHost(hostname);
  const key = DS.siteKey(host);
  const store = DS.createSettingsStore({ local: chrome.storage.local, sync: chrome.storage.sync });
  const themeStyle = createStyle("darkswitch-theme");
  const hiddenStyle = createStyle("darkswitch-hidden");

  function createStyle(id) {
    const style = document.createElement("style");
    style.id = id;
    // <head> doesn't exist yet at document_start; <html> does.
    document.documentElement.append(style);
    return style;
  }

  function isValidSelector(selector) {
    return !/[{}]/.test(selector) && CSS.supports(`selector(${selector})`);
  }

  async function refresh() {
    const [site, palette] = await Promise.all([store.getSite(host), store.getGlobalPalette()]);
    themeStyle.textContent = DS.buildThemeCss(site, palette);
    hiddenStyle.textContent = DS.buildHiddenCss(site.hidden, isValidSelector);
  }

  // Equal-specificity !important rules resolve by order, so ours must come after the page's sheets.
  function moveStylesLast() {
    document.documentElement.append(themeStyle, hiddenStyle);
  }

  function onStorageChanged(changes, area) {
    if ((area === "local" && key in changes) || (area === "sync" && "palette" in changes)) refresh();
  }

  async function toggleFromShortcut() {
    const site = await store.getSite(host);
    if (site.enabled) return store.updateSite(host, (s) => ({ ...s, enabled: false }));
    const asksConfirm = !site.overrideDark && DS.detectPageDark(document, window);
    if (asksConfirm && !window.confirm("This site already looks dark. Apply your DarkSwitch theme anyway?")) return;
    return store.updateSite(host, (s) => ({ ...s, enabled: true, overrideDark: s.overrideDark || asksConfirm }));
  }

  function onMessage(message, _sender, reply) {
    if (message.type === "ping") reply({ ok: true, host });
    if (message.type === "detect") reply({ dark: DS.detectPageDark(document, window) });
    if (message.type === "toggle") toggleFromShortcut();
    if (message.type === "pick") DS.startPicker((sel) => store.updateSite(host, (s) => DS.addHidden(s, sel)));
  }

  refresh();
  chrome.storage.onChanged.addListener(onStorageChanged);
  document.addEventListener("DOMContentLoaded", moveStylesLast, { once: true });
  if (window === window.top) chrome.runtime.onMessage.addListener(onMessage);
})();
