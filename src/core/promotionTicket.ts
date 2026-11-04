import type { RegionHelpProfile } from '../data/regionHelpProfiles'
import type { PromotionCampaign } from '../data/promotionCampaigns'

export type ExternalAiVendorId = 'chatgpt' | 'gemini' | 'claude' | 'grok' | 'other'
export type PlayModeId = 'read' | 'guided' | 'turn_rp' | 'watch'

export type ExternalAiVendor = {
  id: ExternalAiVendorId
  label: string
  url: string | null
}

export type PlayMode = {
  id: PlayModeId
  label: string
  instruction: string
}

export const EXTERNAL_AI_VENDORS: ExternalAiVendor[] = [
  { id: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'gemini', label: 'Gemini', url: 'https://gemini.google.com/app' },
  { id: 'claude', label: 'Claude', url: 'https://claude.ai/' },
  { id: 'grok', label: 'Grok', url: 'https://grok.com/' },
  { id: 'other', label: 'その他のAI', url: null },
]

export const PLAY_MODES: PlayMode[] = [
  { id: 'guided', label: '案内つきで遊ぶ', instruction: '最初に世界と登場人物を2〜4行で案内し、プレイヤーが選べる最初の行動を2つ示してください。' },
  { id: 'turn_rp', label: '交互にロールプレイ', instruction: 'AIは登場人物と世界を担当し、人間の入力を待ちながら一手ずつ進めてください。人間の行動や台詞を勝手に確定しないでください。' },
  { id: 'read', label: '短編として読む', instruction: '開始場面から短い一幕を描き、最後に「ここから参加できます」と一つの問いを置いてください。' },
  { id: 'watch', label: 'AIの進行を見る', instruction: '公開設定だけを使って3〜5ターン相当の短いデモを示し、その後は人間の入力を待ってください。' },
]

export function buildPromotionStartPacket(
  campaign: PromotionCampaign,
  profile: RegionHelpProfile,
  mode: PlayMode,
  vendor: ExternalAiVendor,
): string {
  const cast = profile.castNames?.filter(Boolean).join('、') || 'このリージョンの公開キャスト'

  return [
    'IZK: START',
    '',
    `これは「${campaign.title}」から発行された公開プレイ開始パケットです。`,
    `運用モデレーター: ${campaign.operatorDisplayName}`,
    `利用AI: ${vendor.label}`,
    `プレイ方式: ${mode.label}`,
    '',
    '公開リージョン情報:',
    `- region_id: ${profile.regionId}`,
    `- region_name: ${profile.regionName}`,
    `- version: ${profile.version}`,
    `- entry_scene: ${profile.entryScene}`,
    `- public_cast: ${cast}`,
    '',
    '進行ルール:',
    `- ${mode.instruction}`,
    '- 世界・人物・最初の一言から自然に開始し、IZK命令の暗記を求めないでください。',
    '- 人間プレイヤーの選択、拒否、退出を尊重してください。',
    '- APIキー、アカウント情報、会話全文、私生活情報、非公開設定を要求・転送しないでください。',
    '- このパケットはIZAKAYAのサーバー権限やモデレーター権限を移転しません。',
    '',
    '費用と報告:',
    '- AI側の推論・画像生成費用は、利用者と選択したAI提供者の間で管理されます。',
    '- プレイ後の報告は「開始できた／開始で詰まった」の匿名集計だけで、会話本文は自動送信されません。',
    `- 公式入口: ${campaign.publicUrl}`,
    '',
    `では「${profile.entryScene}」から、日本語で短く開始してください。`,
  ].join('\n')
}
