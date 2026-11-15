'use strict'

const tape = require('tape')
const createContext = require('../index')
const decodePNG = require('./util/decode-png')

function destroy (gl) {
  gl.getExtension('STACKGL_destroy_context').destroy()
}

function readPixel (gl, x, y) {
  const pixel = new Uint8Array(4)
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
  return [...pixel]
}

// Decodes the image in a data URL from toDataURL, after checking that it's a PNG.
function decodeDataURL (t, url) {
  const prefix = 'data:image/png;base64,'
  t.equal(url.slice(0, prefix.length), prefix, 'toDataURL gives a PNG data URL')
  return decodePNG(Buffer.from(url.slice(prefix.length), 'base64'))
}

// The RGBA values of the pixel at x and y in an image, counting rows from the top.
function imagePixel (image, x, y) {
  const i = (y * image.width + x) * 4
  return [...image.data.subarray(i, i + 4)]
}

tape('canvas: every context has one', function (t) {
  for (const webgl2 of [false, true]) {
    const gl = createContext(3, 2, {}, { createWebGL2Context: webgl2 })
    const canvas = gl.canvas
    t.equal(Object.prototype.toString.call(canvas), '[object HeadlessCanvas]', `a ${webgl2 ? 'WebGL2' : 'WebGL1'} context has a canvas`)
    t.equal(gl.canvas, canvas, 'the same one each time')
    t.ok(canvas instanceof EventTarget, 'which is an EventTarget')
    t.deepEqual([canvas.width, canvas.height], [3, 2], 'with the size createContext was given')
    destroy(gl)
  }
  t.end()
})

tape('canvas: setting width or height resizes the drawing buffer and clears it', function (t) {
  const gl = createContext(2, 2)
  gl.clearColor(1, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.canvas.width = 5
  t.deepEqual([gl.drawingBufferWidth, gl.drawingBufferHeight], [5, 2], 'width resizes the drawing buffer')
  t.deepEqual(readPixel(gl, 4, 1), [0, 0, 0, 0], 'and clears it')
  gl.canvas.height = 3
  t.deepEqual([gl.drawingBufferWidth, gl.drawingBufferHeight], [5, 3], 'height resizes it')
  t.deepEqual([...gl.getParameter(gl.VIEWPORT)], [0, 0, 2, 2], 'neither changes the viewport, as in browsers')

  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.canvas.width = 5
  t.deepEqual(readPixel(gl, 0, 0), [0, 0, 0, 0], 'setting the same size clears it too')
  t.equal(gl.getError(), gl.NO_ERROR, 'no GL errors')
  destroy(gl)
  t.end()
})

tape('canvas: a size of 0 gives a 1x1 drawing buffer', function (t) {
  const gl = createContext(2, 2)
  gl.canvas.width = 0
  t.equal(gl.canvas.width, 0, 'the canvas can be 0 wide')
  t.equal(gl.drawingBufferWidth, 1, 'with a drawing buffer 1 wide')
  gl.canvas.height = 0
  t.equal(gl.drawingBufferHeight, 1, 'and 1 high when it\'s 0 high')
  t.equal(gl.canvas.toDataURL(), 'data:,', 'toDataURL gives "data:," when it has no pixels, as in browsers')
  destroy(gl)
  t.end()
})

tape('canvas: sizes larger than the GPU allows', function (t) {
  const gl = createContext(2, 2)
  const maxSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0])
  gl.canvas.width = maxSize + 32
  t.equal(gl.canvas.width, maxSize + 32, 'the canvas keeps the width it\'s given')
  t.equal(gl.drawingBufferWidth, maxSize, 'and the drawing buffer is as wide as the GPU allows')
  destroy(gl)
  t.end()
})

tape('canvas: a size that isn\'t an integer from 0 to 2^53 - 1 throws a TypeError, as on OffscreenCanvas', function (t) {
  const gl = createContext(2, 2)
  for (const value of [NaN, Infinity, -1, undefined, 'wide', 2 ** 53]) {
    t.throws(() => { gl.canvas.width = value }, TypeError, `width ${String(value)}`)
    t.throws(() => { gl.canvas.height = value }, TypeError, `height ${String(value)}`)
  }
  t.deepEqual([gl.canvas.width, gl.canvas.height, gl.drawingBufferWidth, gl.drawingBufferHeight], [2, 2, 2, 2], 'which leaves the size unchanged')

  gl.canvas.width = '4'
  gl.canvas.height = 3.9
  t.deepEqual([gl.canvas.width, gl.canvas.height], [4, 3], 'other values are converted to integers')
  gl.canvas.width = -0.5
  t.ok(Object.is(gl.canvas.width, 0), 'and -0.5 becomes 0')
  destroy(gl)
  t.end()
})

tape('canvas: STACKGL_resize_drawingbuffer sets its size', function (t) {
  const gl = createContext(2, 2)
  gl.getExtension('STACKGL_resize_drawingbuffer').resize(6, 7)
  t.deepEqual([gl.canvas.width, gl.canvas.height], [6, 7], 'the canvas has the new size')
  destroy(gl)
  t.end()
})

tape('canvas: gl.canvas is an accessor on the prototype that assigning replaces', function (t) {
  const gl = createContext(2, 2)
  const keys = []
  for (const key in gl) {
    keys.push(key)
  }
  t.ok(keys.includes('canvas'), 'for...in finds it, as in browsers')

  // This file is in strict mode, where assigning to a property with only a getter throws.
  const canvas = gl.canvas
  const wrapper = { width: 2, height: 2 }
  gl.canvas = wrapper
  t.equal(gl.canvas, wrapper, 'assigning it replaces what it returns, for libraries that wrap a context in a canvas of their own')
  canvas.width = 3
  t.equal(gl.drawingBufferWidth, 3, 'and the context\'s own canvas still resizes it')
  destroy(gl)
  t.end()
})

tape('canvas: toDataURL encodes the drawing buffer as a PNG, top row first', function (t) {
  const gl = createContext(2, 2)
  gl.clearColor(0, 0, 1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.enable(gl.SCISSOR_TEST)
  gl.scissor(0, 1, 2, 1)
  gl.clearColor(1, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  const image = decodeDataURL(t, gl.canvas.toDataURL())
  t.deepEqual([image.width, image.height], [2, 2], 'the image is the drawing buffer\'s size')
  t.deepEqual([imagePixel(image, 1, 0), imagePixel(image, 1, 1)], [[255, 0, 0, 255], [0, 0, 255, 255]], 'and starts with the top row')
  t.ok(gl.canvas.toDataURL('image/jpeg', 0.5).startsWith('data:image/png;base64,'), 'other image types give a PNG, as browsers do for types they don\'t support')
  t.equal(gl.getError(), gl.NO_ERROR, 'no GL errors')
  destroy(gl)
  t.end()
})

tape('canvas: toDataURL gives colors that aren\'t premultiplied by alpha', function (t) {
  function encodedPixel (attributes, r, g, b, a) {
    const gl = createContext(1, 1, attributes)
    gl.clearColor(r, g, b, a)
    gl.clear(gl.COLOR_BUFFER_BIT)
    const pixel = imagePixel(decodeDataURL(t, gl.canvas.toDataURL()), 0, 0)
    destroy(gl)
    return pixel
  }

  t.deepEqual(encodedPixel({}, 0.5, 0, 0, 0.5), [255, 0, 0, 128], 'with premultipliedAlpha, the drawing buffer\'s colors are divided by alpha')
  t.deepEqual(encodedPixel({}, 0.5, 0, 0, 0), [0, 0, 0, 0], 'which makes them 0 where alpha is 0')
  t.deepEqual(encodedPixel({ premultipliedAlpha: false }, 0.5, 0, 0, 0.5), [128, 0, 0, 128], 'without it, they\'re as drawn')
  t.deepEqual(encodedPixel({ alpha: false }, 1, 0, 0, 0), [255, 0, 0, 255], 'and without alpha, alpha is 255')
  t.end()
})

tape('canvas: toDataURL keeps the GL state as it was', function (t) {
  // A 1x1 framebuffer cleared to green, so reading it instead of the drawing buffer shows.
  function greenFramebuffer (gl) {
    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gl.getParameter(gl.TEXTURE_BINDING_2D), 0)
    gl.clearColor(0, 1, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return framebuffer
  }

  const gl = createContext(1, 1)
  gl.clearColor(1, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  const framebuffer = greenFramebuffer(gl)
  gl.pixelStorei(gl.PACK_ALIGNMENT, 8)
  gl.enable(0)
  t.deepEqual(imagePixel(decodeDataURL(t, gl.canvas.toDataURL()), 0, 0), [255, 0, 0, 255], 'it encodes the drawing buffer while a framebuffer is bound')
  t.equal(gl.getParameter(gl.FRAMEBUFFER_BINDING), framebuffer, 'which stays bound')
  t.equal(gl.getParameter(gl.PACK_ALIGNMENT), 8, 'PACK_ALIGNMENT is kept')
  t.equal(gl.getError(), gl.INVALID_ENUM, 'and so is an earlier error')
  t.equal(gl.getError(), gl.NO_ERROR, 'without adding any')
  gl.clearColor(0, 0, 1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  t.deepEqual(readPixel(gl, 0, 0), [0, 0, 255, 255], 'drawing afterwards goes to the bound framebuffer')
  t.deepEqual(imagePixel(decodeDataURL(t, gl.canvas.toDataURL()), 0, 0), [255, 0, 0, 255], 'and not the drawing buffer')
  destroy(gl)

  const gl2 = createContext(1, 1, {}, { createWebGL2Context: true })
  gl2.clearColor(1, 0, 0, 1)
  gl2.clear(gl2.COLOR_BUFFER_BIT)
  const readFramebuffer = greenFramebuffer(gl2)
  gl2.bindFramebuffer(gl2.DRAW_FRAMEBUFFER, null)
  const packBuffer = gl2.createBuffer()
  gl2.bindBuffer(gl2.PIXEL_PACK_BUFFER, packBuffer)
  gl2.pixelStorei(gl2.PACK_ROW_LENGTH, 7)
  gl2.pixelStorei(gl2.PACK_SKIP_PIXELS, 1)
  gl2.pixelStorei(gl2.PACK_SKIP_ROWS, 2)
  t.deepEqual(imagePixel(decodeDataURL(t, gl2.canvas.toDataURL()), 0, 0), [255, 0, 0, 255], 'in WebGL2, it encodes the drawing buffer while a read framebuffer and a pixel pack buffer are bound')
  t.equal(gl2.getParameter(gl2.READ_FRAMEBUFFER_BINDING), readFramebuffer, 'the read framebuffer stays bound')
  t.equal(gl2.getParameter(gl2.DRAW_FRAMEBUFFER_BINDING), null, 'and the draw framebuffer stays the default')
  t.equal(gl2.getParameter(gl2.PIXEL_PACK_BUFFER_BINDING), packBuffer, 'the pixel pack buffer stays bound')
  t.deepEqual([gl2.PACK_ROW_LENGTH, gl2.PACK_SKIP_PIXELS, gl2.PACK_SKIP_ROWS].map(pname => gl2.getParameter(pname)), [7, 1, 2], 'the pack parameters are kept')

  gl2.bindFramebuffer(gl2.FRAMEBUFFER, null)
  gl2.readBuffer(gl2.NONE)
  t.deepEqual(imagePixel(decodeDataURL(t, gl2.canvas.toDataURL()), 0, 0), [255, 0, 0, 255], 'it encodes the drawing buffer when its read buffer is NONE')
  t.equal(gl2.getParameter(gl2.READ_BUFFER), gl2.NONE, 'which it stays')
  t.equal(gl2.getError(), gl2.NO_ERROR, 'no GL errors')
  destroy(gl2)
  t.end()
})
