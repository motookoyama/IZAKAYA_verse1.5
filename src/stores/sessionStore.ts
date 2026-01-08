import { reactive } from 'vue'

export type SessionStatus = 'signedOut' | 'otpSent' | 'ready'

export type SessionUser = {
  id: string
  email: string
  name?: string
}

type SessionState = {
  status: SessionStatus
  email: string
  accessToken: string | null
  refreshToken: string | null
  user: SessionUser | null
  previewCode: string | null
  lastError: string | null
}

const STORAGE_KEY = 'izk:session'

const state = reactive<SessionState>({
  status: 'signedOut',
  email: '',
  accessToken: null,
  refreshToken: null,
  user: null,
  previewCode: null,
  lastError: null,
})

const persist = () => {
  if (typeof window === 'undefined') return
  if (state.accessToken && state.refreshToken && state.user) {
    const payload = {
      email: state.email,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

const hydrate = () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const payload = JSON.parse(raw)
    if (payload?.accessToken && payload?.refreshToken && payload?.user) {
      state.status = 'ready'
      state.email = payload.email || payload.user.email || ''
      state.accessToken = payload.accessToken
      state.refreshToken = payload.refreshToken
      state.user = payload.user
    }
  } catch (error) {
    console.warn('[sessionStore] failed to hydrate session', error)
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

hydrate()

export const sessionState = state

export function setOtpState(email: string, previewCode: string | null) {
  state.status = 'otpSent'
  state.email = email
  state.previewCode = previewCode
  state.accessToken = null
  state.refreshToken = null
  state.user = null
  persist()
}

export function setSessionTokens(params: { email: string; accessToken: string; refreshToken: string; user: SessionUser }) {
  state.status = 'ready'
  state.email = params.email
  state.accessToken = params.accessToken
  state.refreshToken = params.refreshToken
  state.user = params.user
  state.previewCode = null
  state.lastError = null
  persist()
}

export function clearSessionState() {
  state.status = 'signedOut'
  state.email = ''
  state.accessToken = null
  state.refreshToken = null
  state.user = null
  state.previewCode = null
  state.lastError = null
  persist()
}

export function setSessionError(message: string | null) {
  state.lastError = message
}

export function getAccessToken(): string | null {
  return state.accessToken
}
