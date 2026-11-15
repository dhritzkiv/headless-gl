const { createContextFor, flag } = require('./create-context')
const { HeadlessCanvas, WebGLContextEvent } = require('./headless-canvas')

function createContext (width, height, attributes, options) {
  if (!((width | 0) > 0 && (height | 0) > 0)) {
    throw new RangeError(`Error creating WebGLContext: width and height must be at least 1, got ${width} and ${height}.`)
  }
  const canvas = new HeadlessCanvas(width | 0, height | 0)
  return createContextFor(canvas, attributes, flag(options, 'createWebGL2Context', false))
}

// Creates a canvas without a context, which getContext gives it, as on an OffscreenCanvas.
function createCanvas (width, height) {
  return new HeadlessCanvas(width, height)
}

module.exports = createContext
module.exports.createCanvas = createCanvas
module.exports.HeadlessCanvas = HeadlessCanvas
module.exports.WebGLContextEvent = WebGLContextEvent
