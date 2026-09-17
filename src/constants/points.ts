export const POINTS_PRICING = {
  pointValueYen: 10,
  pointPack: {
    amountYen: 1000,
    points: 100,
  },
  region: {
    level1MonthlyPass: 10,
    mmoMonthlyPass: 20,
    mmoRegionIds: ['dear-karma', 'chronicle-soul'],
  },
  library: {
    standardDownload: 1,
    premiumDownload: 3,
  },
  comics: {
    ebookPack: 60,
  },
} as const

export function regionMonthlyPassPoints(regionId: string): number {
  return (POINTS_PRICING.region.mmoRegionIds as readonly string[]).includes(regionId)
    ? POINTS_PRICING.region.mmoMonthlyPass
    : POINTS_PRICING.region.level1MonthlyPass
}

export type PointsPricing = typeof POINTS_PRICING

export const describePointsPricing = () => [
  `ポイント換算: 1P = ¥${POINTS_PRICING.pointValueYen}`,
  `初期購入単位: ¥${POINTS_PRICING.pointPack.amountYen.toLocaleString()} = ${POINTS_PRICING.pointPack.points}P`,
  `レベル1リージョン30日券: ${POINTS_PRICING.region.level1MonthlyPass}P`,
  `MMO1・MMO2リージョン30日券: ${POINTS_PRICING.region.mmoMonthlyPass}P`,
  `公式V2カードDL: 標準 ${POINTS_PRICING.library.standardDownload}P / レア・小パック ${POINTS_PRICING.library.premiumDownload}P`,
  `コミックス電子書籍パック: ${POINTS_PRICING.comics.ebookPack}P（¥600相当）`,
  'AIチャット・画像生成・MetaCapture生成はBYOK案内であり、ポイント販売しない',
]
