import type { Request, Response } from 'express'
import { validateIngestPayload, validatePayload } from './schemas'
import { saveRecord } from './storage'

export const ingestController = (req: Request, res: Response) => {
  const result = validateIngestPayload(req.body)
  if (!result.ok || !result.data) {
    return res.status(400).json({ ok: false, errors: result.errors })
  }
  const record = saveRecord(result.data)
  return res.json({ ok: true, soulCoreId: record.id, checksum: record.checksum })
}

export const validateController = (req: Request, res: Response) => {
  const result = validatePayload(req.body)
  if (!result.ok) {
    return res.status(400).json({ ok: false, errors: result.errors })
  }
  return res.json({ ok: true, warnings: [] })
}
