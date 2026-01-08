import fallbackAvatar from '../assets/persona-default.svg'

export type SampleCard = {
  id: string
  name: string
  summary: string
  tags: string[]
  avatar: string
  raw: any
}

const cardJsonModules = import.meta.glob('./v2cards/*.json', { eager: true })
const cardImageModules = import.meta.glob('../assets/v2cards/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  import: 'default',
})

const resolvePayload = (module: unknown): any => {
  if (module && typeof module === 'object' && 'default' in module) {
    return (module as { default: any }).default
  }
  return module
}

const resolveAvatar = (cardId: string): string => {
  const entry = Object.entries(cardImageModules).find(([path]) => path.includes(`/${cardId}.`))
  if (entry) {
    return entry[1] as string
  }
  return fallbackAvatar
}

function createSampleCard(id: string, payload: any, tags: string[]): SampleCard {
  const name: string = payload?.name ?? payload?.data?.name ?? id
  const description: string =
    payload?.description ?? payload?.data?.description ?? ''

  const summary = description
    .replace(/\r\n/g, ' ')
    .trim()
    .slice(0, 160)

  return {
    id,
    name,
    summary,
    tags,
    avatar: resolveAvatar(id),
    raw: payload,
  }
}

const defaultTags: Record<string, string[]> = {
  'dr-orb': ['管理者', 'ナビゲータ'],
  'ekaterina-menter': ['管理者', '翻訳'],
  'lady-maholo': ['管理', 'コミュニティ'],
  'miss-madi': ['管理', 'サポート'],
  'mammon-manager': ['経理', '管理者'],
  'team-ozanari-dungeon': ['チーム', 'ストーリー'],
  ekubo: ['サンプル', 'ギャグ'],
  'hanaso-kawari': ['案内', '文化'],
}

export const navigatorCards: SampleCard[] = Object.entries(cardJsonModules).map(([path, mod]) => {
  const id = path.split('/').pop()!.replace('.json', '')
  const payload = resolvePayload(mod)
  const tags = defaultTags[id] ?? ['公式', 'カード']
  return createSampleCard(id, payload, tags)
})

export const primaryNavigatorId = 'dr-orb'

export function findNavigatorCard(id: string): SampleCard | undefined {
  return navigatorCards.find((card) => card.id === id)
}
