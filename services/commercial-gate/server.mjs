import http from 'node:http'
import { Firestore } from '@google-cloud/firestore'

const port = Number.parseInt(process.env.PORT || '8080', 10)
const projectId = (process.env.GOOGLE_CLOUD_PROJECT || '').trim()
const runningInCloudRun = Boolean(process.env.K_SERVICE)
let firestore

function getFirestore() {
  if (!firestore) {
    firestore = new Firestore(projectId ? { projectId } : undefined)
  }
  return firestore
}

function respond(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(JSON.stringify(body))
}

async function firestoreProbe() {
  // A read-only probe: it never creates a document or stores user data.
  // Local development has no workload identity.  Do not create a Firestore
  // client there, because its background credential lookup would terminate
  // the process before this endpoint can report the missing connection.
  if (!runningInCloudRun) {
    return { connected: false, mode: 'local-credentials-unavailable' }
  }
  await getFirestore().doc('_system/health_probe').get()
  return { connected: true, mode: 'read-only-probe' }
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' || req.url !== '/health') {
    respond(res, 404, { ok: false, error: 'not_found' })
    return
  }

  try {
    const storage = await firestoreProbe()
    const status = storage.connected ? 200 : 503
    respond(res, status, {
      ok: storage.connected,
      service: 'izakaya-commercial-gate',
      mode: 'sandbox-infrastructure-smoke',
      hostedAi: false,
      paymentHandling: 'disabled',
      pointLedger: 'disabled',
      storage,
    })
  } catch (error) {
    respond(res, 503, {
      ok: false,
      service: 'izakaya-commercial-gate',
      error: 'firestore_unavailable',
      message: error instanceof Error ? error.message : String(error),
    })
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`izakaya-commercial-gate listening on ${port}`)
})
