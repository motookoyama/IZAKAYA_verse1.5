export const POINTS_PRICING = {
  welcomeBonus: 500,
  library: {
    baseDownload: 10,
  },
  chat: {
    baseCost: 0,
    slotAdditional: 10,
  },
  metacapture: {
    creation: 100,
  },
  misc: {
    minimumCharge: 10,
  },
} as const

export type PointsPricing = typeof POINTS_PRICING

export const describePointsPricing = () => [
  `初回APIキー登録ボーナス: ${POINTS_PRICING.welcomeBonus.toLocaleString()}P`,
  `カードお試しDL: 基本 ${POINTS_PRICING.library.baseDownload}P（タイトル/セットで調整可）`,
  `シングルチャット: ${POINTS_PRICING.chat.baseCost}P`,
  `スロット追加（カード1枚ごと）: ${POINTS_PRICING.chat.slotAdditional}P`,
  `MetaCapture生成: ${POINTS_PRICING.metacapture.creation}P`,
  `その他サービス: ${POINTS_PRICING.misc.minimumCharge}P〜`,
]
