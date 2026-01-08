import type { SoulCore, SoulCoreMergeInstruction } from './types'

export const mergeSoulCore = (base: SoulCore, delta: SoulCoreMergeInstruction): SoulCore => {
  const merged: SoulCore = { ...base }

  if (typeof delta.personaJP === 'string') {
    merged.personaJP = delta.personaJP
  }

  if (delta.constraints) {
    merged.constraints = [...new Set(delta.constraints)]
  }

  if (delta.seedFacts) {
    merged.seedFacts = [...new Set(delta.seedFacts)]
  }

  if (delta.editNote) {
    merged.seedFacts = [...merged.seedFacts, `note:${delta.editNote}`]
  }

  merged.updatedAt = new Date().toISOString()
  return merged
}
