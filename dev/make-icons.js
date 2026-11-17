// Renders the toolbar/store icons (16, 32, 48, 128 px) as PNGs with no dependencies.
// Design: violet rounded square, white "contrast" circle (ring + right half filled).
// Run: node dev/make-icons.js
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const SIZES = [16, 32, 48, 128];
const SAMPLES = 4; // 4x4 supersampling per pixel for anti-aliased edges
const BG = [91, 69, 224]; // #5b45e0, the light-theme accent: readable on light and dark toolbars
const FG = [255, 255, 255];

function insideRoundedSquare(x, y) {
  const r = 0.22;
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/** Which paint covers the unit-square point (x, y): "fg", "bg" or null (transparent). */
function paintAt(x, y) {
  if (!insideRoundedSquare(x, y)) return null;
  const dist = Math.hypot(x - 0.5, y - 0.5);
  const radius = 0.3;
  const ring = 0.075;
  if (dist <= radius && dist >= radius - ring) return "fg";
  if (dist < radius && x >= 0.5) return "fg";
  return "bg";
}

function pixelColor(px, py, size) {
  let fg = 0;
  let bg = 0;
  for (let sy = 0; sy < SAMPLES; sy++) {
    for (let sx = 0; sx < SAMPLES; sx++) {
      const paint = paintAt((px + (sx + 0.5) / SAMPLES) / size, (py + (sy + 0.5) / SAMPLES) / size);
      if (paint === "fg") fg++;
      if (paint === "bg") bg++;
    }
  }
  const covered = fg + bg;
  if (covered === 0) return [0, 0, 0, 0];
  const mix = (i) => Math.round((FG[i] * fg + BG[i] * bg) / covered);
  return [mix(0), mix(1), mix(2), Math.round((255 * covered) / SAMPLES ** 2)];
}

/** Raw RGBA scanlines, each prefixed with PNG filter type 0. */
function renderRows(size) {
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    for (let x = 0; x < size; x++) rows.set(pixelColor(x, y, size), rowStart + 1 + x * 4);
  }
  return rows;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

/** Example: encodePng(16) -> Buffer holding a 16x16 RGBA PNG */
function encodePng(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit depth, RGBA, deflate, no filter, no interlace
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = zlib.deflateSync(renderRows(size));
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function main() {
  const outDir = path.join(__dirname, "..", "icons");
  fs.mkdirSync(outDir, { recursive: true });
  for (const size of SIZES) fs.writeFileSync(path.join(outDir, `icon-${size}.png`), encodePng(size));
  console.log(`Wrote ${SIZES.length} icons to ${outDir}`);
}

if (require.main === module) main();
module.exports = { paintAt, encodePng, crc32 };
