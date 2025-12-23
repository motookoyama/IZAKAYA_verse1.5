import type { SampleCard } from '../data/sampleCards'

export type CardRole = 'CHARACTER' | 'WORLD' | 'SCENARIO' | 'UNKNOWN'

const OVERRIDE_STORAGE_KEY = 'izakaya-card-role-overrides'

const ROLE_KEYWORDS: Record<CardRole, string[]> = {
  CHARACTER: ['character', 'char', 'persona', 'キャラ', '人物'],
  WORLD: ['world', '環境', 'ワールド', 'setting', '世界'],
  SCENARIO: ['scenario', 'story', 'シナリオ', 'あらすじ', 'campaign', 'episode'],
  UNKNOWN: [],
}

const DEFAULT_ROLE_HINTS: Record<string, CardRole> = {
  'hanaso-kawari': 'WORLD',
  'team-ozanari-dungeon': 'SCENARIO',
}

function normalize(value?: string | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.toLowerCase()
}

function matchRoleFromValue(value?: string | null): CardRole | null {
  const normalized = normalize(value)
  if (!normalized) return null
  if (ROLE_KEYWORDS.WORLD.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
    return 'WORLD'
  }
  if (ROLE_KEYWORDS.SCENARIO.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
    return 'SCENARIO'
  }
  if (ROLE_KEYWORDS.CHARACTER.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
    return 'CHARACTER'
  }
  return null
}

function collectCandidates(card: SampleCard): string[] {
  const raw = (card.raw?.data ?? card.raw ?? {}) as Record<string, any>
  const meta = raw?.meta ?? card.raw?.meta ?? {}

  const candidates: Array<string | null | undefined> = [
    meta?.type,
    raw?.type,
    raw?.cardType,
    raw?.category,
    raw?.kind,
    raw?.role,
    card.id,
    card.name,
    raw?.name,
    raw?.title,
  ]

  const tagSources: string[] = [
    ...(Array.isArray(card.tags) ? card.tags : []),
    ...(Array.isArray(raw?.tags) ? raw.tags : []),
    ...(Array.isArray(meta?.tags) ? meta.tags : []),
  ]
  candidates.push(...tagSources)

  return candidates.filter((item): item is string => typeof item === 'string')
}

export function determineCardRole(card: SampleCard, overrides: Record<string, CardRole> = {}): CardRole {
  const override = overrides[card.id]
  if (override && override !== 'UNKNOWN') {
    return override
  }

  const raw = (card.raw?.data ?? card.raw ?? {}) as Record<string, any>
  const meta = raw?.meta ?? card.raw?.meta ?? {}

  const typeDirectives: Array<string | null | undefined> = [
    meta?.type,
    raw?.type,
    raw?.cardType,
    raw?.category,
    raw?.kind,
  ]

  for (const directive of typeDirectives) {
    const role = matchRoleFromValue(directive)
    if (role) return role
  }

  const candidates = collectCandidates(card)
  for (const candidate of candidates) {
    const role = matchRoleFromValue(candidate)
    if (role) return role
  }

  const hinted = DEFAULT_ROLE_HINTS[card.id]
  if (hinted) return hinted

  return override ?? 'UNKNOWN'
}

export function loadRoleOverrides(): Record<string, CardRole> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(OVERRIDE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch {
    // ignore storage errors
  }
  return {}
}

export function persistRoleOverrides(overrides: Record<string, CardRole>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // ignore storage errors
  }
}
