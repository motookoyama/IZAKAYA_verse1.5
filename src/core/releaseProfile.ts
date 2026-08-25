/**
 * The public product lifecycle is deliberately independent from the repository
 * name and from legacy 1.6 presentation copy.  Feature code reads this module
 * instead of declaring a release state in individual pages.
 */
export type ReleaseLifecycle = 'development' | 'prelaunch' | 'released'

export const releaseProfile = Object.freeze({
  productName: 'IZAKAYA Verse',
  productVersion: '2.0',
  lifecycle: 'prelaunch' as ReleaseLifecycle,
  predecessor: {
    productVersion: '1.6',
    policy: 'inherit_only',
  },
  commercialGate: {
    status: 'not_available',
    salesEnabled: false,
    accessPassesEnabled: false,
  },
  accessModel: {
    firstPass: '一アカウントにつき一回の24時間フリーパス（商業ゲート成立後）',
    monthlyPass: '10Pで発行時から30日（商業ゲート成立後）',
  },
  externalAi: {
    responsibility: 'AI推論・画像生成・各社API利用料はユーザー自身が管理する',
    storage: 'IZAKAYAはユーザーのAPIキー、会話ログ、元V2カードを標準保存しない',
  },
  launchModes: ['LAUNCH', 'DIRECT_BYOK', 'POWER_USER_EXPORT'] as const,
})

export const releaseBadge = () =>
  `${releaseProfile.productName.toUpperCase()} ${releaseProfile.productVersion} / ${releaseProfile.lifecycle.toUpperCase()}`

export const commercialGateNotice = () =>
  '商業ゲートは準備中です。販売、ポイント付与、利用権発行はまだ開始していません。'
