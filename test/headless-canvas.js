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

tape('canvas: createCanvas makes a canvas without a context', function (t) {
  const { createCanvas, HeadlessCanvas } = createContext
  const canvas = createCanvas(3, 2)
  t.ok(canvas instanceof HeadlessCanvas, 'createCanvas makes a HeadlessCanvas')
  t.ok(new HeadlessCanvas(3, 2) instanceof HeadlessCanvas, 'which can also be constructed, as an OffscreenCanvas can')
  t.deepEqual([canvas.width, canvas.height], [3, 2], 'with the size it\'s given')
  t.deepEqual([createCanvas(0, 0).width, createCanvas(0, 0).height], [0, 0], 'which can be 0')
  t.throws(() => createCanvas(), TypeError, 'and must be given, as on an OffscreenCanvas')
  t.throws(() => createCanvas(1, -1), TypeError, 'as an integer from 0 up')

  canvas.width = 4
  t.equal(canvas.width, 4, 'its size can be set before it has a context')
  const image = decodeDataURL(t, canvas.toDataURL())
  t.deepEqual([image.width, image.height], [4, 2], 'and toDataURL gives an image of its size')
  t.ok(image.data.every(value => value === 0), 'which is transparent black')
  t.equal(createCanvas(0, 2).toDataURL(), 'data:,', 'or "data:," when it has no pixels')
  t.equal(createCanvas(Number.MAX_SAFE_INTEGER, 2).toDataURL(), 'data:,', 'or too many to hold in memory')
  t.end()
})

tape('canvas: getContext creates the canvas\'s context once', function (t) {
  const { createCanvas, WebGLRenderingContext, WebGL2RenderingContext } = createContext
  const canvas = createCanvas(3, 2)
  const gl = canvas.getContext('webgl', { alpha: false })
  t.ok(gl instanceof WebGLRenderingContext, 'getContext(\'webgl\') creates a WebGL1 context')
  t.equal(gl.canvas, canvas, 'whose canvas is the canvas')
  t.deepEqual([gl.drawingBufferWidth, gl.drawingBufferHeight], [3, 2], 'with a drawing buffer of the canvas\'s size')
  t.equal(gl.getContextAttributes().alpha, false, 'and the attributes it\'s given')
  t.equal(canvas.getContext('webgl', { alpha: true }), gl, 'asking again returns the same context')
  t.equal(gl.getContextAttributes().alpha, false, 'with its first attributes, as in browsers')
  t.equal(canvas.getContext('experimental-webgl'), gl, 'and so does the legacy \'experimental-webgl\'')
  t.equal(canvas.getContext('webgl2'), null, 'asking for WebGL2 returns null')
  canvas.width = 5
  t.equal(gl.drawingBufferWidth, 5, 'setting the canvas\'s size resizes the context\'s drawing buffer')
  destroy(gl)

  const canvas2 = createCanvas(2, 2)
  const gl2 = canvas2.getContext('webgl2')
  t.ok(gl2 instanceof WebGL2RenderingContext, 'getContext(\'webgl2\') creates a WebGL2 context')
  t.equal(canvas2.getContext('webgl2'), gl2, 'which asking again returns')
  t.equal(canvas2.getContext('webgl'), null, 'and asking for WebGL1 returns null')
  destroy(gl2)

  const fromCreateGL = createContext(2, 2)
  t.equal(fromCreateGL.canvas.getContext('webgl'), fromCreateGL, 'the canvas of a context from createContext returns that context')
  destroy(fromCreateGL)
  t.end()
})

tape('canvas: getContext returns null for context ids it doesn\'t support', function (t) {
  const canvas = createContext.createCanvas(2, 2)
  for (const contextId of ['2d', 'bitmaprenderer', 'webgpu', 'WebGL', 'webgl1', '']) {
    t.equal(canvas.getContext(contextId), null, `'${contextId}' gives null, as on a <canvas>`)
  }
  t.throws(() => canvas.getContext(), TypeError, 'and no id throws a TypeError')
  const gl = canvas.getContext('webgl')
  t.ok(gl, 'which leaves the canvas without a context, so it can still have one')
  destroy(gl)
  t.end()
})

tape('canvas: a canvas 0 wide or high gets a 1x1 drawing buffer', function (t) {
  const canvas = createContext.createCanvas(0, 0)
  const gl = canvas.getContext('webgl')
  t.deepEqual([gl.drawingBufferWidth, gl.drawingBufferHeight], [1, 1], 'as in browsers')
  t.equal(gl.getError(), gl.NO_ERROR, 'with no GL errors')
  destroy(gl)
  t.end()
})

tape('canvas: getContext fires webglcontextcreationerror when the context can\'t be created', function (t) {
  const { createCanvas, WebGLContextEvent } = createContext
  const canvas = createCanvas(2, 2)
  // Stands in for a GPU that can't make a context.
  canvas._createContext = function () {
    const error = new Error('No GPU for you.')
    error.code = 'HEADLESS_GL_CONTEXT_CREATION_FAILED'
    throw error
  }
  const events = []
  canvas.addEventListener('webglcontextcreationerror', function (event) {
    events.push(event)
  })
  t.equal(canvas.getContext('webgl'), null, 'getContext returns null')
  t.equal(events.length, 1, 'after firing webglcontextcreationerror once')
  t.ok(events[0] instanceof WebGLContextEvent, 'with a WebGLContextEvent')
  t.equal(Object.prototype.toString.call(events[0]), '[object WebGLContextEvent]', 'tagged as in browsers')
  t.equal(events[0].statusMessage, 'No GPU for you.', 'whose statusMessage gives the reason')
  t.ok(events[0].cancelable, 'and which is cancelable, as the WebGL spec says')

  delete canvas._createContext
  const gl = canvas.getContext('webgl')
  t.ok(gl, 'a later call can still create the context')
  destroy(gl)

  t.throws(() => createCanvas(1, 1).getContext('webgl', { powerPreference: 'fast' }), TypeError, 'an invalid powerPreference throws a TypeError, as in browsers, instead of firing the event')
  t.equal(new WebGLContextEvent('webglcontextlost').statusMessage, '', 'a WebGLContextEvent\'s statusMessage is empty by default')
  t.end()
})

// Reads a texture's pixels, row 0 first, through a framebuffer.
function readTexture (gl, texture, width, height) {
  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  const pixels = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.deleteFramebuffer(framebuffer)
  return [...pixels]
}

// A 1x2 canvas whose drawing buffer is red on top and blue below.
function redOverBlue () {
  const source = createContext.createCanvas(1, 2).getContext('webgl')
  source.clearColor(0, 0, 1, 1)
  source.clear(source.COLOR_BUFFER_BIT)
  source.enable(source.SCISSOR_TEST)
  source.scissor(0, 1, 1, 1)
  source.clearColor(1, 0, 0, 1)
  source.clear(source.COLOR_BUFFER_BIT)
  return source
}

tape('canvas: texture uploads take a canvas as an image of its drawing buffer', function (t) {
  const source = redOverBlue()
  const gl = createContext(1, 1)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source.canvas)
  t.deepEqual(readTexture(gl, texture, 1, 2), [255, 0, 0, 255, 0, 0, 255, 255], 'texImage2D uploads the canvas with its top row first, as an image')
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source.canvas)
  t.deepEqual(readTexture(gl, texture, 1, 2), [0, 0, 255, 255, 255, 0, 0, 255], 'and flips it with UNPACK_FLIP_Y_WEBGL')
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)

  source.clearColor(0, 1, 0, 1)
  source.clear(source.COLOR_BUFFER_BIT)
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source.canvas)
  t.deepEqual(readTexture(gl, texture, 1, 2), [0, 255, 0, 255, 0, 0, 255, 255], 'texSubImage2D takes it too')
  t.equal(gl.getError(), gl.NO_ERROR, 'no GL errors')
  t.equal(source.getError(), source.NO_ERROR, 'in either context')
  destroy(source)
  destroy(gl)
  t.end()
})

tape('canvas: an uploaded canvas\'s colors aren\'t premultiplied by alpha, as in an image', function (t) {
  const source = createContext.createCanvas(1, 1).getContext('webgl')
  source.clearColor(0.5, 0, 0, 0.5)
  source.clear(source.COLOR_BUFFER_BIT)
  const gl = createContext(1, 1)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source.canvas)
  t.deepEqual(readTexture(gl, texture, 1, 1), [255, 0, 0, 128], 'the premultiplied drawing buffer is divided by alpha')
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source.canvas)
  t.deepEqual(readTexture(gl, texture, 1, 1), [128, 0, 0, 128], 'and multiplied again with UNPACK_PREMULTIPLY_ALPHA_WEBGL')
  destroy(source)
  destroy(gl)
  t.end()
})

tape('canvas: a context can upload its own canvas', function (t) {
  const gl = createContext(1, 1)
  gl.clearColor(1, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.canvas)
  t.deepEqual(readTexture(gl, texture, 1, 1), [255, 0, 0, 255], 'the texture has the drawing buffer\'s pixels')
  t.equal(gl.getError(), gl.NO_ERROR, 'no GL errors')
  destroy(gl)
  t.end()
})

tape('canvas: a canvas without a context uploads as transparent black, without getting one', function (t) {
  const canvas = createContext.createCanvas(2, 1)
  const gl = createContext(1, 1)
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  t.deepEqual(readTexture(gl, texture, 2, 1), [0, 0, 0, 0, 0, 0, 0, 0], 'the texture is the canvas\'s size and transparent black')
  const own = canvas.getContext('webgl')
  t.ok(own instanceof createContext.WebGLRenderingContext, 'and the canvas can still get a WebGL1 context, so the upload didn\'t give it a WebGL2 one')
  destroy(own)
  destroy(gl)
  t.end()
})

tape('canvas: uploads take another library\'s canvas that wraps a headless-gl context', function (t) {
  const source = redOverBlue()
  const asked = []
  // Like the canvases of node-canvas-webgl and gl-conformance, whose getContext returns a headless-gl context.
  const wrapper = {
    width: 1,
    height: 2,
    getContext (contextId) {
      asked.push(contextId)
      return contextId === 'webgl' ? source : null
    }
  }
  const gl = createContext(1, 1, {}, { createWebGL2Context: true })
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wrapper)
  t.deepEqual(readTexture(gl, texture, 1, 2), [255, 0, 0, 255, 0, 0, 255, 255], 'the texture has the wrapped context\'s drawing buffer')
  t.deepEqual(asked, ['2d', 'webgl2', 'webgl'], 'which is only asked for once its 2D context is null, so asking can\'t create a context')
  t.equal(gl.getError(), gl.NO_ERROR, 'no GL errors')
  destroy(source)
  destroy(gl)
  t.end()
})

tape('canvas: toBlob calls back later with a PNG Blob of the canvas as it was', function (t) {
  const canvas = createContext.createCanvas(1, 1)
  const gl = canvas.getContext('webgl')
  gl.clearColor(1, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  let returned = false
  canvas.toBlob(async function (blob) {
    t.ok(returned, 'it calls back after toBlob returns, as in browsers')
    t.ok(blob instanceof Blob, 'with a Blob')
    t.equal(blob.type, 'image/png', 'of a PNG, even when asked for another type')
    const image = decodePNG(Buffer.from(await blob.arrayBuffer()))
    t.deepEqual(imagePixel(image, 0, 0), [255, 0, 0, 255], 'of the canvas when toBlob was called')
    destroy(gl)
    t.end()
  }, 'image/webp')
  returned = true
  gl.clearColor(0, 0, 1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
})

tape('canvas: toBlob calls back with null when the canvas has no pixels', function (t) {
  let returned = false
  createContext.createCanvas(0, 1).toBlob(function (blob) {
    t.ok(returned, 'later too')
    t.equal(blob, null, 'as in browsers')
    t.end()
  })
  returned = true
})

tape('canvas: toBlob needs a callback', function (t) {
  t.throws(() => createContext.createCanvas(1, 1).toBlob(), TypeError, 'or throws a TypeError')
  t.end()
})

tape('canvas: convertToBlob resolves to a PNG Blob of the canvas as it was', async function (t) {
  const canvas = createContext.createCanvas(1, 1)
  const gl = canvas.getContext('webgl')
  gl.clearColor(1, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  const pending = canvas.convertToBlob({ type: 'image/jpeg', quality: 0.5 })
  gl.clearColor(0, 0, 1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  const blob = await pending
  t.ok(blob instanceof Blob, 'it resolves to a Blob')
  t.equal(blob.type, 'image/png', 'of a PNG, even when asked for another type')
  t.deepEqual(imagePixel(decodePNG(Buffer.from(await blob.arrayBuffer())), 0, 0), [255, 0, 0, 255], 'of the canvas when convertToBlob was called')
  destroy(gl)

  try {
    await createContext.createCanvas(0, 1).convertToBlob()
    t.fail('a canvas without pixels should reject')
  } catch (error) {
    t.ok(error instanceof DOMException, 'a canvas without pixels rejects with a DOMException')
    t.equal(error.name, 'IndexSizeError', 'named IndexSizeError, as on an OffscreenCanvas')
  }
})

tape('canvas: style is an object that nothing reads', function (t) {
  const canvas = createContext.createCanvas(2, 2)
  const gl = canvas.getContext('webgl')
  // What three.js's setSize does.
  canvas.width = 6
  canvas.height = 4
  canvas.style.width = '3px'
  canvas.style.height = '2px'
  t.deepEqual([gl.drawingBufferWidth, gl.drawingBufferHeight], [6, 4], 'setting it doesn\'t change the drawing buffer')
  t.deepEqual(canvas.style, { width: '3px', height: '2px' }, 'it keeps what\'s set')
  t.notEqual(createContext.createCanvas(1, 1).style, canvas.style, 'and each canvas has its own')
  destroy(gl)
  t.end()
})
