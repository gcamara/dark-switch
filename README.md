# DarkSwitch

A Chrome extension that puts a dark theme on the sites you pick, and only on those.

- Turn it on from the toolbar popup or with `Alt+Shift+D`. Each site's choice is saved and applied
  as the page loads, so there's no white flash.
- If a site already has a dark theme, it asks before replacing it.
- Two modes: **Palette** recolors the page with your own colors, and **Invert** is for sites that
  Palette doesn't handle well.
- Six colors you can change (background, surface, text, muted text, links, borders). Set them once
  for every site, or give one site its own.
- Hide elements by clicking them on the page, or by typing a CSS selector. Each site remembers its
  hidden elements.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Reload any tabs that were open before installing.

## Development

There's no build step. The extension is plain Manifest V3 JavaScript.

```bash
npm test                  # unit tests (node --test)
node dev/make-icons.js    # redraw the icons in icons/
npm run dev               # serve dev/ on :5733
```

`dev/harness.html` and `dev/popup.html` run the real content script and popup against a stubbed
`chrome` API (`dev/chrome-stub.js`), so you can test them in a normal browser tab.

Site settings are stored in `chrome.storage.local` under `site:<hostname>`. The shared color
palette is stored in `chrome.storage.sync`.
