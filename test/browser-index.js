'use strict'

const tape = require('tape')
const createContext = require('../src/javascript/browser-index')

// Gives a stand-in canvas the methods createContext uses: its getContext calls createGL(type, options, canvas, listeners).
function fakeCanvas (canvas, createGL) {
  const listeners = {}
  canvas.addEventListener = function (type, listener) {
    listeners[type] = listener
  }
  canvas.removeEventListener = function (type) {
    delete listeners[type]
  }
  canvas.getContext = function (type, options) {
    return createGL(type, options, canvas, listeners)
  }
  return canvas
}

// A stand-in for the DOM.
function withDocument (createGL, test) {
  global.document = {
    createElement: function () {
      return fakeCanvas({ width: 300, height: 150 }, createGL)
    }
  }
  try {
    test()
  } finally {
    delete global.document
  }
}

// A stand-in for a worker, which has OffscreenCanvas but no document.
function withOffscreenCanvas (createGL, test) {
  global.OffscreenCanvas = class OffscreenCanvas {
    constructor (width, height) {
      this.width = width
      this.height = height
      fakeCanvas(this, createGL)
    }
  }
  try {
    test()
  } finally {
    delete global.OffscreenCanvas
  }
}

function fakeGL (type, options, canvas) {
  return {
    type,
    options,
    canvas,
    getExtension: function () {
      return null
    },
    getSupportedExtensions: function () {
      return ['OES_texture_float']
    }
  }
}

tape('browser: create context', function (t) {
  withDocument(function (type, options, canvas) {
    return fakeGL(type, options, canvas)
  }, function () {
    const gl = createContext(10, 20)
    t.equal(gl.type, 'webgl')
    t.equal(gl.canvas.width, 10)
    t.equal(gl.canvas.height, 20)
    t.deepEqual(gl.getSupportedExtensions(), ['OES_texture_float', 'STACKGL_destroy_context', 'STACKGL_resize_drawingbuffer'])
    gl.getExtension('STACKGL_resize_drawingbuffer').resize(30, 40)
    t.equal(gl.canvas.width, 30)
    t.equal(gl.canvas.height, 40)

    const gl2 = createContext(10, 20, { alpha: false }, { createWebGL2Context: true })
    t.equal(gl2.type, 'webgl2')
    t.deepEqual(gl2.options, { alpha: false }, 'getContext gets only the context attributes')
  })
  t.end()
})

tape('browser: create context in a worker, with an OffscreenCanvas', function (t) {
  withOffscreenCanvas(function (type, options, canvas) {
    return fakeGL(type, options, canvas)
  }, function () {
    const gl = createContext(10, 20)
    t.equal(gl.type, 'webgl')
    t.ok(gl.canvas instanceof global.OffscreenCanvas, 'the canvas is an OffscreenCanvas')
    t.equal(gl.canvas.width, 10)
    t.equal(gl.canvas.height, 20)
    gl.getExtension('STACKGL_resize_drawingbuffer').resize(30, 40)
    t.equal(gl.canvas.width, 30)
    t.equal(gl.canvas.height, 40)
    t.equal(createContext(10, 20, {}, { createWebGL2Context: true }).type, 'webgl2')
  })
  t.end()
})

tape('browser: create context with an invalid size', function (t) {
  t.throws(() => createContext(0, 10), RangeError)
  t.throws(() => createContext(10, -1), RangeError)
  t.throws(() => createContext(NaN, 10), RangeError)
  t.end()
})

tape('browser: create context when the browser refuses', function (t) {
  withDocument(function (type, options, canvas, listeners) {
    listeners.webglcontextcreationerror({ statusMessage: 'WebGL is disabled.' })
    return null
  }, function () {
    try {
      createContext(10, 10)
      t.fail('should throw')
    } catch (error) {
      t.equal(error.code, 'HEADLESS_GL_CONTEXT_CREATION_FAILED')
      t.equal(error.message, 'Error creating WebGLContext: WebGL is disabled.')
    }
  })

  withDocument(function () {
    return null
  }, function () {
    t.throws(() => createContext(10, 10), /^Error: Error creating WebGLContext$/)
  })
  t.end()
})

tape('browser: createCanvas returns the browser\'s canvas without a context', function (t) {
  withDocument(function (type, options, canvas) {
    return fakeGL(type, options, canvas)
  }, function () {
    const canvas = createContext.createCanvas(10, 20)
    t.deepEqual([canvas.width, canvas.height], [10, 20], 'a <canvas> of the size it\'s given')
    t.equal(canvas.getContext('webgl2').type, 'webgl2', 'whose getContext gives the browser\'s context')
  })
  withOffscreenCanvas(function (type, options, canvas) {
    return fakeGL(type, options, canvas)
  }, function () {
    const canvas = createContext.createCanvas(10, 20)
    t.ok(canvas instanceof global.OffscreenCanvas, 'or an OffscreenCanvas in a worker')
    t.deepEqual([canvas.width, canvas.height], [10, 20], 'of the size it\'s given')
  })
  t.end()
})
