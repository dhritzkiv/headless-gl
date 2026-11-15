const { createContextFor } = require('./create-context')
const { encodePNG } = require('./png')
const { WebGL2RenderingContext, canvasImage, unwrapContext } = require('./webgl-rendering-context')

// The context ids getContext takes, as a <canvas> does, and whether each makes a WebGL2 context.
const CONTEXT_IDS = new Map([['webgl', false], ['experimental-webgl', false], ['webgl2', true]])

// Converts a size as WebIDL's [EnforceRange] unsigned long long does, which is how OffscreenCanvas takes them: NaN, the infinities and sizes out of range throw a TypeError, and other numbers are truncated.
function toCanvasSize (value, name) {
  const size = Math.trunc(+value)
  if (!(size >= 0 && size <= Number.MAX_SAFE_INTEGER)) {
    throw new TypeError(`HeadlessCanvas ${name} must be an integer from 0 to ${Number.MAX_SAFE_INTEGER}, got ${String(value)}.`)
  }
  // Truncating -0.5 gives -0.
  return size + 0
}

// The event a canvas fires when getContext can't create a context, as browsers' WebGLContextEvent.
class WebGLContextEvent extends Event {
  constructor (type, eventInit) {
    super(type, eventInit)
    this._statusMessage = eventInit && eventInit.statusMessage !== undefined ? `${eventInit.statusMessage}` : ''
  }

  get statusMessage () {
    return this._statusMessage
  }
}

// A canvas for a WebGL context, from createCanvas, or a context's canvas, which gl.canvas returns. As in browsers, setting its width or height resizes the context's drawing buffer and clears it.
class HeadlessCanvas extends EventTarget {
  constructor (width, height) {
    super()
    this._width = toCanvasSize(width, 'width')
    this._height = toCanvasSize(height, 'height')
    // The context's wrapper, which gl.canvas is called on. It isn't enumerable, so code that walks a context's properties, such as the conformance tests' argument printer, doesn't walk into the wrapper's constants and methods.
    Object.defineProperty(this, '_context', { value: null, writable: true })
  }

  get width () {
    return this._width
  }

  set width (value) {
    this._width = toCanvasSize(value, 'width')
    this._resetDrawingBuffer()
  }

  get height () {
    return this._height
  }

  set height (value) {
    this._height = toCanvasSize(value, 'height')
    this._resetDrawingBuffer()
  }

  // As a <canvas> does, it returns null for a context id it doesn't support, and for the other WebGL version once the canvas has a context, which only the first call's attributes create.
  // When the context can't be created, it fires webglcontextcreationerror with the reason, before returning null, and a later call tries again.
  getContext (contextId, attributes) {
    if (arguments.length === 0) {
      throw new TypeError('HeadlessCanvas getContext needs a context id.')
    }
    const createWebGL2Context = CONTEXT_IDS.get(`${contextId}`)
    if (createWebGL2Context === undefined) {
      return null
    }
    if (this._context) {
      return (this._context instanceof WebGL2RenderingContext) === createWebGL2Context ? this._context : null
    }
    try {
      return this._createContext(attributes, createWebGL2Context)
    } catch (error) {
      if (error.code !== 'HEADLESS_GL_CONTEXT_CREATION_FAILED') {
        throw error
      }
      this.dispatchEvent(new WebGLContextEvent('webglcontextcreationerror', { statusMessage: error.message, cancelable: true }))
      return null
    }
  }

  // Always a PNG, which browsers also give for an image type they don't support, so the type and quality are ignored. A canvas without pixels gives "data:,", as in browsers, and so does one too large to hold in memory.
  toDataURL (type, quality) {
    if (this._width === 0 || this._height === 0) {
      return 'data:,'
    }
    let image
    try {
      image = this[canvasImage]()
    } catch (error) {
      if (error instanceof RangeError) {
        return 'data:,'
      }
      throw error
    }
    return `data:image/png;base64,${encodePNG(image.width, image.height, image.data).toString('base64')}`
  }

  // Throws an Error with the code HEADLESS_GL_CONTEXT_CREATION_FAILED when the context can't be created.
  _createContext (attributes, createWebGL2Context) {
    return createContextFor(this, attributes, createWebGL2Context)
  }

  // The canvas's pixels as ImageData holds them, for toDataURL and texture uploads: its context's drawing buffer, or transparent black before it has a context.
  [canvasImage] () {
    if (this._context) {
      return unwrapContext(this._context)._drawingBufferImage()
    }
    return { width: this._width, height: this._height, data: new Uint8ClampedArray(this._width * this._height * 4) }
  }

  _resetDrawingBuffer () {
    if (this._context) {
      unwrapContext(this._context)._resetDrawingBuffer(this._width, this._height)
    }
  }
}

// As in browsers, so Object.prototype.toString reports [object HeadlessCanvas] and [object WebGLContextEvent] rather than EventTarget's and Event's tags.
for (const Class of [HeadlessCanvas, WebGLContextEvent]) {
  Object.defineProperty(Class.prototype, Symbol.toStringTag, { value: Class.name, configurable: true })
}

module.exports = { HeadlessCanvas, WebGLContextEvent }
