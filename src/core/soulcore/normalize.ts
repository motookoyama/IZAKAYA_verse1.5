import type { SoulCore } from './types'

const normalizePersona = (text: string): string =>
  text
    .replace(/\s+/g, ' ')
    .replace(/。/g, '。\n')
    .trim()
    .slice(0, 600)

export const normalizeSoulCore = (soulCore: SoulCore): SoulCore => ({
  ...soulCore,
  personaJP: normalizePersona(soulCore.personaJP),
  constraints: soulCore.constraints.map((item) => item.trim()).filter(Boolean),
  seedFacts: Array.from(new Set(soulCore.seedFacts.map((item) => item.trim()).filter(Boolean))),
  updatedAt: new Date().toISOString(),
})
