"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const zlib = require("node:zlib");
const { paintAt, encodePng, crc32 } = require("../dev/make-icons.js");

test("crc32 matches the known value for 'IEND'", () => {
  assert.equal(crc32(Buffer.from("IEND")), 0xae426082);
});

test("paintAt: corners transparent, right half of circle white, left half violet", () => {
  assert.equal(paintAt(0.01, 0.01), null);
  assert.equal(paintAt(0.6, 0.5), "fg");
  assert.equal(paintAt(0.4, 0.5), "bg");
});

test("encodePng emits a valid RGBA PNG of the requested size", () => {
  const png = encodePng(16);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 16);
  assert.equal(png.readUInt32BE(20), 16);
  const idatLength = png.readUInt32BE(33);
  const raw = zlib.inflateSync(png.subarray(41, 41 + idatLength));
  assert.equal(raw.length, 16 * (16 * 4 + 1));
});
