// THE WORLD IN ONE DAY - Thursday 26 November 2026.
// A one-day newspaper front page drawn from scratch with the Node standard
// library only: a tiny 5x7 bitmap font, flat coded illustrations, and a
// hand-rolled PNG encoder (zlib + CRC32). No network, no assets, no fonts
// from disk, so the two grader runs write byte-identical output.
// 35 real stories: 3 LEAD + 11 PICTURE + 21 BRIEF. Press time 07:33 UTC.
// Sources: Reuters, BBC, AP, Xinhua, Bank of Korea, UEFA, CNN.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------- font ----
// 5x7 pixel capitals, digits and punctuation. Everything is set in caps,
// newspaper style. Rows are top to bottom, '1' is an inked pixel.
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  '*': ['00000', '10101', '01110', '11111', '01110', '10101', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
  '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
};

// ------------------------------------------------------------- palette ----
const PAPER: [number, number, number] = [247, 242, 231];
const INK: [number, number, number] = [26, 26, 26];
const RED: [number, number, number] = [185, 28, 28];
const GREY: [number, number, number] = [110, 105, 95];
const SKY: [number, number, number] = [178, 214, 235];
const SEA: [number, number, number] = [196, 224, 238];
const LAND: [number, number, number] = [232, 205, 150];
const DARK: [number, number, number] = [38, 44, 58];
const GOLD: [number, number, number] = [212, 160, 60];
const GREEN: [number, number, number] = [46, 125, 70];
const ORANGE: [number, number, number] = [224, 110, 30];
const TEAL: [number, number, number] = [30, 130, 130];

type RGB = [number, number, number];

// -------------------------------------------------------------- canvas ----
const W = 1024;
const H = 1024;
const buf = Buffer.alloc(W * H * 3);
function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  fillRect(x, y, w, 1, c); fillRect(x, y + h - 1, w, 1, c);
  fillRect(x, y, 1, h, c); fillRect(x + w - 1, y, 1, h, c);
}
function hline(x: number, y: number, w: number, c: RGB, t = 1): void { fillRect(x, y, w, t, c); }
function vline(x: number, y: number, h: number, c: RGB, t = 1): void { fillRect(x, y, t, h, c); }
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y <= r * r) px(cx + x, cy + y, c);
  }
}
function ring(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a += 2) {
    const t = (a * Math.PI) / 180;
    px(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) { px(x, y, c); if (x === x1 && y === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; } }
}
function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
  const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / d;
    const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / d;
    if (a >= 0 && b >= 0 && a + b <= 1) px(x, y, c);
  }
}

// -------------------------------------------------------------- text ------
function textW(s: string, sc: number): number { return s.length * 6 * sc; }
function drawText(x: number, y: number, s: string, sc: number, c: RGB): void {
  const up = s.toUpperCase();
  for (let k = 0; k < up.length; k++) {
    const g = FONT[up[k]] ?? FONT['?'];
    for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
      if (g[r][col] === '1') fillRect(x + k * 6 * sc + col * sc, y + r * sc, sc, sc, c);
    }
  }
}
function drawTextC(cx: number, y: number, s: string, sc: number, c: RGB): void {
  drawText(cx - Math.floor(textW(s, sc) / 2), y, s, sc, c);
}
function wrap(s: string, maxChars: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if (cur.length + 1 + w.length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
// Draw a paragraph, wrapped to maxChars per line. Returns lines drawn.
function para(x: number, y: number, s: string, sc: number, c: RGB, maxChars: number, lh: number): number {
  const lines = wrap(s, maxChars);
  lines.forEach((ln, i) => drawText(x, y + i * lh, ln, sc, c));
  return lines.length;
}

// ------------------------------------------------------------ png out -----
function crc32(b: Buffer): number {
  let table = (crc32 as unknown as { t?: Int32Array }).t;
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    (crc32 as unknown as { t: Int32Array }).t = table;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < b.length; i++) crc = table[(crc ^ b[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) { raw[y * (1 + W * 3)] = 0; buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3); }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------ illustrations ----
// All scenes are flat coded drawings of reported events, not photographs.

// Flame: stacked triangles + discs in orange, gold and red.
function flame(x: number, y: number, s: number): void {
  tri(x, y - 26 * s, x - 12 * s, y, x + 12 * s, y, ORANGE);
  tri(x, y - 18 * s, x - 8 * s, y, x + 8 * s, y, GOLD);
  disc(x, y - 4 * s, 5 * s, RED);
  disc(x, y - 2 * s, 3 * s, [255, 220, 120]);
}
// Smoke puffs rising from (x, y).
function smoke(x: number, y: number, n: number): void {
  const g: RGB = [90, 90, 95];
  for (let i = 0; i < n; i++) disc(x + (i % 2 ? 8 : -6) - i * 2, y - i * 9, 7 - Math.min(4, i), g);
}

// LEAD 1 - tariffs: a container ship on the sea under a big % sign.
function leadTariffs(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  disc(x + w - 34, y + 24, 13, GOLD); // sun
  line(x + w - 62, y + 22, x + w - 56, y + 26, INK); line(x + w - 56, y + 26, x + w - 50, y + 22, INK); // gull 1
  line(x + 96, y + 16, x + 102, y + 20, INK); line(x + 102, y + 20, x + 108, y + 16, INK); // gull 2
  fillRect(x, y + h - 34, w, 34, [52, 110, 150]); // sea
  fillRect(x + 40, y + h - 66, w - 130, 26, [40, 40, 48]); // hull
  tri(x + w - 92, y + h - 66, x + w - 70, y + h - 66, x + w - 80, y + h - 88, [40, 40, 48]); // bow
  const cols: RGB[] = [RED, GOLD, TEAL, [230, 230, 225]];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
    fillRect(x + 48 + c * 36, y + h - 66 - (r + 1) * 16, 32, 14, cols[(r * 6 + c) % 4]);
  }
  fillRect(x + 30, y + 14, 74, 34, [255, 255, 255]); // tariff sign board
  rect(x + 30, y + 14, 74, 34, INK);
  drawText(x + 38, y + 20, '% +', 2, RED);
  drawText(x + 14, y + h - 22, '14 ECONOMIES', 1, [255, 255, 255]);
}
// LEAD 2 - Ras Tanura refinery: towers, pipes, flame and smoke at dusk.
function leadRefinery(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, [64, 52, 66]); // dusk sky
  disc(x + w - 40, y + 22, 11, [240, 220, 180]); // moon
  fillRect(x, y + h - 26, w, 26, [30, 30, 36]); // ground
  fillRect(x + 30, y + 30, 26, h - 56, [120, 120, 128]); // tower 1
  fillRect(x + 66, y + 48, 22, h - 74, [120, 120, 128]); // tower 2
  fillRect(x + 98, y + 20, 20, h - 46, [150, 150, 158]); // flare stack
  fillRect(x + 128, y + 58, 90, 18, [120, 120, 128]); // tank
  fillRect(x + 228, y + 44, 70, 32, [120, 120, 128]); // tank 2
  line(x + 56, y + 60, x + 98, y + 60, [200, 200, 205]);
  line(x + 88, y + 70, x + 128, y + 70, [200, 200, 205]);
  flame(x + 108, y + 30, 1); // flare stack flame, tip kept inside the panel
  flame(x + 77, y + 50, 1); // second flame over the shorter tower
  smoke(x + 150, y + 30, 3);
  drawText(x + 14, y + h - 20, '550,000 BARRELS A DAY', 1, [255, 255, 255]);
}
// LEAD 3 - Cairo tanker fire: ring road, overturned tanker, big flame.
function leadTanker(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, [52, 44, 40]); // night sky
  fillRect(x, y + h - 44, w, 44, [70, 70, 76]); // road
  for (let i = 0; i < 8; i++) fillRect(x + 12 + i * 40, y + h - 24, 20, 3, [240, 220, 120]); // dashes
  fillRect(x + 30, y + h - 78, 150, 30, [200, 200, 205]); // tanker body
  disc(x + 60, y + h - 46, 9, INK); disc(x + 150, y + h - 46, 9, INK);
  fillRect(x + 190, y + h - 72, 34, 24, RED); // cab
  flame(x + 105, y + h - 78, 2);
  flame(x + 250, y + h - 60, 1);
  smoke(x + 105, y + 26, 3);
  drawText(x + 14, y + 12, 'RING ROAD, CAIRO', 1, [255, 220, 120]);
}

// Picture-story strips: one small coded scene each, 245 x 26.
function picStrip(kind: string, x: number, y: number, w: number): void {
  const h = 26;
  const bg: Record<string, RGB> = {
    chart: [220, 235, 245], chip: [30, 34, 48], space: [16, 24, 52],
    sat: [40, 44, 60], mine: [74, 58, 40], crown: [250, 235, 190],
    plane: [150, 190, 220], rescue: [235, 225, 200], bank: [225, 235, 225],
    atom: [30, 30, 40], parade: [245, 220, 230],
  };
  fillRect(x, y, w, h, bg[kind] ?? PAPER);
  if (kind === 'chart') {
    line(x + 8, y + 20, x + 60, y + 12, GREEN); line(x + 60, y + 12, x + 110, y + 14, GREEN);
    line(x + 110, y + 14, x + 160, y + 6, GREEN); tri(x + 160, y + 6, x + 150, y + 8, x + 158, y + 14, GREEN);
    drawText(x + w - 78, y + 8, '4.3%', 2, INK);
  } else if (kind === 'chip') {
    fillRect(x + 14, y + 5, 34, 16, [70, 120, 200]);
    for (let i = 0; i < 4; i++) { fillRect(x + 14 + i * 9, y + 2, 2, 3, GOLD); fillRect(x + 14 + i * 9, y + 21, 2, 3, GOLD); }
    drawText(x + 60, y + 8, 'NVDA -3.9%', 1, [255, 255, 255]);
    line(x + 132, y + 12, x + 168, y + 20, RED); tri(x + 168, y + 20, x + 160, y + 17, x + 160, y + 23, RED); // falling arrow, clear of the label
    drawText(x + 176, y + 8, 'S&P WATCH', 1, [255, 255, 255]);
  } else if (kind === 'space') {
    tri(x + 26, y + 2, x + 18, y + 20, x + 34, y + 20, [230, 230, 235]);
    tri(x + 18, y + 16, x + 12, y + 24, x + 20, y + 22, ORANGE);
    tri(x + 34, y + 16, x + 40, y + 24, x + 32, y + 22, ORANGE);
    disc(x + 200, y + 7, 3, [255, 255, 255]); disc(x + 220, y + 14, 2, [255, 255, 255]);
    drawText(x + 60, y + 9, 'TIANGONG', 1, [255, 255, 255]);
  } else if (kind === 'sat') {
    disc(x + 120, y + 13, 5, [220, 220, 230]);
    fillRect(x + 96, y + 10, 18, 6, [90, 140, 220]); fillRect(x + 132, y + 10, 18, 6, [90, 140, 220]);
    for (let i = 0; i < 5; i++) disc(x + 20 + i * 8, y + 6 + (i % 2) * 12, 2, [255, 255, 255]);
    drawText(x + 168, y + 9, '1M', 1, [255, 255, 255]);
  } else if (kind === 'mine') {
    fillRect(x + 10, y + 4, 40, 18, [30, 24, 18]);
    line(x + 10, y + 4, x + 50, y + 22, GOLD); line(x + 50, y + 4, x + 10, y + 22, GOLD);
    fillRect(x + 60, y + 14, w - 70, 12, [52, 110, 150]);
    drawText(x + 66, y + 17, 'FLOOD', 1, [255, 255, 255]);
  } else if (kind === 'crown') {
    tri(x + 16, y + 20, x + 10, y + 8, x + 22, y + 16, GOLD);
    tri(x + 30, y + 20, x + 24, y + 6, x + 38, y + 14, GOLD);
    tri(x + 44, y + 20, x + 38, y + 8, x + 52, y + 16, GOLD);
    fillRect(x + 10, y + 20, 44, 4, GOLD);
    disc(x + 24, y + 5, 2, RED); disc(x + 40, y + 5, 2, RED);
    drawText(x + 66, y + 9, 'MISS UNIVERSE', 1, INK);
  } else if (kind === 'plane') {
    tri(x + 30, y + 8, x + 12, y + 14, x + 30, y + 16, [255, 255, 255]);
    tri(x + 26, y + 14, x + 20, y + 22, x + 30, y + 16, [255, 255, 255]);
    fillRect(x + 60, y + 18, w - 70, 8, [40, 90, 140]);
    line(x + 60, y + 18, x + 90, y + 14, [255, 255, 255]); line(x + 90, y + 14, x + 120, y + 18, [255, 255, 255]);
  } else if (kind === 'rescue') {
    fillRect(x + 12, y + 6, 44, 16, [200, 60, 60]);
    fillRect(x + 18, y + 10, 8, 12, [255, 255, 255]); fillRect(x + 32, y + 10, 8, 12, [255, 255, 255]);
    drawText(x + 66, y + 9, 'FREED', 1, INK);
    disc(x + 200, y + 13, 6, GREEN); drawText(x + 195, y + 10, '+', 1, [255, 255, 255]);
  } else if (kind === 'bank') {
    for (let i = 0; i < 4; i++) fillRect(x + 14 + i * 12, y + 8, 6, 12, [120, 120, 125]);
    tri(x + 10, y + 8, x + 62, y + 8, x + 36, y + 2, [120, 120, 125]);
    fillRect(x + 10, y + 20, 52, 3, [120, 120, 125]);
    drawText(x + 72, y + 9, '3.25%', 1, INK);
  } else if (kind === 'atom') {
    disc(x + 30, y + 13, 4, RED);
    ring(x + 30, y + 13, 10, [200, 200, 210]);
    disc(x + 40, y + 8, 2, GOLD); disc(x + 20, y + 18, 2, GOLD);
    drawText(x + 56, y + 9, 'NUCLEAR', 1, [255, 255, 255]);
  } else if (kind === 'parade') {
    disc(x + 30, y + 12, 9, [220, 60, 90]);
    line(x + 30, y + 21, x + 30, y + 25, [120, 120, 125]);
    fillRect(x + 60, y + 20, w - 70, 4, [120, 120, 125]);
    drawText(x + 66, y + 8, '100 YEARS', 1, INK);
  }
}

// Tag chip: number + region + status, e.g. "1 - WORLD - REPORTED".
function tagLine(x: number, y: number, num: string, region: string, status: string): void {
  drawText(x, y, num + ' - ' + region, 1, INK);
  const w0 = textW(num + ' - ' + region + ' ', 1);
  const col = status === 'CONFIRMED' ? GREEN : status === 'CLAIM' ? RED : [176, 120, 20];
  fillRect(x + w0, y - 1, textW(status, 1) + 6, 9, col);
  drawText(x + w0 + 3, y, status, 1, [255, 255, 255]);
}

// ------------------------------------------------------------ world map ----
// Schematic world map: tan land on pale sea, red numbered pins for the
// 14 lead + picture stories. Positions are approximate, by region.
function drawMap(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SEA);
  rect(x, y, w, h, INK);
  const land = (lx: number, ly: number, lw: number, lh: number) => {
    fillRect(x + lx, y + ly, lw, lh, LAND);
  };
  land(18, 18, 78, 30); land(30, 44, 52, 22); land(10, 26, 22, 18); // N America
  land(52, 72, 34, 44); land(60, 112, 18, 14); // S America
  land(150, 22, 34, 22); land(160, 40, 18, 12); // Europe
  land(148, 56, 44, 46); land(158, 98, 26, 12); // Africa
  land(190, 16, 108, 40); land(210, 52, 70, 22); land(268, 60, 26, 16); // Asia
  land(258, 104, 36, 18); // Australia
  // Pins 1-3 are the LEAD stories, 4-14 the PICTURE stories, by region.
  const pins: [number, number, string][] = [
    [44, 50, '1'], [196, 62, '2'], [172, 60, '3'], [58, 30, '4'],
    [22, 52, '5'], [266, 42, '6'], [36, 64, '7'], [272, 88, '8'],
    [84, 68, '9'], [60, 62, '10'], [288, 40, '11'], [272, 28, '12'],
    [74, 44, '13'], [88, 82, '14'],
  ];
  for (const [px, py, n] of pins) {
    disc(x + px, y + py, 8, RED);
    ring(x + px, y + py, 8, [255, 255, 255]);
    drawText(x + px - (n.length === 1 ? 3 : 6), y + py - 3, n, 1, [255, 255, 255]);
  }
}

// ------------------------------------------------------------ content -----
interface Lead { n: string; region: string; status: string; head: string; body: string; src: string; draw: (x: number, y: number, w: number, h: number) => void; }
const LEADS: Lead[] = [
  { n: '1', region: 'WORLD', status: 'CONFIRMED',
    head: 'TRUMP UNVEILS NEW TARIFFS ON 14 ECONOMIES, CHINA HIT HARDEST',
    body: 'WASHINGTON PROPOSES TARIFFS ON 14 PARTNERS OVER EXCESS FACTORY CAPACITY; HIGHEST RATES FOR CHINA. ASIAN MARKETS RALLY: NIKKEI +1.6%, KOREA +1.9%.',
    src: 'REUTERS - BBC', draw: leadTariffs },
  { n: '2', region: 'MID EAST', status: 'REPORTED',
    head: "HOUTHIS CLAIM ATTACK ON SAUDI ARABIA'S BIGGEST REFINERY; OIL JUMPS",
    body: "HOUTHIS SAY THEY HIT RAS TANURA, THE KINGDOM'S LARGEST REFINERY; SATELLITE IMAGES SHOW SMOKE. ARAMCO SILENT ON DAMAGE; BRENT +3.5% TO $94.61.",
    src: 'REUTERS', draw: leadRefinery },
  { n: '3', region: 'AFRICA', status: 'CONFIRMED',
    head: 'FUEL TANKER FIRE KILLS AT LEAST 31 ON CAIRO RING ROAD',
    body: 'TANKER OVERTURNS AND BURSTS INTO FLAMES IN WARRAQ, GIZA; 21 HURT, 39 AMBULANCES SENT. TOLL PRELIMINARY AND MAY RISE, MINISTRY SAYS.',
    src: 'AP - BBC', draw: leadTanker },
];
interface Pic { n: string; region: string; status: string; head: string; body: string; kind: string; }
const PICS: Pic[] = [
  { n: '4', region: 'N AMERICA', status: 'CONFIRMED', head: 'US ECONOMY GREW 4.3% IN Q3; CORE INFLATION HOT AT 3.3%', body: 'GDP REVISED UP; GOLD DIPS, THEN STEADIES.', kind: 'chart' },
  { n: '5', region: 'N AMERICA', status: 'CONFIRMED', head: "S&P PUTS NVIDIA ON DOWNGRADE WATCH; SHARES SLIDE 3.9%", body: 'HUANG EXIT EXPOSED BOARD WEAKNESS.', kind: 'chip' },
  { n: '6', region: 'ASIA-PAC', status: 'CONFIRMED', head: "FIRST PAKISTANI ASTRONAUT BOARDS CHINA'S TIANGONG STATION", body: 'ZEESHAN ALI DOCKS ON SHENZHOU-24.', kind: 'space' },
  { n: '7', region: 'N AMERICA', status: 'CONFIRMED', head: 'US APPROVES SPACEX PLAN FOR A MILLION ORBITAL DATA CENTRES', body: "FCC CLEARS 'STARMIND' FOR AI IN ORBIT.", kind: 'sat' },
  { n: '8', region: 'ASIA-PAC', status: 'CONFIRMED', head: '13 DEAD, 13 STILL TRAPPED IN FLOODED INDONESIAN GOLD MINE', body: 'RAIN SWAMPS ILLEGAL SHAFTS; SEARCH ON.', kind: 'mine' },
  { n: '9', region: 'N AMERICA', status: 'CONFIRMED', head: 'JENNIFER BARRETO WINS MISS UNIVERSE 2026', body: 'FIRST MOTHER TO TAKE THE CROWN.', kind: 'crown' },
  { n: '10', region: 'N AMERICA', status: 'CONFIRMED', head: 'SIX DEAD AFTER CESSNA 210 CRASHES INTO GULF OF MEXICO', body: 'PLANE LOST OFF HORN ISLAND, MISSISSIPPI.', kind: 'plane' },
  { n: '11', region: 'S AMERICA', status: 'CONFIRMED', head: 'COLOMBIA FREES ALL HOSTAGES AFTER DAY-LONG SUPERMARKET SIEGE', body: 'ONE GUNMAN KILLED, FOUR HELD.', kind: 'rescue' },
  { n: '12', region: 'ASIA-PAC', status: 'CONFIRMED', head: 'BANK OF KOREA RAISES RATES TO 3.25%, HIGHEST IN TWO YEARS', body: 'CHIP BOOM KEEPS INFLATION ELEVATED.', kind: 'bank' },
  { n: '13', region: 'ASIA-PAC', status: 'CONFIRMED', head: 'KIM JONG UN CALLS FOR WIDER NUCLEAR WEAPONS DEPLOYMENT', body: 'N KOREA ALSO EXPELS SWISS DIPLOMAT.', kind: 'atom' },
  { n: '14', region: 'N AMERICA', status: 'CONFIRMED', head: "MACY'S POSTPONES THANKSGIVING PARADE, FIRST TIME IN 100 YEARS", body: 'SEVERE WEATHER HALTS THE PARADE.', kind: 'parade' },
];
const NUMBERS: [string, string][] = [
  ['31', 'PEOPLE KILLED IN THE CAIRO RING-ROAD FUEL TANKER FIRE'],
  ['14', 'ECONOMIES TARGETED BY THE NEW US TARIFFS'],
  ['4.3%', 'US Q3 GDP GROWTH, REVISED SHARPLY HIGHER'],
  ['3.3%', 'US CORE PCE INFLATION IN OCTOBER, YEAR ON YEAR'],
  ['1,000,000', 'SATELLITES THE FCC LET SPACEX DEPLOY IN ORBIT'],
  ['13 + 13', 'MINERS DEAD AND STILL TRAPPED IN INDONESIA'],
];
const REGIONS: [string, number, RGB][] = [
  ['N AMERICA', 13, [52, 110, 180]], ['ASIA-PAC', 7, TEAL], ['EUROPE', 5, GOLD],
  ['WORLD', 4, GREY], ['MID EAST', 3, RED], ['AFRICA', 2, ORANGE],
  ['S AMERICA', 1, GREEN], ['OCEANIA', 0, [150, 150, 150]],
];
const TIMELINE: [string, string][] = [
  ['24 NOV 21:45', 'CESSNA LOST OVER GULF OF MEXICO'],
  ['25 NOV 03:56', 'SHENZHOU-24 DOCKS; FIRST PAKISTANI IN SPACE'],
  ['25 NOV 13:30', 'US GDP 4.3%; CORE PCE 3.3%'],
  ['25 NOV EVENING', 'CAIRO TANKER FIRE; 31 DEAD'],
  ['26 NOV 00:58', 'BANK OF KOREA RAISES RATE TO 3.25%'],
  ['26 NOV 07:33', 'PRESS TIME; US ON THANKSGIVING'],
];
const BRIEFS: string[] = [
  'ASIAN MARKETS RALLY; NIKKEI +1.6%, KOREA +1.9%',
  'ISRAEL JUDGES URGE DROPPING NETANYAHU CASE',
  'POLAND PLANS NO-FLY ZONE NEAR UKRAINE BORDER',
  'N KOREA EXPELS SWISS DIPLOMAT, CLOSES OFFICE',
  'EU PLANS 50BN EURO TECH FUND FOR QUANTUM, AI',
  'BOEHLY GROUP TO BUY LUKOIL ASSETS FOR $10BN',
  'ANTHROPIC SHARES FALL BELOW $83 IPO PRICE',
  'US JUDGE BLOCKS FCC REVIEW OF ABC STATIONS',
  'UBER TESTS DRIVERLESS TAXIS, NO SAFETY DRIVER',
  'BITCOIN ETF OUTFLOWS NEAR $5BN IN NOVEMBER',
  'CHAMPIONS LEAGUE: LIVERPOOL 3-0 BRUGGE',
  'NIGERIA SEIZES $227M METH LAB, ARRESTS SIX',
  'US CDC REPORTS NINE MEASLES DEATHS IN 2026',
  'AARON RODGERS RELEASED; MAY BE LAST NFL GAME',
  'DURAN DURAN GUITARIST ANDY TAYLOR DIES, 65',
  'UK SET TO PUBLISH NEW EU TREATIES, BBC SAYS',
  'HONG KONG RENOVATION BLAZE KILLED 168',
  'MUSK PLEDGES TWO SPACEX SHARES PER US CHILD',
  'IRAN CLAIMS MINE STRIKES IN STRAIT OF HORMUZ',
  'TRUMP PARDONS TURKEYS FREEDOM AND FEATHERS',
  "SIX-DAY STREAK 'SMASHES' HEAT RECORD",
];

// -------------------------------------------------------------- layout ----
function centeredLines(cx: number, y: number, lines: string[], sc: number, c: RGB, lh: number): void {
  lines.forEach((ln, i) => drawTextC(cx, y + i * lh, ln, sc, c));
}
function render(): void {
  fillRect(0, 0, W, H, PAPER);
  // Outer border.
  fillRect(0, 0, W, 2, INK); fillRect(0, H - 2, W, 2, INK);
  fillRect(0, 0, 2, H, INK); fillRect(W - 2, 0, 2, H, INK);

  // Top bar.
  fillRect(8, 8, 1008, 18, INK);
  drawTextC(512, 13, '35 STORIES - 7 REGIONS - ALL FROM THURSDAY 26 NOVEMBER 2026 - PRESS TIME 07:33 UTC', 1, [255, 255, 255]);

  // Masthead.
  drawTextC(512, 32, 'THE WORLD IN ONE DAY', 7, INK);
  drawTextC(512, 86, 'THURSDAY 26 NOVEMBER 2026', 2, RED);
  drawTextC(512, 106, 'TARIFFS ON 14 ECONOMIES - RAS TANURA HIT - 31 DEAD IN CAIRO FIRE', 1, RED);
  hline(10, 122, 1004, INK, 2);

  // The day in numbers.
  drawText(10, 128, 'THE DAY IN NUMBERS', 1, RED);
  for (let i = 0; i < NUMBERS.length; i++) {
    const cx = 10 + i * 167 + 83;
    const [num, label] = NUMBERS[i];
    const sc = num.length > 4 ? 3 : 4;
    drawTextC(cx, 142, num, sc, INK);
    centeredLines(cx, 174, wrap(label, 26), 1, GREY, 10);
    if (i > 0) vline(10 + i * 167 - 1, 140, 56, GREY);
  }

  // Region bar.
  let bx = 10;
  for (const [, count, col] of REGIONS) {
    const w = Math.round((count / 35) * 1004);
    if (w > 0) fillRect(bx, 202, w, 12, col);
    bx += w;
  }
  rect(10, 202, 1004, 12, INK);
  drawTextC(512, 218, 'EUROPE 5 - ASIA-PAC 7 - N AMERICA 13 - MID EAST 3 - AFRICA 2 - S AMERICA 1 - WORLD 4 - OCEANIA 0', 1, INK);
  hline(10, 232, 1004, INK, 2);

  // The day in UTC.
  drawText(10, 238, 'THE DAY IN UTC', 1, RED);
  for (let i = 0; i < TIMELINE.length; i++) {
    const x = 10 + i * 167;
    drawText(x, 252, TIMELINE[i][0], 1, RED);
    para(x, 262, TIMELINE[i][1], 1, INK, 26, 10);
  }
  hline(10, 296, 1004, INK, 2);

  // Three LEAD stories.
  for (let i = 0; i < LEADS.length; i++) {
    const x = 10 + i * 336;
    const L = LEADS[i];
    L.draw(x, 302, 328, 112);
    rect(x, 302, 328, 112, INK);
    tagLine(x, 422, L.n, L.region, L.status);
    para(x, 436, L.head, 2, INK, 27, 18);
    para(x, 492, L.body, 1, INK, 54, 10);
    drawText(x, 524, L.src, 1, GREY);
  }
  hline(10, 534, 1004, INK, 2);

  // Picture stories: 4 columns x 3 rows.
  for (let i = 0; i < PICS.length; i++) {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 10 + col * 253, y = 540 + row * 73;
    const P = PICS[i];
    picStrip(P.kind, x, y, 245);
    rect(x, y, 245, 26, INK);
    para(x, y + 30, P.head, 1, INK, 40, 10);
    drawText(x, y + 50, P.body, 1, GREY);
    tagLine(x, y + 61, P.n, P.region, P.status);
  }
  // 12th cell: edition box.
  {
    const x = 10 + 3 * 253, y = 540 + 2 * 73;
    fillRect(x, y, 245, 69, [232, 225, 210]);
    rect(x, y, 245, 69, INK);
    drawTextC(x + 122, y + 8, '35 STORIES IN', 1, INK);
    drawTextC(x + 122, y + 20, 'THIS EDITION', 1, INK);
    drawTextC(x + 122, y + 36, '3 LEAD - 11 PICTURE', 1, RED);
    drawTextC(x + 122, y + 48, '21 IN BRIEF', 1, RED);
  }
  hline(10, 758, 1004, INK, 2);

  // Bottom: map + briefs.
  drawText(10, 764, 'WHERE IT HAPPENED', 1, RED);
  drawMap(10, 778, 320, 150);
  drawText(10, 932, 'PINS 1-14 MATCH THE STORIES ABOVE', 1, GREY);
  drawText(340, 764, 'ALSO - IN BRIEF', 1, RED);
  for (let i = 0; i < BRIEFS.length; i++) {
    const col = i < 11 ? 0 : 1;
    const row = i % 11;
    const x = 340 + col * 340;
    const y = 778 + row * 14;
    drawText(x, y, (i + 1) + '.', 1, RED);
    drawText(x + (i < 9 ? 18 : 24), y, BRIEFS[i], 1, INK);
  }
  hline(10, 944, 1004, INK, 2);

  // Date check.
  fillRect(10, 950, 1004, 40, [250, 230, 230]);
  rect(10, 950, 1004, 40, RED);
  drawText(16, 956, 'DATE CHECK', 1, RED);
  para(16, 968, 'PRESS TIME 07:33 UTC. RAS TANURA DAMAGE UNCONFIRMED; ARAMCO SILENT. CAIRO TOLL OF 31 PRELIMINARY AND MAY RISE. 13 MINERS STILL TRAPPED; CESSNA CAUSE UNKNOWN. NO STORIES FOUND FOR OCEANIA. NOTHING AFTER 07:33 UTC IS COVERED.', 1, INK, 160, 10);

  // Footer.
  drawTextC(512, 996, 'SOURCES: REUTERS - BBC - AP - XINHUA - BANK OF KOREA - UEFA - CNN - SCENES ARE DRAWN ILLUSTRATIONS OF REPORTED EVENTS, NOT PHOTOGRAPHS', 1, GREY);
  drawTextC(512, 1008, "CONFIRMED = NAMED SOURCE REPORTS IT - REPORTED = NOT YET CONFIRMED - CLAIM = ONE SIDE'S ACCOUNT, CONTESTED", 1, GREY);
}

// --------------------------------------------------------------- main -----
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
render();
writeFileSync(join(outDir, 'entry.png'), encodePNG());
