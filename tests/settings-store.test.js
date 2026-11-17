"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { FakeStorageArea } = require("./fakes.js");
require("../src/lib/host.js");
require("../src/lib/palette.js");
require("../src/lib/settings.js");
const DS = globalThis.DarkSwitch;

function makeStore() {
  const areas = { local: new FakeStorageArea(), sync: new FakeStorageArea() };
  return { areas, store: DS.createSettingsStore(areas) };
}

test("updateSite persists under the site key", async () => {
  const { areas, store } = makeStore();
  await store.updateSite("www.github.com", (s) => ({ ...s, enabled: true }));
  assert.equal(areas.local.items["site:github.com"].enabled, true);
  assert.equal((await store.getSite("github.com")).enabled, true);
});

test("a site back to defaults is deleted, not stored", async () => {
  const { areas, store } = makeStore();
  await store.updateSite("a.com", (s) => ({ ...s, enabled: true }));
  await store.updateSite("a.com", (s) => ({ ...s, enabled: false }));
  assert.equal("site:a.com" in areas.local.items, false);
});

test("listSites returns only site records, sorted", async () => {
  const { areas, store } = makeStore();
  await areas.local.set({ other: 1, "site:b.com": { enabled: true }, "site:a.com": { hidden: [".x"] } });
  const sites = await store.listSites();
  assert.deepEqual(sites.map((s) => s.host), ["a.com", "b.com"]);
});

test("global palette round-trips through sync and drops invalid colors", async () => {
  const { areas, store } = makeStore();
  await store.saveGlobalPalette({ bg: "#000000", text: "nope" });
  assert.deepEqual(areas.sync.items.palette, { bg: "#000000" });
  assert.deepEqual(await store.getGlobalPalette(), { bg: "#000000" });
});
