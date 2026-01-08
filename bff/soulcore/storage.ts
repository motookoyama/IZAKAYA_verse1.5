import type { IngestPayload } from './schemas'

export interface SoulCoreRecord extends IngestPayload {
  id: string
  checksum: string
  createdAt: string
}

const store = new Map<string, SoulCoreRecord>()

const checksum = (data: unknown) =>
  Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16)

export const saveRecord = (payload: IngestPayload): SoulCoreRecord => {
  const id = `sc_${Date.now().toString(36)}_${store.size}`
  const record: SoulCoreRecord = {
    ...payload,
    id,
    checksum: checksum(payload),
    createdAt: new Date().toISOString(),
  }
  store.set(id, record)
  return record
}

export const getRecord = (id: string) => store.get(id)
