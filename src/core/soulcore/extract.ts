import type { SoulCore, SoulCoreExtractionResult } from './types'

const generateSoulCoreId = () => `sc_${Math.random().toString(36).slice(2, 10)}`

export const extractSoulCoreFromV2 = (v2json: unknown): SoulCoreExtractionResult => {
  const now = new Date().toISOString()
  const shell: SoulCore = {
    id: generateSoulCoreId(),
    language: 'ja',
    role: 'character',
    personaJP: '',
    constraints: [],
    ipSanitized: true,
    seedFacts: [],
    createdAt: now,
    updatedAt: now,
  }

  if (!v2json || typeof v2json !== 'object') {
    return {
      soulCore: shell,
      errors: ['V2 JSON が未入力のためダミー値を返しました。'],
      warnings: [],
    }
  }

  return {
    soulCore: shell,
    errors: [],
    warnings: ['実装待ち: V2 JSON からの抽出ロジックが未提供です。'],
  }
}
