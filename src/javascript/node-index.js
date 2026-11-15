const { createContextFor, flag } = require('./create-context')
const { HeadlessCanvas } = require('./headless-canvas')

function createContext (width, height, attributes, options) {
  if (!((width | 0) > 0 && (height | 0) > 0)) {
    throw new RangeError(`Error creating WebGLContext: width and height must be at least 1, got ${width} and ${height}.`)
  }
  const canvas = new HeadlessCanvas(width | 0, height | 0)
  return createContextFor(canvas, attributes, flag(options, 'createWebGL2Context', false))
}

module.exports = createContext
