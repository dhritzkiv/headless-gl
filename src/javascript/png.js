const { promisify } = require('util')
const zlib = require('zlib')

const deflate = promisify(zlib.deflate)

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// The CRC-32 that ends each chunk. zlib.crc32 would do, but Node 22 only has it from 22.2.
const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; ++n) {
  let c = n
  for (let k = 0; k < 8; ++k) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  CRC_TABLE[n] = c
}

function crc32 (bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; ++i) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk (type, data) {
  const bytes = Buffer.alloc(12 + data.length)
  bytes.writeUInt32BE(data.length, 0)
  bytes.write(type, 4, 'latin1')
  bytes.set(data, 8)
  bytes.writeUInt32BE(crc32(bytes.subarray(4, 8 + data.length)), 8 + data.length)
  return bytes
}

// The image data before compression: each row starts with its filter type, which is 0 for none.
function unfilteredRows (width, height, pixels) {
  const rowLength = width * 4
  const rows = Buffer.alloc((rowLength + 1) * height)
  for (let y = 0; y < height; ++y) {
    rows.set(pixels.subarray(y * rowLength, (y + 1) * rowLength), y * (rowLength + 1) + 1)
  }
  return rows
}

function assemble (width, height, compressedRows) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // Bits per channel
  header[9] = 6 // Color type: RGBA
  // The compression, filter and interlace methods are all 0.

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', compressedRows),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// Encodes RGBA pixels with 8 bits per channel, the top row first and alpha not premultiplied, as ImageData has them, into a PNG.
function encodePNG (width, height, pixels) {
  return assemble(width, height, zlib.deflateSync(unfilteredRows(width, height, pixels)))
}

// The same, compressing on libuv's thread pool so the event loop isn't blocked. The pixels are copied before it returns.
async function encodePNGAsync (width, height, pixels) {
  return assemble(width, height, await deflate(unfilteredRows(width, height, pixels)))
}

module.exports = { encodePNG, encodePNGAsync }
