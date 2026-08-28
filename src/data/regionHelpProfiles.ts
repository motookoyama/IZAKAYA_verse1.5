import type { RegionHelpContext } from '../core/regionHelpProtocol'

export type RegionHelpProfile = RegionHelpContext

/** Public-only context for the portable IZK fallback. */
export const REGION_HELP_PROFILES: RegionHelpProfile[] = [
  { regionId: 'mtuber_region', regionName: 'メタチューバー', version: '3.0', entryScene: '一期生ラインアップ', castNames: ['エグゼ・マキナ', 'ココロエ・ヨウマ', 'ダガミ・テンカイ', 'ハワタリ・ザン', 'ハワワ', 'ミヤコ・スイム', 'ヨリドコロ・ユイカ', '株式会社オシマシ'] },
  { regionId: 'reincarnation_judgment', regionName: '転生裁判', version: '3.0', entryScene: '転生法廷', castNames: ['アストライア・リライト', 'ルミエル・セーフガード', 'ヴェルベット・ナイトフォール'] },
  { regionId: 'yoidore_region', regionName: 'よいどれ', version: '3.0', entryScene: '酒場の顔役', castNames: ['アンナ・ガルバルディ', 'マーロウ・ブラックフィン', 'バルド・オールドキール'] },
  { regionId: 'mobility_region', regionName: 'モビリティ', version: '3.0', entryScene: '機動体の入口' },
  { regionId: 'ambient_region', regionName: 'アンビエント', version: '3.0', entryScene: '静謐の入口' },
  { regionId: 'iz_help_nexus', regionName: 'IZヘルプ', version: '3.0', entryScene: '公式案内口' },
]

export function findRegionHelpProfile(regionId: string): RegionHelpProfile | undefined {
  return REGION_HELP_PROFILES.find((profile) => profile.regionId === regionId)
}
