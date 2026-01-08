export interface PlotAxis {
  label: string
  descriptors: string[]
}

export interface Plot3D {
  x: PlotAxis
  y: PlotAxis
  z: PlotAxis
  notes?: string
}
