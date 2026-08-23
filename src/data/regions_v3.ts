import type { RegionV3 } from '../composables/useRegion'
import { getRegionPublicMedia } from './region_public_media'

export type ShowcaseRegion = RegionV3 & {
  thumbnail: string
  exposure?: 'public' | 'listed' | 'stealth'
}

// Public catalog set requested by owner:
// MetaTuber / Reincarnation Judgment / Yoidore / Mobility / Ambient / IZ Help
export const SHOWCASE_REGIONS: ShowcaseRegion[] = [
  {
    id: 'mtuber_region',
    name: 'Oshimashi Meta-Performance Studio',
    label_jp: 'メタチューバー',
    description: '配信・メタ演出・V2運用の中核リージョン。IZAKAYA Verse 2.0の継承候補。',
    thumbnail: getRegionPublicMedia('mtuber_region').thumbnail,
    atmosphere: { visual_theme: 'cyber_studio', bgm_url: null, ambient_sounds: ['hologram_hum'] },
    laws: ['Streaming Active', 'Metacapture Protocol', 'Style Consistency'],
    connected_regions: ['iz_help_nexus', 'mobility_region'],
    level: 1,
    version: '3.0',
    exposure: 'public',
  },
  {
    id: 'iz_help_nexus',
    name: 'IZAKAYA Help Nexus',
    label_jp: 'IZヘルプ',
    description: '全リージョン導線の案内・運用ガイド・FAQを受け持つ公式ナビゲーション拠点。',
    thumbnail: getRegionPublicMedia('iz_help_nexus').thumbnail,
    atmosphere: { visual_theme: 'terminal_grotto', bgm_url: null, ambient_sounds: ['soft_hum'] },
    laws: ['Operator First', 'Clarity Over Complexity', 'No Silent Failure'],
    connected_regions: ['mtuber_region', 'yoidore_region', 'ambient_region', 'mobility_region'],
    level: 1,
    version: '3.0',
    exposure: 'public',
  },
  {
    id: 'reincarnation_judgment',
    name: 'The Gilded Archive of Reincarnation',
    label_jp: '転生裁判',
    description: '女神裁判官、守護天使、誘惑の悪魔が魂の行き先を審理する裁判リージョン。',
    thumbnail: getRegionPublicMedia('reincarnation_judgment').thumbnail,
    atmosphere: { visual_theme: 'celestial_court', bgm_url: null, ambient_sounds: ['choir', 'gavel'] },
    laws: ['Judgment First', 'Rewrite With Care', 'Temptation Has Cost'],
    connected_regions: ['iz_help_nexus', 'yoidore_region'],
    level: 1,
    version: '3.0',
    exposure: 'public',
  },
  {
    id: 'yoidore_region',
    name: 'The Sinking Owl’s Berth',
    label_jp: 'よいどれ',
    description: '居酒屋の喧騒と人間味を核にした会話体験リージョン。物語系コンテンツの公開軸。',
    thumbnail: getRegionPublicMedia('yoidore_region').thumbnail,
    atmosphere: { visual_theme: 'izakaya_night', bgm_url: null, ambient_sounds: ['chatter', 'clinking'] },
    laws: ['No Violence', 'Gourmet First', 'Dialogue Driven'],
    connected_regions: ['iz_help_nexus', 'ambient_region'],
    level: 1,
    version: '3.0',
    exposure: 'public',
  },
  {
    id: 'ambient_region',
    name: 'The Gilded Sky-Reach',
    label_jp: 'アンビエント',
    description: '静けさ・余白・空気感を重視した審美軸リージョン。背景・BGM連携に最適化。',
    thumbnail: getRegionPublicMedia('ambient_region').thumbnail,
    atmosphere: { visual_theme: 'ambient_calm', bgm_url: null, ambient_sounds: ['wind', 'shore'] },
    laws: ['Silence as Value', 'Low Noise Interface', 'Gentle Motion'],
    connected_regions: ['iz_help_nexus', 'yoidore_region'],
    level: 1,
    version: '3.0',
    exposure: 'public',
  },
  {
    id: 'mobility_region',
    name: 'The Orbit-Flow Corridor',
    label_jp: 'モビリティ',
    description: '移動体・ロボティクス・未来交通を主題にした技術公開リージョン。',
    thumbnail: getRegionPublicMedia('mobility_region').thumbnail,
    atmosphere: { visual_theme: 'mobility_kinetic', bgm_url: null, ambient_sounds: ['maglev_whoosh'] },
    laws: ['Fast Iterate', 'Safety Gate', 'Readable Systems'],
    connected_regions: ['mtuber_region', 'iz_help_nexus'],
    level: 2,
    version: '3.0',
    exposure: 'public',
  },
]

export function findShowcaseRegion(id: string): ShowcaseRegion | undefined {
  return SHOWCASE_REGIONS.find((r) => r.id === id)
}
