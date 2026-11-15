// A Node project without the DOM types, importing gl as an ES module.
import createGL, { createCanvas, HeadlessCanvas, WebGLContextEvent, WebGLRenderingContext, WebGL2RenderingContext } from 'gl'
import type { GLenum, WebGLTexture } from 'gl'

const gl = createGL(1, 1)
gl.clearColor(1, 0, 0, 1)
const texture: WebGLTexture | null = gl.createTexture()
const target: GLenum = gl.TEXTURE_2D
gl.bindTexture(target, texture)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, { width: 1, height: 1, data: new Uint8Array(4) })
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
gl.getExtension('STACKGL_resize_drawingbuffer').resize(2, 2)
const mirrorClamp: number | undefined = gl.getExtension('EXT_texture_mirror_clamp_to_edge')?.MIRROR_CLAMP_TO_EDGE_EXT
const depthClamp: number | undefined = gl.getExtension('EXT_depth_clamp')?.DEPTH_CLAMP_EXT
// @ts-expect-error getExtension returns null for unsupported extensions, including those the DOM types don't declare.
gl.getExtension('EXT_texture_mirror_clamp_to_edge').MIRROR_CLAMP_TO_EDGE_EXT

gl.canvas.width = 2
const canvasHeight: number = gl.canvas.height
const dataURL: string = gl.canvas.toDataURL()
gl.canvas.addEventListener('webglcontextlost', (event) => event.preventDefault())
// @ts-expect-error The canvas has no DOM layout members.
gl.canvas.getBoundingClientRect()

const canvas: HeadlessCanvas = createCanvas(2, 2)
const fromCanvas: WebGL2RenderingContext | null = canvas.getContext('webgl2', { alpha: false })
const fromCanvas1: WebGLRenderingContext | null = canvas.getContext('experimental-webgl')
// @ts-expect-error getContext returns null when it can't create the context.
const notNull: WebGL2RenderingContext = canvas.getContext('webgl2')
canvas.addEventListener('webglcontextcreationerror', (event) => {
  const message: string = event.statusMessage
})
const isCanvas: boolean = canvas instanceof HeadlessCanvas
const event: WebGLContextEvent = new WebGLContextEvent('webglcontextcreationerror', { statusMessage: 'No GPU.' })
canvas.dispatchEvent(event)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.canvas)
// @ts-expect-error WebGL1 contexts have no WebGL2 methods.
gl.createVertexArray()

const gl2 = createGL(1, 1, { alpha: false }, { createWebGL2Context: true })
// @ts-expect-error createWebGL2Context isn't a context attribute.
createGL(1, 1, { createWebGL2Context: true })
gl2.bindVertexArray(gl2.createVertexArray())
const texture3D: number = WebGL2RenderingContext.TEXTURE_3D
const textureCube: number = WebGLRenderingContext.TEXTURE_CUBE_MAP
// @ts-expect-error The classes have the constants but not the methods.
WebGLRenderingContext.clearColor(1, 0, 0, 1)

const unknownContext: unknown = gl2
if (unknownContext instanceof WebGL2RenderingContext) {
  unknownContext.texStorage3D(texture3D, 1, unknownContext.RGBA8, 1, 1, 1)
}

// @ts-expect-error The DOM types aren't part of the project.
document.title

gl.getExtension('STACKGL_destroy_context').destroy()
gl2.getExtension('STACKGL_destroy_context').destroy()

export { textureCube, mirrorClamp, depthClamp }
