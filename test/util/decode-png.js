'use strict'

const zlib = require('zlib')

// Decodes a PNG from headless-gl's encoder, whose rows are RGBA with 8 bits per channel and no filter.
module.exports = function decodePNG (png) {
  let width = 0
  let height = 0
  const compressed = []
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset)
    const type = png.toString('latin1', offset + 4, offset + 8)
    const data = png.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
    } else if (type === 'IDAT') {
      compressed.push(data)
    }
    offset += 12 + length
  }
  const rows = zlib.inflateSync(Buffer.concat(compressed))
  const rowLength = width * 4
  const data = new Uint8Array(rowLength * height)
  for (let y = 0; y < height; ++y) {
    data.set(rows.subarray(y * (rowLength + 1) + 1, (y + 1) * (rowLength + 1)), y * rowLength)
  }
  return { width, height, data }
}
