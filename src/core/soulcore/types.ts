import type { Plot3D } from '../plot3d/types'

export type SoulCoreRole = 'character' | 'world' | 'scenario' | 'tool'

export interface SoulCore {
  id: string
  language: string
  role: SoulCoreRole
  personaJP: string
  constraints: string[]
  ipSanitized: boolean
  seedFacts: string[]
  createdAt: string
  updatedAt: string
}

export interface ProvenanceEntry {
  timestamp: number
  type: 'visual_reconstruct' | 'text_revision' | 'qr_sync' | 'custom'
  note?: string
}

export interface Provenance {
  engine: string
  engineVersion: string
  editLog: ProvenanceEntry[]
}

export interface SoulCorePackage {
  soulCore: SoulCore
  plot3d?: Plot3D
  provenance?: Provenance
}

export interface SoulCoreExtractionResult {
  soulCore: SoulCore | null
  warnings: string[]
  errors: string[]
}

export interface SoulCoreMergeInstruction {
  personaJP?: string
  constraints?: string[]
  seedFacts?: string[]
  editNote?: string
}

export interface SoulCoreValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}
