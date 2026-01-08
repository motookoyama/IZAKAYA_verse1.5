<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSession } from '../composables/useSession'

const { state, loading, startOtp, verifyOtp, logout, fetchProfile, saveProfile, profileLoading } = useSession()

const emailInput = ref('')
const otpCode = ref('')
const notice = ref<string | null>(null)
const displayName = ref('')
const bio = ref('')
const avatarUrl = ref('')

watch(
  () => state.email,
  (value) => {
    if (value) emailInput.value = value
  },
  { immediate: true }
)

watch(
  () => state.profile,
  (profile) => {
    if (profile) {
      displayName.value = profile.displayName
      bio.value = profile.bio
      avatarUrl.value = profile.avatarUrl
    } else {
      displayName.value = ''
      bio.value = ''
      avatarUrl.value = ''
    }
  },
  { immediate: true }
)

async function handleStart() {
  try {
    const preview = await startOtp(emailInput.value)
    notice.value = preview ? `プレビューコード: ${preview}` : 'メールを確認してください'
    otpCode.value = preview ?? ''
  } catch (error) {
    notice.value = error instanceof Error ? error.message : String(error)
  }
}

async function handleVerify() {
  try {
    await verifyOtp(otpCode.value)
    notice.value = 'ログインしました'
    otpCode.value = ''
    await fetchProfile()
  } catch (error) {
    notice.value = error instanceof Error ? error.message : String(error)
  }
}

async function handleLogout() {
  await logout()
  notice.value = 'ログアウトしました'
}

async function handleProfileSave() {
  if (!displayName.value.trim()) {
    notice.value = 'ハンドル名を入力してください'
    return
  }
  try {
    await saveProfile({
      displayName: displayName.value.trim().slice(0, 80),
      bio: bio.value.trim().slice(0, 600),
      avatarUrl: avatarUrl.value.trim().slice(0, 512),
    })
    notice.value = '公開プロフィールを保存しました'
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'プロフィール保存に失敗しました'
  }
}
</script>

<template>
  <section class="session-panel">
    <header>
      <h3>IZAKAYAアカウント</h3>
      <p v-if="state.status === 'ready'" class="session-panel__status">ログイン済み</p>
      <p v-else class="session-panel__status">未ログイン</p>
    </header>

    <div v-if="state.status === 'ready'" class="session-panel__body">
      <p class="session-panel__user">{{ state.user?.email }}</p>
      <p class="session-panel__user">{{ state.user?.name }}</p>
      <label class="session-panel__field">
        <span>公開ハンドル</span>
        <input v-model="displayName" type="text" placeholder="IZAKAYA Handle" />
      </label>
      <label class="session-panel__field">
        <span>公開ペルソナ</span>
        <textarea v-model="bio" rows="3" placeholder="プロフィール文"></textarea>
      </label>
      <label class="session-panel__field">
        <span>アバターURL</span>
        <input v-model="avatarUrl" type="url" placeholder="https://example.com/avatar.png" />
      </label>
      <div class="session-panel__actions">
        <button type="button" class="session-panel__btn" :disabled="profileLoading" @click="handleProfileSave">
          {{ profileLoading ? '保存中...' : '公開プロフィールを保存' }}
        </button>
        <button type="button" class="session-panel__btn session-panel__btn--ghost" @click="handleLogout">
          サインアウト
        </button>
      </div>
    </div>

    <div v-else class="session-panel__body">
      <label class="session-panel__field">
        <span>メールアドレス</span>
        <input v-model="emailInput" type="email" placeholder="example@izk.dev" />
      </label>
      <button type="button" class="session-panel__btn" :disabled="loading" @click="handleStart">
        OTPコード送信
      </button>
      <label v-if="state.status === 'otpSent'" class="session-panel__field">
        <span>確認コード</span>
        <input v-model="otpCode" type="text" placeholder="6桁のコード" />
      </label>
      <button
        v-if="state.status === 'otpSent'"
        type="button"
        class="session-panel__btn"
        :disabled="loading"
        @click="handleVerify"
      >
        ログイン
      </button>
    </div>

    <p v-if="state.previewCode && state.status === 'otpSent'" class="session-panel__note">
      プレビューコード: <code>{{ state.previewCode }}</code>
    </p>
    <p v-if="notice" class="session-panel__note">{{ notice }}</p>
    <p v-if="state.lastError" class="session-panel__error">{{ state.lastError }}</p>
  </section>
</template>

<style scoped>
.session-panel {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 16px;
  background: rgba(6, 10, 22, 0.8);
  color: #f4f7ff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-panel__status {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
}

.session-panel__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-panel__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
}

.session-panel__field input {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(3, 6, 15, 0.9);
  color: inherit;
}

.session-panel__field textarea {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(3, 6, 15, 0.9);
  color: inherit;
  resize: vertical;
}

.session-panel__btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: #5bd1ff;
  color: #020612;
  font-weight: 600;
  cursor: pointer;
}

.session-panel__btn--ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
}

.session-panel__actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.session-panel__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.session-panel__user {
  margin: 0;
  font-weight: 600;
}

.session-panel__note {
  font-size: 0.85rem;
  color: #a3c9ff;
}

.session-panel__error {
  font-size: 0.85rem;
  color: #ff8e8e;
}
</style>
