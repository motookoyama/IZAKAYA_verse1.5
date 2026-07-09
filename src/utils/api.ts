import { clearSessionState, getAccessToken, setSessionError } from '../stores/sessionStore'

const legacyApiBase = ((import.meta.env.VITE_BFF_URL as string | undefined) ?? '').trim()
const ENV_API_BASE = ((import.meta.env.VITE_API_BASE as string | undefined) ?? legacyApiBase).trim()
const FALLBACK_API_BASE = 'https://izakaya-bff.onrender.com'
export const API_BASE = (ENV_API_BASE.length > 0 ? ENV_API_BASE : FALLBACK_API_BASE).replace(/\/$/, '')
const legacyGateKey = ((import.meta.env.VITE_GATE_KEY as string | undefined) ?? '').trim()
export const API_GATE_KEY = ((import.meta.env.VITE_API_GATE_KEY as string | undefined) ?? legacyGateKey).trim()
export const EXPECTED_BOND_ID = 'BOND-IZAKAYA-MAIN-2026-02-04'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function verifyBffBond(): Promise<boolean> {
  try {
    // We use fetch directly to avoid infinite loop if apiRequest calls verifyBffBond
    const response = await fetch(`${API_BASE}/bond`, {
      headers: {
        'X-IZAKAYA-GATE': API_GATE_KEY
      }
    })
    if (!response.ok) return false
    const data = await response.json()
    return data && data.bond_id === EXPECTED_BOND_ID
  } catch (err) {
    console.error('[BOND] Handshake failed', err)
    return false
  }
}

export function resolveApiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

function previewPayload(payload: unknown) {
  if (payload === null || payload === undefined) return payload
  if (typeof payload === 'string') return payload.slice(0, 160)
  if (Array.isArray(payload)) return `[array length=${payload.length}]`
  if (typeof payload === 'object') {
    try {
      return JSON.stringify(payload).slice(0, 160)
    } catch {
      return Object.keys(payload as Record<string, unknown>)
    }
  }
  return payload
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = resolveApiUrl(path)
  const headers = new Headers(init?.headers ?? {})
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (API_GATE_KEY.length > 0 && !headers.has('X-IZAKAYA-GATE')) {
    headers.set('X-IZAKAYA-GATE', API_GATE_KEY)
  }
  const token = getAccessToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(url, { ...init, headers })
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[apiRequest] network error', { url, error: err instanceof Error ? err.message : String(err) })
    }
    throw err
  }
  let parsed: any = null

  try {
    parsed = await response.json()
  } catch (parseError) {
    if (response.ok) {
      throw new Error('Empty response from server')
    }
  }

  if (!response.ok) {
    const detail = typeof parsed === 'object' && parsed && 'error' in parsed ? String(parsed.error) : ''
    if (import.meta.env.DEV) {
      console.error('[apiRequest] request failed', {
        url,
        status: response.status,
        statusText: response.statusText,
        bodyPreview: previewPayload(parsed),
      })
    }
    const message = detail || `Request failed with status ${response.status}`
    const shouldResetSession =
      token &&
      (response.status === 401 || response.status === 403) &&
      !path.startsWith('/auth/')

    if (shouldResetSession) {
      clearSessionState()
      setSessionError('セッションの認証が切れました。再ログインしてください')
    }

    throw new ApiError(message, response.status)
  }

  return parsed as T
}
