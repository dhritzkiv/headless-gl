// A project with the DOM types that passes a context to code expecting the DOM's WebGLRenderingContext.
import createGL, { type HeadlessCanvas } from 'gl'

declare function useContext (context: WebGLRenderingContext): void

const gl = createGL(1, 1)
// @ts-expect-error headless-gl's contexts aren't the DOM's without a cast or CustomContextTypes.
useContext(gl)
useContext(gl as WebGLRenderingContext)

const gl2 = createGL(1, 1, {}, { createWebGL2Context: true })
const context2: WebGL2RenderingContext = gl2 as WebGL2RenderingContext

// With the DOM types, the canvas's listeners get the DOM's Event.
gl.canvas.addEventListener('webglcontextlost', (event: Event) => event.preventDefault())
gl.canvas.addEventListener('webglcontextcreationerror', (event) => {
  const domEvent: Event = event
  const message: string = event.statusMessage
})
// @ts-expect-error A context's canvas is typed without convertToBlob, so that contexts can be cast to the DOM's types.
gl.canvas.convertToBlob()
const domBlob: Promise<Blob> = (gl.canvas as HeadlessCanvas).convertToBlob()

// DOM sources with a 2D context or pixel data still work as texture sources.
const canvas = document.createElement('canvas')
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, new ImageData(1, 1))

export { context2 }
