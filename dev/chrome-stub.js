// Dev-only stand-in for the chrome.* APIs, so the content script and popup run on a plain http page.
// Storage is backed by localStorage, so a popup tab and a page tab share state like the real extension.
(function () {
  "use strict";

  const changeListeners = [];
  const messageListeners = [];

  function areaFor(name) {
    const prefix = `chrome-stub:${name}:`;
    const read = () => Object.fromEntries(
      Object.keys(localStorage).filter((k) => k.startsWith(prefix)).map((k) => [k.slice(prefix.length), JSON.parse(localStorage[k])]),
    );
    const notify = (changes) => changeListeners.forEach((fn) => fn(changes, name));
    return {
      async get(keys) {
        const all = read();
        if (keys === null || keys === undefined) return all;
        return Object.fromEntries([].concat(keys).filter((k) => k in all).map((k) => [k, all[k]]));
      },
      async set(entries) {
        for (const [k, v] of Object.entries(entries)) localStorage[prefix + k] = JSON.stringify(v);
        notify(Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { newValue: v }])));
      },
      async remove(keys) {
        for (const k of [].concat(keys)) localStorage.removeItem(prefix + k);
        notify(Object.fromEntries([].concat(keys).map((k) => [k, {}])));
      },
    };
  }

  // Changes made in another tab arrive as "storage" events.
  window.addEventListener("storage", (e) => {
    const match = /^chrome-stub:(local|sync):(.*)$/.exec(e.key || "");
    if (match) changeListeners.forEach((fn) => fn({ [match[2]]: {} }, match[1]));
  });

  const pageUrl = new URL("harness.html", location.href).href;

  window.chrome = {
    storage: { local: areaFor("local"), sync: areaFor("sync"), onChanged: { addListener: (fn) => changeListeners.push(fn) } },
    runtime: { onMessage: { addListener: (fn) => messageListeners.push(fn) } },
    tabs: {
      query: async () => [{ id: 1, url: pageUrl }],
      sendMessage: async (_id, message) => (message.type === "detect" ? { dark: window.__stubPageDark === true } : { ok: true }),
    },
    commands: { onCommand: { addListener() {} } },
  };
  window.__stubMessage = (message) => new Promise((resolve) => messageListeners.forEach((fn) => fn(message, {}, resolve)));
})();
