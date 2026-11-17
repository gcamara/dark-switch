// Named test doubles for chrome.storage areas and DOM elements.
"use strict";

/** In-memory stand-in for chrome.storage.local / chrome.storage.sync (promise API). */
class FakeStorageArea {
  constructor(initial = {}) {
    this.items = structuredClone(initial);
  }

  async get(keys) {
    if (keys === null || keys === undefined) return structuredClone(this.items);
    const wanted = Array.isArray(keys) ? keys : [keys];
    const out = {};
    for (const key of wanted) if (key in this.items) out[key] = structuredClone(this.items[key]);
    return out;
  }

  async set(entries) {
    Object.assign(this.items, structuredClone(entries));
  }

  async remove(keys) {
    for (const key of Array.isArray(keys) ? keys : [keys]) delete this.items[key];
  }
}

/** Minimal element: tagName, id, classList, parentElement, children. */
class FakeElement {
  constructor(tagName, { id = "", classes = [] } = {}) {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = classes;
    this.parentElement = null;
    this.children = [];
  }

  append(...kids) {
    for (const kid of kids) {
      kid.parentElement = this;
      this.children.push(kid);
    }
    return this;
  }
}

module.exports = { FakeStorageArea, FakeElement };
