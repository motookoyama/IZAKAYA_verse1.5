import { Router } from 'express'
import { ingestController, validateController } from './controllers'

const router = Router()

router.post('/ingest', ingestController)
router.post('/validate', validateController)

export default router
