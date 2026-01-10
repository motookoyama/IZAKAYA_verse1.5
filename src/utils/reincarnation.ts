import type { SampleCard } from '../data/sampleCards'
import fallbackAvatar from '../assets/persona-default.svg'

/**
 * V25 Reincarnation Decoder
 * Decodes the 'IZ-REIN-V25:' base64 format or raw JSON soul seeds.
 */

export type ReincarnationCode = {
    n: string // name
    d: string // description
    p: string // personality
    s: string // scenario
}

export function decodeReincarnation(code: string): SampleCard | null {
    try {
        let rawJson = ''
        if (code.startsWith('IZ-REIN-V25:')) {
            const b64 = code.replace('IZ-REIN-V25:', '')
            // Use URL-safe or standard base64 decoding
            rawJson = decodeURIComponent(escape(atob(b64.trim())))
        } else if (code.trim().startsWith('{')) {
            rawJson = code.trim()
        } else {
            return null
        }

        const data = JSON.parse(rawJson) as ReincarnationCode
        const id = `rein-${data.n || 'soul'}-${Math.random().toString(36).slice(2, 7)}`

        return {
            id,
            name: data.n || 'Unnamed Soul',
            summary: data.d || '',
            tags: ['REINCARNATED', 'V25'],
            avatar: fallbackAvatar,
            raw: {
                name: data.n,
                description: data.d,
                personality: data.p,
                scenario: data.s
            }
        }
    } catch (err) {
        console.error('Failed to decode reincarnation code', err)
        return null
    }
}
