import type { Plot3D } from './types'
import type { SoulCore } from '../soulcore/types'

export const buildPlot3D = (soulCore: SoulCore): Plot3D => ({
  x: {
    label: 'Character',
    descriptors: soulCore.seedFacts.slice(0, 3),
  },
  y: {
    label: 'World',
    descriptors: soulCore.constraints.slice(0, 3),
  },
  z: {
    label: 'Scenario',
    descriptors: ['未設定'],
  },
  notes: '初期値: 3D座標計算ロジックは未実装',
})
