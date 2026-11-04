export type PromotionCampaign = {
  id: string
  operatorDisplayName: string
  title: string
  activeFrom: string
  activeUntil: string
  publicUrl: string
}

export const PROMOTION_CAMPAIGNS: PromotionCampaign[] = [
  {
    id: 'muse-official-202611',
    operatorDisplayName: 'ミューズ',
    title: 'ミューズ公式・AI体験フリーパス',
    activeFrom: '2026-11-04T00:00:00+09:00',
    activeUntil: '2026-12-04T23:59:59+09:00',
    publicUrl: 'https://motookoyama.github.io/IZAKAYA_verse1.5/#/promo?campaign=muse-official-202611',
  },
]

export function findPromotionCampaign(id: string): PromotionCampaign | undefined {
  return PROMOTION_CAMPAIGNS.find((campaign) => campaign.id === id)
}

export function promotionCampaignIdFromHash(hash: string): string {
  const queryIndex = hash.indexOf('?')
  if (queryIndex < 0) return ''
  return new URLSearchParams(hash.slice(queryIndex + 1)).get('campaign') || ''
}
