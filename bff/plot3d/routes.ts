import { Router } from 'express'

const router = Router()

router.get('/ping', (_req, res) => {
  res.json({ ok: true, message: 'plot3d placeholder' })
})

export default router
