const { encodePNG } = require('./png')
const { unwrapContext } = require('./webgl-rendering-context')

// Converts a size as WebIDL's [EnforceRange] unsigned long long does, which is how OffscreenCanvas takes them: NaN, the infinities and sizes out of range throw a TypeError, and other numbers are truncated.
function toCanvasSize (value, name) {
  const size = Math.trunc(+value)
  if (!(size >= 0 && size <= Number.MAX_SAFE_INTEGER)) {
    throw new TypeError(`HeadlessCanvas ${name} must be an integer from 0 to ${Number.MAX_SAFE_INTEGER}, got ${String(value)}.`)
  }
  // Truncating -0.5 gives -0.
  return size + 0
}

// The canvas of a context, which gl.canvas returns. As in browsers, setting its width or height resizes the context's drawing buffer and clears it.
class HeadlessCanvas extends EventTarget {
  constructor (width, height) {
    super()
    this._width = width
    this._height = height
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

  // Always a PNG, which browsers also give for an image type they don't support, so the type and quality are ignored. A canvas without pixels gives "data:,", as in browsers.
  toDataURL (type, quality) {
    if (this._width === 0 || this._height === 0) {
      return 'data:,'
    }
    const { width, height, data } = unwrapContext(this._context)._drawingBufferImage()
    return `data:image/png;base64,${encodePNG(width, height, data).toString('base64')}`
  }

  _resetDrawingBuffer () {
    unwrapContext(this._context)._resetDrawingBuffer(this._width, this._height)
  }
}

// As in browsers, so Object.prototype.toString reports [object HeadlessCanvas] rather than EventTarget's tag.
Object.defineProperty(HeadlessCanvas.prototype, Symbol.toStringTag, { value: 'HeadlessCanvas', configurable: true })

module.exports = { HeadlessCanvas }
