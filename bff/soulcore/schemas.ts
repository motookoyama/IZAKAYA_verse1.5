export type IngestSource = 'png' | 'session'

export interface IngestPayload {
  source: IngestSource
  v2json: unknown
  extracted: {
    soulCore: unknown
    plot3d?: unknown
    provenance?: unknown
  }
}

export interface ValidatePayload {
  v2json: unknown
}

export const validateIngestPayload = (payload: unknown): { ok: boolean; errors: string[]; data?: IngestPayload } => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['payload is not an object'] }
  }
  const candidate = payload as Partial<IngestPayload>
  if (!candidate.source || !candidate.v2json || !candidate.extracted) {
    return { ok: false, errors: ['missing required fields'] }
  }
  return { ok: true, errors: [], data: candidate as IngestPayload }
}

export const validatePayload = (payload: unknown): { ok: boolean; errors: string[]; data?: ValidatePayload } => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['payload is not an object'] }
  }
  const candidate = payload as ValidatePayload
  if (!candidate.v2json) {
    return { ok: false, errors: ['v2json is required'] }
  }
  return { ok: true, errors: [], data: candidate }
}
