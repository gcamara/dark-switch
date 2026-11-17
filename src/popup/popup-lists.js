// Hidden-element list for the current site, and the list of every site with a stored decision.
(function (root) {
  "use strict";

  const DS = root.DarkSwitch;
  const P = root.DarkSwitchPopup;

  function listRow(labelText, metaText, onRemove, removeLabel) {
    const li = P.createElement("li");
    const label = P.createElement("span", "label", labelText);
    label.title = labelText;
    const remove = P.createElement("button", "remove", "×");
    Object.assign(remove, { type: "button", title: removeLabel });
    remove.setAttribute("aria-label", removeLabel);
    remove.addEventListener("click", onRemove);
    li.append(label);
    if (metaText) li.append(P.createElement("span", "meta", metaText));
    li.append(remove);
    return li;
  }

  function renderHidden(ctx) {
    const list = P.$("hidden-list");
    list.replaceChildren();
    if (ctx.site.hidden.length === 0) list.append(P.createElement("li", "empty", "Nothing hidden on this site."));
    for (const selector of ctx.site.hidden) {
      const remove = () => P.setSite((s) => DS.removeHidden(s, selector));
      list.append(listRow(selector, "", remove, `Show ${selector} again`));
    }
  }

  function siteMeta(site) {
    const parts = [];
    if (site.enabled) parts.push(site.mode === "invert" ? "invert" : "dark");
    if (site.hidden.length) parts.push(`${site.hidden.length} hidden`);
    return parts.join(" · ");
  }

  async function forgetSite(host) {
    await P.store.removeSite(host);
    if (host === P.ctx.host) P.ctx.site = DS.normalizeSite(null);
    P.render();
  }

  async function renderSites(ctx) {
    const sites = await P.store.listSites();
    const list = P.$("site-list");
    list.replaceChildren();
    if (sites.length === 0) list.append(P.createElement("li", "empty", "No sites yet. Turn the switch on to add one."));
    for (const site of sites) {
      const row = listRow(site.host, siteMeta(site), () => forgetSite(site.host), `Forget ${site.host}`);
      if (site.host === ctx.host) row.classList.add("current");
      list.append(row);
    }
  }

  // Parsing in the popup's own document catches syntax errors before they reach the page.
  function selectorError(selector) {
    if (/[{}]/.test(selector)) return `"${selector}" can't contain { or }.`;
    try {
      document.querySelector(selector);
      return "";
    } catch {
      return `"${selector}" isn't a valid CSS selector.`;
    }
  }

  async function onAddHidden(event) {
    event.preventDefault();
    const input = P.$("hidden-input");
    const error = selectorError(input.value.trim());
    P.$("hidden-error").textContent = error;
    P.$("hidden-error").hidden = !error;
    if (error || !input.value.trim()) return;
    await P.setSite((s) => DS.addHidden(s, input.value));
    input.value = "";
  }

  async function onPick() {
    await P.sendToTab({ type: "pick" });
    window.close();
  }

  function wireLists() {
    P.$("add-hidden").addEventListener("submit", onAddHidden);
    P.$("pick").addEventListener("click", onPick);
    P.onRender(renderHidden);
    P.onRender(renderSites);
  }

  Object.assign(root.DarkSwitchPopup, { wireLists, renderSites });
})(globalThis);
