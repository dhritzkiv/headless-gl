'use strict'

const tape = require('tape')
const createContext = require('../index')

function destroy (gl) {
  gl.getExtension('STACKGL_destroy_context').destroy()
}

function readPixel (gl, x, y) {
  const pixel = new Uint8Array(4)
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
  return [...pixel]
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
