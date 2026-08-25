export const POINTS_PRICING = {
  pointValueYen: 10,
  pointPack: {
    amountYen: 1000,
    points: 100,
  },
  region: {
    level1MonthlyPass: 10,
    aClassMonthlyPasses: [20, 30],
  },
  library: {
    standardDownload: 1,
    premiumDownload: 3,
  },
  comics: {
    ebookPack: 60,
  },
} as const

export type PointsPricing = typeof POINTS_PRICING

export const describePointsPricing = () => [
  `ポイント換算: 1P = ¥${POINTS_PRICING.pointValueYen}`,
  `初期購入単位: ¥${POINTS_PRICING.pointPack.amountYen.toLocaleString()} = ${POINTS_PRICING.pointPack.points}P`,
  `レベル1リージョン30日券: ${POINTS_PRICING.region.level1MonthlyPass}P`,
  `AクラスMMOリージョン30日券: ${POINTS_PRICING.region.aClassMonthlyPasses.join('P / ')}P（個別SKU）`,
  `公式V2カードDL: 標準 ${POINTS_PRICING.library.standardDownload}P / レア・小パック ${POINTS_PRICING.library.premiumDownload}P`,
  `コミックス電子書籍パック: ${POINTS_PRICING.comics.ebookPack}P（¥600相当）`,
  'AIチャット・画像生成・MetaCapture生成はBYOK案内であり、ポイント販売しない',
]
