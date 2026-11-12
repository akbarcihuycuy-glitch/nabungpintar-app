import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // Simple uncompressed RGBA PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8 bits per sample
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // deflate
  ihdr.writeUInt8(0, 11); // adaptive filter
  ihdr.writeUInt8(0, 12); // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk (raw pixel data)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      // Draw rounded card with border or logo shape
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.42;

      if (dist <= radius) {
        rawData[offset++] = 86; // R (#56f1c2)
        rawData[offset++] = 241; // G
        rawData[offset++] = 194; // B
        rawData[offset++] = 255; // A
      } else {
        rawData[offset++] = r; // Background #0d1322
        rawData[offset++] = g;
        rawData[offset++] = b;
        rawData[offset++] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);

  let crc = 0xffffffff;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  for (let i = 4; i < 8 + len; i++) {
    crc = crcTable[(crc ^ chunk[i]) & 0xff] ^ (crc >>> 8);
  }
  chunk.writeInt32BE((crc ^ 0xffffffff) | 0, 8 + len);
  return chunk;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write icons: #0d1322 (13, 19, 34)
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, 13, 19, 34));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, 13, 19, 34));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, 13, 19, 34));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(32, 32, 13, 19, 34));

console.log('PWA icons created successfully in public/');
