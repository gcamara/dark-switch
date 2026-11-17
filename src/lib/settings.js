// Persistence. Site records live in storage.local (one key per site, so the content script reads one
// key before first paint); the global palette lives in storage.sync so it follows the user's profile.
(function (root) {
  "use strict";

  const DEFAULT_SITE = Object.freeze({
    enabled: false,
    mode: "palette",
    overrideDark: false,
    hidden: Object.freeze([]),
    palette: null,
  });
  const MODES = ["palette", "invert"];

  /** Fills defaults and drops junk. Example: normalizeSite(undefined).mode -> "palette" */
  function normalizeSite(raw) {
    const site = raw && typeof raw === "object" ? raw : {};
    return {
      enabled: site.enabled === true,
      mode: MODES.includes(site.mode) ? site.mode : "palette",
      overrideDark: site.overrideDark === true,
      hidden: Array.isArray(site.hidden) ? site.hidden.filter((s) => typeof s === "string" && s) : [],
      palette: site.palette ? root.DarkSwitch.pickValidColors(site.palette) : null,
    };
  }

  /** A record that holds no decision is deleted rather than stored. */
  function isEmptySite(site) {
    return !site.enabled && site.hidden.length === 0 && !site.palette && site.mode === "palette";
  }

  /** Example: addHidden(site, ".ad").hidden -> [..., ".ad"] (no duplicates) */
  function addHidden(site, selector) {
    const trimmed = selector.trim();
    if (!trimmed || site.hidden.includes(trimmed)) return site;
    return { ...site, hidden: [...site.hidden, trimmed] };
  }

  function removeHidden(site, selector) {
    return { ...site, hidden: site.hidden.filter((s) => s !== selector) };
  }

  async function getSite(areas, host) {
    const key = root.DarkSwitch.siteKey(host);
    const stored = await areas.local.get(key);
    return normalizeSite(stored[key]);
  }

  /** Read-modify-write of one site. patch receives the current record and returns the next one. */
  async function updateSite(areas, host, patch) {
    const key = root.DarkSwitch.siteKey(host);
    const next = normalizeSite(patch(await getSite(areas, host)));
    if (isEmptySite(next)) await areas.local.remove(key);
    else await areas.local.set({ [key]: next });
    return next;
  }

  async function getGlobalPalette(areas) {
    const stored = await areas.sync.get("palette");
    return root.DarkSwitch.pickValidColors(stored.palette);
  }

  async function saveGlobalPalette(areas, palette) {
    const clean = root.DarkSwitch.pickValidColors(palette);
    await areas.sync.set({ palette: clean });
    return clean;
  }

  /** Every stored site, sorted by host. Example: [{host:"github.com", enabled:true, ...}] */
  async function listSites(areas) {
    const all = await areas.local.get(null);
    return Object.entries(all)
      .filter(([key]) => key.startsWith("site:"))
      .map(([key, value]) => ({ host: key.slice(5), ...normalizeSite(value) }))
      .sort((a, b) => a.host.localeCompare(b.host));
  }

  /**
   * areas = { local, sync }, each shaped like chrome.storage.local (promise get/set/remove).
   * Example: createSettingsStore({local: chrome.storage.local, sync: chrome.storage.sync}).getSite("github.com")
   */
  function createSettingsStore(areas) {
    return {
      getSite: (host) => getSite(areas, host),
      updateSite: (host, patch) => updateSite(areas, host, patch),
      removeSite: (host) => areas.local.remove(root.DarkSwitch.siteKey(host)),
      listSites: () => listSites(areas),
      getGlobalPalette: () => getGlobalPalette(areas),
      saveGlobalPalette: (palette) => saveGlobalPalette(areas, palette),
    };
  }

  root.DarkSwitch = Object.assign(root.DarkSwitch || {}, {
    DEFAULT_SITE,
    normalizeSite,
    isEmptySite,
    addHidden,
    removeHidden,
    createSettingsStore,
  });
})(globalThis);
