import type { Plot3D } from './types'

export const measurePlotDistance = (a: Plot3D, b: Plot3D): number => {
  const axes = ['x', 'y', 'z'] as const
  let distance = 0
  for (const axis of axes) {
    const delta = Math.abs((a[axis].descriptors.length || 1) - (b[axis].descriptors.length || 1))
    distance += delta
  }
  return distance
}
