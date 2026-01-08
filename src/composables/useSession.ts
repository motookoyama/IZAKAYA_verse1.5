import { ref } from 'vue'
import { apiRequest } from '../utils/api'
import {
  sessionState,
  setOtpState,
  setSessionTokens,
  clearSessionState,
  setSessionError,
  setPublicProfile,
  type PublicProfile,
} from '../stores/sessionStore'

const loading = ref(false)
const profileLoading = ref(false)

export function useSession() {
  async function startOtp(emailInput: string) {
    const email = emailInput.trim().toLowerCase()
    if (!email.includes('@')) {
      throw new Error('有効なメールアドレスを入力してください')
    }
    loading.value = true
    setSessionError(null)
    try {
      const response = await apiRequest<{ ok: boolean; previewCode?: string; expiresIn?: number }>(
        '/auth/start',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        }
      )
      setOtpState(email, response.previewCode ?? null)
      return response.previewCode ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setSessionError(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function verifyOtp(codeInput: string) {
    if (!codeInput.trim()) {
      throw new Error('確認コードを入力してください')
    }
    const email = sessionState.email
    if (!email) {
      throw new Error('先にメールアドレスを登録してください')
    }
    loading.value = true
    setSessionError(null)
    try {
      const response = await apiRequest<{ ok: boolean; accessToken: string; refreshToken: string; user: any }>(
        '/auth/verify',
        {
          method: 'POST',
          body: JSON.stringify({ email, code: codeInput.trim() }),
        }
      )
      setSessionTokens({
        email,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setSessionError(message)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    const refreshToken = sessionState.refreshToken
    clearSessionState()
    if (!refreshToken) return
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      /* ignore */
    }
  }

  async function fetchProfile() {
    if (!sessionState.accessToken) {
      setPublicProfile(null)
      return
    }
    profileLoading.value = true
    try {
      const response = await apiRequest<{ ok: boolean; profile: PublicProfile | null }>(
        '/me/public-profile'
      )
      setPublicProfile(response.profile ?? null)
    } catch (error) {
      console.warn('[session] fetchProfile failed', error)
      setPublicProfile(null)
    } finally {
      profileLoading.value = false
    }
  }

  async function saveProfile(profile: PublicProfile) {
    if (!sessionState.accessToken) {
      throw new Error('ログインしてください')
    }
    profileLoading.value = true
    try {
      const payload = await apiRequest<{ ok: boolean; profile: PublicProfile }>(
        '/me/public-profile',
        {
          method: 'POST',
          body: JSON.stringify(profile),
        }
      )
      setPublicProfile(payload.profile)
      return payload.profile
    } finally {
      profileLoading.value = false
    }
  }

  return {
    state: sessionState,
    loading,
    profileLoading,
    startOtp,
    verifyOtp,
    logout,
    fetchProfile,
    saveProfile,
  }
}
