// Color section: edits the global palette, or the site's own palette when "this site only" is on.
(function (root) {
  "use strict";

  const DS = root.DarkSwitch;
  const P = root.DarkSwitchPopup;
  const LABELS = { bg: "Background", surface: "Surface", text: "Text", muted: "Muted", link: "Links", border: "Borders" };

  function buildColorInputs() {
    const grid = P.$("color-grid");
    for (const key of DS.PALETTE_KEYS) {
      const label = P.createElement("label", "swatch");
      const input = P.createElement("input");
      Object.assign(input, { type: "color", value: DS.DEFAULT_PALETTE[key] });
      input.dataset.key = key;
      label.append(input, P.createElement("span", "", LABELS[key]));
      grid.append(label);
    }
  }

  function renderColors(ctx) {
    const resolved = DS.resolvePalette(ctx.palette, ctx.site.palette);
    for (const input of P.$("color-grid").querySelectorAll("input")) input.value = resolved[input.dataset.key];
    P.$("site-only").checked = Boolean(ctx.site.palette);
  }

  async function saveGlobal(palette) {
    P.ctx.palette = await P.store.saveGlobalPalette(palette);
    P.render();
  }

  // "change" (not "input") fires once when the picker closes, which keeps storage.sync under its write quota.
  async function onColorChange(event) {
    const { key } = event.target.dataset;
    const value = event.target.value;
    if (P.ctx.site.palette) return P.setSite((s) => ({ ...s, palette: { ...s.palette, [key]: value } }));
    return saveGlobal({ ...P.ctx.palette, [key]: value });
  }

  function onSiteOnly(event) {
    const palette = event.target.checked ? DS.resolvePalette(P.ctx.palette, null) : null;
    return P.setSite((s) => ({ ...s, palette }));
  }

  function onReset() {
    if (P.ctx.site.palette) return P.setSite((s) => ({ ...s, palette: { ...DS.DEFAULT_PALETTE } }));
    return saveGlobal({});
  }

  function wireColors() {
    buildColorInputs();
    P.$("color-grid").addEventListener("change", onColorChange);
    P.$("site-only").addEventListener("change", onSiteOnly);
    P.$("reset-colors").addEventListener("click", onReset);
    P.onRender(renderColors);
  }

  root.DarkSwitchPopup.wireColors = wireColors;
})(globalThis);
