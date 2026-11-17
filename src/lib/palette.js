// Turns a palette (or invert mode, or a hidden-selector list) into the CSS injected into the page.
(function (root) {
  "use strict";

  const DEFAULT_PALETTE = Object.freeze({
    bg: "#121117",
    surface: "#1e1d27",
    text: "#ecebf2",
    muted: "#a3a1b2",
    link: "#9d8cff",
    border: "#33313f",
  });
  const PALETTE_KEYS = Object.freeze(Object.keys(DEFAULT_PALETTE));
  const MEDIA = "img,video,canvas,svg,svg *,iframe,embed,object,source";

  function isHexColor(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  /** Keeps only known keys holding #rrggbb values. Example: pickValidColors({bg:"#000000",x:1}) -> {bg:"#000000"} */
  function pickValidColors(palette) {
    const out = {};
    if (!palette || typeof palette !== "object") return out;
    for (const key of PALETTE_KEYS) {
      if (isHexColor(palette[key])) out[key] = palette[key];
    }
    return out;
  }

  /** Default < global < site. Example: resolvePalette({text:"#ffffff"}, null).text -> "#ffffff" */
  function resolvePalette(globalPalette, sitePalette) {
    return { ...DEFAULT_PALETTE, ...pickValidColors(globalPalette), ...pickValidColors(sitePalette) };
  }

  function paletteVars(palette) {
    return PALETTE_KEYS.map((key) => `--ds-${key}:${palette[key]};`).join("");
  }

  /**
   * Override-based theme. Every non-media element gets the page background so overlays stay opaque;
   * the :is() rules carry one class-level of specificity more, so they win over the blanket rule.
   * Example: buildPaletteCss(DEFAULT_PALETTE).includes("--ds-bg:#121117") -> true
   */
  function buildPaletteCss(palette) {
    return [
      `:root{${paletteVars(palette)}color-scheme:dark!important}`,
      "html,body{background-color:var(--ds-bg)!important;color:var(--ds-text)!important}",
      `body *:not(${MEDIA}){background-color:var(--ds-bg)!important;color:var(--ds-text)!important;border-color:var(--ds-border)!important}`,
      "body :is(input,textarea,select,button,pre,code,kbd,th,dialog,[role=dialog],[role=menu],[role=listbox],[role=tooltip]){background-color:var(--ds-surface)!important}",
      "body :is(a,a *){color:var(--ds-link)!important}",
      "body :is(small,figcaption,time,caption){color:var(--ds-muted)!important}",
      "::placeholder{color:var(--ds-muted)!important}",
      "::selection{background-color:var(--ds-link)!important;color:var(--ds-bg)!important}",
    ].join("\n");
  }

  /** Fallback for sites the overrides break: invert everything, then flip media back. */
  function buildInvertCss() {
    return [
      "html{filter:invert(1) hue-rotate(180deg)!important;background-color:#fff!important}",
      ':is(img,video,canvas,iframe,embed,object,[style*="background-image"]){filter:invert(1) hue-rotate(180deg)!important}',
    ].join("\n");
  }

  /** One rule per selector so a single bad selector can't void the others. */
  function buildHiddenCss(selectors, isValidSelector) {
    return selectors
      .filter((selector) => isValidSelector(selector))
      .map((selector) => `${selector}{display:none!important}`)
      .join("\n");
  }

  /** Theme CSS for a site record, or "" when the theme is off. */
  function buildThemeCss(site, globalPalette) {
    if (!site.enabled) return "";
    if (site.mode === "invert") return buildInvertCss();
    return buildPaletteCss(resolvePalette(globalPalette, site.palette));
  }

  root.DarkSwitch = Object.assign(root.DarkSwitch || {}, {
    DEFAULT_PALETTE,
    PALETTE_KEYS,
    isHexColor,
    pickValidColors,
    resolvePalette,
    buildPaletteCss,
    buildInvertCss,
    buildHiddenCss,
    buildThemeCss,
  });
})(globalThis);
