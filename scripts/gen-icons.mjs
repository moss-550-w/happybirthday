// 零依赖生成 PWA 图标 PNG（Node zlib）。
// 产物：public/icons/icon-192.png / icon-512.png / apple-touch-icon.png
// 主题：深紫底 + 居中蛋糕 emoji 风格图形（纯绘制，无外部资源）。
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/icons');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** px: Uint8 RGBA 像素缓冲 (size*size*4) → PNG Buffer */
function encodePNG(size, px) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 9,10,11 = 0 (compression/filter/interlace)
  // 添加每行 filter 字节 0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function draw(size) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = a;
  };
  // 背景深紫
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) set(x, y, 26, 26, 46);

  const cx = size / 2;
  const s = size / 512; // 缩放因子
  const rect = (x0, y0, w, h, r, g, b) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) set(Math.round(x), Math.round(y), r, g, b);
  };
  const disc = (ccx, ccy, rad, r, g, b) => {
    for (let y = -rad; y <= rad; y++)
      for (let x = -rad; x <= rad; x++)
        if (x * x + y * y <= rad * rad)
          set(Math.round(ccx + x), Math.round(ccy + y), r, g, b);
  };

  // 蛋糕体
  rect(cx - 150 * s, 300 * s, 300 * s, 120 * s, 141, 85, 36); // 底座
  rect(cx - 155 * s, 270 * s, 310 * s, 40 * s, 255, 240, 245); // 奶油
  rect(cx - 155 * s, 250 * s, 310 * s, 28 * s, 255, 143, 171); // 草莓层
  rect(cx - 6 * s, 170 * s, 12 * s, 90 * s, 255, 209, 102); // 蜡烛
  disc(cx, 150 * s, 22 * s, 255, 107, 0); // 火苗
  disc(cx, 150 * s, 11 * s, 255, 209, 102); // 火苗芯

  return px;
}

mkdirSync(OUT, { recursive: true });
for (const size of [192, 512]) {
  const png = encodePNG(size, draw(size));
  writeFileSync(resolve(OUT, `icon-${size}.png`), png);
  console.log(`icon-${size}.png  ${(png.length / 1024).toFixed(1)} KB`);
}
// apple-touch-icon 用 192
writeFileSync(resolve(OUT, 'apple-touch-icon.png'), encodePNG(180, draw(180)));
console.log('apple-touch-icon.png');
