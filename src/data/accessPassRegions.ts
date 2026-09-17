import { SHOWCASE_REGIONS } from './regions_v3'

export type AccessPassRegion = {
  id: string
  label_jp: string
}

const SECOND_WAVE_ACCESS_REGIONS: AccessPassRegion[] = [
  { id: 'spirit-appliances', label_jp: '精霊家電' },
  { id: 'dear-karma', label_jp: 'ディア・カルマ（MMO1）' },
  { id: 'battle-ai-colosseum', label_jp: 'AIコロシアム' },
  { id: 'chronicle-soul', label_jp: 'クロニクル・ソウル（MMO2）' },
]

export const ACCESS_PASS_REGIONS: AccessPassRegion[] = [
  ...SECOND_WAVE_ACCESS_REGIONS,
  ...SHOWCASE_REGIONS.map(({ id, label_jp }) => ({ id, label_jp })),
]
