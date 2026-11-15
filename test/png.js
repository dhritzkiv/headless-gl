'use strict'

const tape = require('tape')
const zlib = require('zlib')
const { encodePNG } = require('../src/javascript/png')

// Splits a PNG into its chunks, after checking its signature.
function readChunks (t, png) {
  t.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'it starts with the PNG signature')
  const chunks = []
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset)
    chunks.push({
      type: png.toString('latin1', offset + 4, offset + 8),
      data: png.subarray(offset + 8, offset + 8 + length),
      typeAndData: png.subarray(offset + 4, offset + 8 + length),
      crc: png.readUInt32BE(offset + 8 + length)
    })
    offset += 12 + length
  }
  return chunks
}

tape('png: encodes RGBA pixels with the top row first', function (t) {
  const pixels = new Uint8Array([
    255, 0, 0, 255, 0, 255, 0, 128,
    0, 0, 255, 0, 10, 20, 30, 40
  ])
  const chunks = readChunks(t, encodePNG(2, 2, pixels))
  t.deepEqual(chunks.map(chunk => chunk.type), ['IHDR', 'IDAT', 'IEND'], 'it has a header, the image data and an end')

  const header = chunks[0].data
  t.deepEqual([header.readUInt32BE(0), header.readUInt32BE(4)], [2, 2], 'the header gives the size')
  t.deepEqual([...header.subarray(8)], [8, 6, 0, 0, 0], 'and 8 bits per channel of RGBA, not interlaced')

  const rows = zlib.inflateSync(chunks[1].data)
  t.deepEqual([...rows], [0, ...pixels.subarray(0, 8), 0, ...pixels.subarray(8)], 'each row is the pixels after a 0 for no filter')

  // IEND's checksum is the same in every PNG.
  t.equal(chunks[2].crc, 0xae426082, 'the checksum of the end chunk is right')
  if (zlib.crc32) {
    for (const chunk of chunks) {
      t.equal(chunk.crc, zlib.crc32(chunk.typeAndData), `the checksum of ${chunk.type} matches zlib's`)
    }
  }
  t.end()
})

tape('png: takes a view into a larger buffer', function (t) {
  const buffer = new Uint8Array(12).fill(7)
  const pixels = buffer.subarray(4, 8)
  const chunks = readChunks(t, encodePNG(1, 1, pixels))
  t.deepEqual([...zlib.inflateSync(chunks[1].data)], [0, 7, 7, 7, 7], 'only the view\'s pixels are encoded')
  t.end()
})
