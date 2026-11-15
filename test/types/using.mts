// A Node project whose types declare Symbol.dispose, freeing a canvas's context with a using declaration.
import { createCanvas } from 'gl'

export function draw (): void {
  using canvas = createCanvas(1, 1)
  canvas.getContext('webgl')?.clearColor(1, 0, 0, 1)
}
