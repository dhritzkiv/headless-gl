// headless-gl declares its own WebGL types, so projects don't need TypeScript's DOM types. Its contexts' canvas is a ContextCanvas, they don't have the browser's color space members, and texture uploads take a TexImageSource as declared below instead of DOM elements.
// To use a context where the DOM's WebGLRenderingContext is expected, cast it with `gl as WebGLRenderingContext`, or retype every context through CustomContextTypes.
import type * as WebGL from './webgl';

declare namespace createContext {
  // The WebGL declarations, copied from TypeScript's DOM types into webgl.d.ts by scripts/webgl-types.js, which checks that this list is complete.
  type ANGLE_instanced_arrays = WebGL.ANGLE_instanced_arrays;
  type AllowSharedBufferSource = WebGL.AllowSharedBufferSource;
  type EXT_blend_minmax = WebGL.EXT_blend_minmax;
  type EXT_color_buffer_float = WebGL.EXT_color_buffer_float;
  type EXT_color_buffer_half_float = WebGL.EXT_color_buffer_half_float;
  type EXT_float_blend = WebGL.EXT_float_blend;
  type EXT_frag_depth = WebGL.EXT_frag_depth;
  type EXT_sRGB = WebGL.EXT_sRGB;
  type EXT_shader_texture_lod = WebGL.EXT_shader_texture_lod;
  type EXT_texture_compression_bptc = WebGL.EXT_texture_compression_bptc;
  type EXT_texture_compression_rgtc = WebGL.EXT_texture_compression_rgtc;
  type EXT_texture_filter_anisotropic = WebGL.EXT_texture_filter_anisotropic;
  type Float32List = WebGL.Float32List;
  type GLbitfield = WebGL.GLbitfield;
  type GLboolean = WebGL.GLboolean;
  type GLclampf = WebGL.GLclampf;
  type GLenum = WebGL.GLenum;
  type GLfloat = WebGL.GLfloat;
  type GLint = WebGL.GLint;
  type GLint64 = WebGL.GLint64;
  type GLintptr = WebGL.GLintptr;
  type GLsizei = WebGL.GLsizei;
  type GLsizeiptr = WebGL.GLsizeiptr;
  type GLuint = WebGL.GLuint;
  type GLuint64 = WebGL.GLuint64;
  type HeadlessWebGL2RenderingContext = WebGL.HeadlessWebGL2RenderingContext;
  type HeadlessWebGLRenderingContext = WebGL.HeadlessWebGLRenderingContext;
  type Int32List = WebGL.Int32List;
  type KHR_parallel_shader_compile = WebGL.KHR_parallel_shader_compile;
  type OES_element_index_uint = WebGL.OES_element_index_uint;
  type OES_fbo_render_mipmap = WebGL.OES_fbo_render_mipmap;
  type OES_standard_derivatives = WebGL.OES_standard_derivatives;
  type OES_texture_float = WebGL.OES_texture_float;
  type OES_texture_float_linear = WebGL.OES_texture_float_linear;
  type OES_texture_half_float = WebGL.OES_texture_half_float;
  type OES_texture_half_float_linear = WebGL.OES_texture_half_float_linear;
  type OES_vertex_array_object = WebGL.OES_vertex_array_object;
  type OVR_multiview2 = WebGL.OVR_multiview2;
  type Uint32List = WebGL.Uint32List;
  type WEBGL_color_buffer_float = WebGL.WEBGL_color_buffer_float;
  type WEBGL_compressed_texture_astc = WebGL.WEBGL_compressed_texture_astc;
  type WEBGL_compressed_texture_etc = WebGL.WEBGL_compressed_texture_etc;
  type WEBGL_compressed_texture_etc1 = WebGL.WEBGL_compressed_texture_etc1;
  type WEBGL_compressed_texture_pvrtc = WebGL.WEBGL_compressed_texture_pvrtc;
  type WEBGL_compressed_texture_s3tc = WebGL.WEBGL_compressed_texture_s3tc;
  type WEBGL_compressed_texture_s3tc_srgb = WebGL.WEBGL_compressed_texture_s3tc_srgb;
  type WEBGL_debug_renderer_info = WebGL.WEBGL_debug_renderer_info;
  type WEBGL_debug_shaders = WebGL.WEBGL_debug_shaders;
  type WEBGL_depth_texture = WebGL.WEBGL_depth_texture;
  type WEBGL_draw_buffers = WebGL.WEBGL_draw_buffers;
  type WEBGL_lose_context = WebGL.WEBGL_lose_context;
  type WEBGL_multi_draw = WebGL.WEBGL_multi_draw;
  type WebGL2RenderingContextBase = WebGL.WebGL2RenderingContextBase;
  type WebGL2RenderingContextConstants = WebGL.WebGL2RenderingContextConstants;
  type WebGL2RenderingContextOverloads = WebGL.WebGL2RenderingContextOverloads;
  type WebGLActiveInfo = WebGL.WebGLActiveInfo;
  type WebGLBuffer = WebGL.WebGLBuffer;
  type WebGLContextAttributes = WebGL.WebGLContextAttributes;
  type WebGLFramebuffer = WebGL.WebGLFramebuffer;
  type WebGLPowerPreference = WebGL.WebGLPowerPreference;
  type WebGLProgram = WebGL.WebGLProgram;
  type WebGLQuery = WebGL.WebGLQuery;
  type WebGLRenderbuffer = WebGL.WebGLRenderbuffer;
  type WebGLRenderingContextBase = WebGL.WebGLRenderingContextBase;
  type WebGLRenderingContextConstants = WebGL.WebGLRenderingContextConstants;
  type WebGLRenderingContextOverloads = WebGL.WebGLRenderingContextOverloads;
  type WebGLSampler = WebGL.WebGLSampler;
  type WebGLShader = WebGL.WebGLShader;
  type WebGLShaderPrecisionFormat = WebGL.WebGLShaderPrecisionFormat;
  type WebGLSync = WebGL.WebGLSync;
  type WebGLTexture = WebGL.WebGLTexture;
  type WebGLTransformFeedback = WebGL.WebGLTransformFeedback;
  type WebGLUniformLocation = WebGL.WebGLUniformLocation;
  type WebGLVertexArrayObject = WebGL.WebGLVertexArrayObject;
  type WebGLVertexArrayObjectOES = WebGL.WebGLVertexArrayObjectOES;

  /**
   * What texImage2D, texSubImage2D and texSubImage3D accept in place of a typed array: an object with pixel data, like ImageData, an object with a 2D context, like a node-canvas Canvas, or a HeadlessCanvas, whose drawing buffer is taken as an image. Another library's canvas whose getContext returns a headless-gl context also works, once its getContext('2d') returns null.
   * Pixel data in a Uint8Array or Uint8ClampedArray is taken to be RGBA with 8 bits per channel, and converted to the upload's format and type as browsers convert images. Pixel data in other typed arrays is uploaded as it is.
   */
  type TexImageSource = TexImageData | TexImageCanvas | ContextCanvas;

  interface TexImageData {
    readonly width: number;
    readonly height: number;
    readonly data: ArrayBufferView;
  }

  interface TexImageCanvas {
    readonly width: number;
    readonly height: number;
    getContext(contextId: "2d"): { getImageData(sx: number, sy: number, sw: number, sh: number): TexImageData } | null;
  }

  /**
   * An event, as the DOM's or Node's types declare it, or the members every event has when the project has neither.
   */
  type CanvasEvent = typeof globalThis extends { Event: { prototype: infer E } } ? E : {
    readonly type: string;
    readonly defaultPrevented: boolean;
    preventDefault(): void;
  };

  type CanvasEventListener = ((event: CanvasEvent) => void) | { handleEvent(event: CanvasEvent): void };

  /**
   * The event a canvas fires when getContext can't create a context, as browsers' WebGLContextEvent. Its statusMessage gives the reason.
   */
  type WebGLContextEvent = CanvasEvent & { readonly statusMessage: string };

  type WebGLContextEventListener = ((event: WebGLContextEvent) => void) | { handleEvent(event: WebGLContextEvent): void };

  interface WebGLContextEventInit {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
    statusMessage?: string;
  }

  const WebGLContextEvent: {
    readonly prototype: WebGLContextEvent;
    new(type: string, eventInit?: WebGLContextEventInit): WebGLContextEvent;
  };

  /**
   * An AbortSignal, as the DOM's or Node's types declare it, or the member every signal has when the project has neither.
   */
  type CanvasAbortSignal = typeof globalThis extends { AbortSignal: { prototype: infer S } } ? S : { readonly aborted: boolean };

  /**
   * A Blob, as the DOM's or Node's types declare it, or the members toBlob and convertToBlob's results have when the project has neither.
   */
  type CanvasBlob = typeof globalThis extends { Blob: { prototype: infer B } } ? B : {
    readonly size: number;
    readonly type: string;
    arrayBuffer(): Promise<ArrayBuffer>;
  };

  /**
   * [Symbol.dispose], when the project's types declare Symbol.dispose, as TypeScript's esnext.disposable library and Node's types do.
   */
  type CanvasDisposal = SymbolConstructor extends { readonly dispose: infer D extends symbol } ? { [K in D]: () => void } : {};

  type CanvasEventListenerOptions = boolean | { capture?: boolean; once?: boolean; passive?: boolean; signal?: CanvasAbortSignal };

  /**
   * A context's canvas, as `gl.canvas` types it. It's a HeadlessCanvas, typed without convertToBlob, which a DOM `<canvas>` doesn't have, so that contexts can still be cast to the DOM's context types. Cast it to HeadlessCanvas to call convertToBlob. It's an EventTarget.
   */
  interface ContextCanvas {
    /**
     * Setting it resizes the context's drawing buffer and clears it, even when the width doesn't change, as in browsers. A canvas 0 wide has a drawing buffer 1 wide.
     * @throws {TypeError} when set to something that isn't an integer from 0 to `Number.MAX_SAFE_INTEGER`, as on an OffscreenCanvas.
     */
    width: number;
    /**
     * Setting it resizes the context's drawing buffer and clears it, even when the height doesn't change, as in browsers. A canvas 0 high has a drawing buffer 1 high.
     * @throws {TypeError} when set to something that isn't an integer from 0 to `Number.MAX_SAFE_INTEGER`, as on an OffscreenCanvas.
     */
    height: number;
    /**
     * An object that nothing reads, for code that styles a canvas as it resizes it, as three.js's setSize does. It keeps whatever is set on it, but is typed with only the width and height that three.js sets, since a DOM CSSStyleDeclaration can't be cast to a type with an index signature.
     */
    readonly style: { width?: string; height?: string };
    /**
     * Creates the canvas's context the first time, as a `<canvas>` does: `'webgl'` and the legacy `'experimental-webgl'` give a WebGL1 context, and `'webgl2'` a WebGL2 one. Later calls return that context, or null for the other version, and only the first call's attributes count. Other ids give null.
     * When the context can't be created, it fires `webglcontextcreationerror` with the reason in its `statusMessage`, and returns null.
     * @throws {TypeError} for an invalid powerPreference.
     */
    getContext(contextId: "webgl" | "experimental-webgl", contextAttributes?: ContextAttributes): WebGLRenderingContext | null;
    getContext(contextId: "webgl2", contextAttributes?: ContextAttributes): WebGL2RenderingContext | null;
    getContext(contextId: string, contextAttributes?: ContextAttributes): WebGLRenderingContext | WebGL2RenderingContext | null;
    /**
     * Encodes the drawing buffer as a PNG data URL, top row first and with alpha not premultiplied. Other image types give a PNG too, as browsers do for types they don't support. A canvas with no pixels gives `"data:,"`.
     */
    toDataURL(type?: string, quality?: unknown): string;
    /**
     * Calls back on a later turn of the event loop with the same PNG as toDataURL's in a Blob, as a `<canvas>` does, encoded without blocking the event loop. It takes the canvas as it is when called. A canvas with no pixels gives null.
     */
    toBlob(callback: (blob: CanvasBlob | null) => void, type?: string, quality?: unknown): void;
    addEventListener(type: "webglcontextcreationerror" | "webglcontextlost" | "webglcontextrestored", listener: WebGLContextEventListener | null, options?: CanvasEventListenerOptions): void;
    addEventListener(type: string, listener: CanvasEventListener | null, options?: CanvasEventListenerOptions): void;
    removeEventListener(type: "webglcontextcreationerror" | "webglcontextlost" | "webglcontextrestored", listener: WebGLContextEventListener | null, options?: boolean | { capture?: boolean }): void;
    removeEventListener(type: string, listener: CanvasEventListener | null, options?: boolean | { capture?: boolean }): void;
    dispatchEvent(event: CanvasEvent): boolean;
  }

  /**
   * A canvas for a WebGL context, from createCanvas. Contexts' canvases are HeadlessCanvases too.
   * Its [Symbol.dispose] destroys its context, so `using canvas = createCanvas(width, height)` frees the context when the block ends.
   */
  interface HeadlessCanvas extends ContextCanvas, CanvasDisposal {
    /**
     * Resolves to the same PNG as toDataURL's in a Blob, as an OffscreenCanvas does, encoded without blocking the event loop. It takes the canvas as it is when called. A canvas with no pixels rejects with an `IndexSizeError` DOMException.
     */
    convertToBlob(options?: { type?: string; quality?: number }): Promise<CanvasBlob>;
  }

  /**
   * The class of canvases, for instanceof checks. Constructing one is the same as calling createCanvas.
   */
  const HeadlessCanvas: {
    readonly prototype: HeadlessCanvas;
    new(width: number, height: number): HeadlessCanvas;
  };

  /**
   * Creates a canvas without a context, which its getContext creates, as on an OffscreenCanvas.
   * @throws {TypeError} if `width` or `height` isn't an integer from 0 to `Number.MAX_SAFE_INTEGER`.
   */
  function createCanvas(width: number, height: number): HeadlessCanvas;

  interface STACKGL_destroy_context {
    destroy(): void;
  }

  interface STACKGL_resize_drawingbuffer {
    resize(width: GLint, height: GLint): void;
  }

  interface StackGLExtension {
    getExtension(extensionName: "STACKGL_destroy_context"): STACKGL_destroy_context;
    getExtension(extensionName: "STACKGL_resize_drawingbuffer"): STACKGL_resize_drawingbuffer;
  }

  interface EXT_depth_clamp {
    readonly DEPTH_CLAMP_EXT: 0x864F;
  }

  interface EXT_texture_mirror_clamp_to_edge {
    readonly MIRROR_CLAMP_TO_EDGE_EXT: 0x8743;
  }

  /**
   * getExtension for the extensions headless-gl supports that TypeScript's DOM types don't declare yet.
   */
  interface SupplementalExtensions {
    getExtension(extensionName: "EXT_depth_clamp"): EXT_depth_clamp | null;
    getExtension(extensionName: "EXT_texture_mirror_clamp_to_edge"): EXT_texture_mirror_clamp_to_edge | null;
  }

  /**
   * Add WebGLRenderingContext and WebGL2RenderingContext properties to this interface to retype every context that createContext returns, for example as the DOM's types:
   *
   * ```ts
   * declare module 'gl' {
   *   interface CustomContextTypes {
   *     WebGLRenderingContext: globalThis.WebGLRenderingContext;
   *     WebGL2RenderingContext: globalThis.WebGL2RenderingContext;
   *   }
   * }
   * ```
   */
  interface CustomContextTypes {}

  type WebGLRenderingContext = (CustomContextTypes extends { WebGLRenderingContext: infer T } ? T : HeadlessWebGLRenderingContext) & StackGLExtension & SupplementalExtensions;

  type WebGL2RenderingContext = (CustomContextTypes extends { WebGL2RenderingContext: infer T } ? T : HeadlessWebGL2RenderingContext) & StackGLExtension & SupplementalExtensions;

  /**
   * The class of WebGL1 contexts, for instanceof checks. It can't be constructed directly.
   */
  const WebGLRenderingContext: WebGLRenderingContextConstants & {
    readonly prototype: WebGLRenderingContext;
    new(): never;
  };

  /**
   * The class of WebGL2 contexts, for instanceof checks. It can't be constructed directly.
   */
  const WebGL2RenderingContext: WebGL2RenderingContextConstants & {
    readonly prototype: WebGL2RenderingContext;
    new(): never;
  };

  /**
   * The WebGL context attributes. Only alpha, depth and stencil have an effect: antialias is always off, and the others are only reported by getContextAttributes. Nothing composites the drawing buffer in Node, so it's always preserved whatever preserveDrawingBuffer is.
   */
  type ContextAttributes = WebGLContextAttributes;

  /**
   * How to create the context, apart from its attributes.
   */
  interface Options {
    /**
     * Creates a WebGL2 context when it's true.
     */
    createWebGL2Context?: boolean;
  }
}

/**
 * @throws {Error} with the code `HEADLESS_GL_CONTEXT_CREATION_FAILED` if the context can't be created, for example when the ANGLE libraries can't be loaded.
 * @throws {RangeError} if `width` or `height` is less than 1.
 */
declare function createContext(
  width: number,
  height: number,
  contextAttributes?: createContext.ContextAttributes,
  options?: createContext.Options & { createWebGL2Context?: false },
): createContext.WebGLRenderingContext;

/**
 * @throws {Error} with the code `HEADLESS_GL_CONTEXT_CREATION_FAILED` if the context can't be created, for example when the ANGLE libraries can't be loaded.
 * @throws {RangeError} if `width` or `height` is less than 1.
 */
declare function createContext(
  width: number,
  height: number,
  contextAttributes: createContext.ContextAttributes | undefined,
  options: createContext.Options & { createWebGL2Context: true }
): createContext.WebGL2RenderingContext;

/**
 * @throws {Error} with the code `HEADLESS_GL_CONTEXT_CREATION_FAILED` if the context can't be created, for example when the ANGLE libraries can't be loaded.
 * @throws {RangeError} if `width` or `height` is less than 1.
 */
declare function createContext(
  width: number,
  height: number,
  contextAttributes?: createContext.ContextAttributes,
  options?: createContext.Options
): createContext.WebGLRenderingContext | createContext.WebGL2RenderingContext;

export = createContext;
