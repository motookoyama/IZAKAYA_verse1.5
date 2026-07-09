<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { API_BASE } from '../utils/api'

interface Region {
  id: string
  name: string
  status: 'active' | 'dormant' | 'archive'
  is_hero: number
  updated_at: string
}

interface Message {
  role: 'bot' | 'user'
  text: string
  actions?: Array<{ label: string; value: string; type: 'yes' | 'no' }>
}

const regions = ref<Region[]>([])
const chatLog = ref<Message[]>([])
// const isLoading = ref(false)

// Mock "Daily 3 Questions" logic
const dailyQuestions = [
  { text: '未受肉の「開発リージョン」があります。AURA生成を予約しますか？', type: 'aura_pending' },
  { text: '「酔いどれリージョン」のアクセスが増加しています。HeroフラグをONにしますか？', type: 'hero_fame' },
  { text: '最終更新から30日経過したリージョンがあります。アーカイブしますか？', type: 'archive_old' }
]

const fetchRegions = async () => {
  try {
    const res = await fetch(`${API_BASE}/library/warehouse/regions`)
    if (res.ok) {
      const data = await res.json()
      regions.value = data.items || []
    }
  } catch (e) {
    console.error('Failed to fetch regions', e)
  }
}

const toggleHero = async (region: Region) => {
  const newVal = region.is_hero ? 0 : 1
  try {
    const res = await fetch(`${API_BASE}/library/warehouse/regions/${region.id}/hero`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_hero: !!newVal })
    })
    if (res.ok) {
      region.is_hero = newVal
      chatLog.value.push({ role: 'bot', text: `[${region.name}] Hero status synchronized with Librarian.` })
    } else {
      throw new Error('API Error')
    }
  } catch (e) {
    chatLog.value.push({ role: 'bot', text: `Error: Failed to update hero status for ${region.name}.` })
  }
}

const handleAnswer = (answer: string) => {
  chatLog.value.push({ role: 'user', text: answer })
  setTimeout(() => {
    chatLog.value.push({ role: 'bot', text: `承知しました。処理をキューに入れました。` })
  }, 600)
}

onMounted(async () => {
  await fetchRegions()
  
  // Initial Greeting
  chatLog.value.push({ 
    role: 'bot', 
    text: 'おはようございます、Architect。本日の決裁事項は3件です。',
  })
  
  // Ask first question
  setTimeout(() => {
    chatLog.value.push({
      role: 'bot',
      text: dailyQuestions[0]?.text ?? '',
      actions: [
        { label: 'Yes', value: 'yes', type: 'yes' },
        { label: 'No', value: 'no', type: 'no' }
      ]
    })
  }, 1000)
})

const activeRegions = computed(() => regions.value.filter(r => r.status === 'active'))
</script>

<template>
  <div class="backyard">
    <!-- Sidebar: Minimal Management List -->
    <aside class="sidebar">
      <h2 class="sidebar-title">REGION INDEX</h2>
      <div class="region-list">
        <div v-for="reg in activeRegions" :key="reg.id" class="region-item">
          <div class="region-info">
            <span class="region-name">{{ reg.name }}</span>
            <span class="region-id">{{ reg.id }}</span>
          </div>
          <button 
            class="hero-toggle" 
            :class="{ active: reg.is_hero }"
            @click="toggleHero(reg)"
            title="Toggle Hero Exposure"
          >
            ★
          </button>
        </div>
      </div>
    </aside>

    <!-- Main: Chat Console -->
    <main class="chat-console">
      <div class="chat-history">
        <div 
          v-for="(msg, idx) in chatLog" 
          :key="idx" 
          class="message"
          :class="msg.role"
        >
          <div class="message-bubble">{{ msg.text }}</div>
          <div v-if="msg.actions" class="message-actions">
            <button 
              v-for="act in msg.actions" 
              :key="act.value"
              class="action-btn"
              :class="act.type"
              @click="handleAnswer(act.label)"
            >
              {{ act.label }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.backyard {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100vh;
  background: #0b0f14;
  color: #e0e0e0;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  background: #080a0d;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.sidebar-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #58cff5; /* Brand 2 */
  letter-spacing: 0.1em;
  margin-bottom: 20px;
}

.region-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.region-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
}

.region-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.region-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.region-name {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.region-id {
  font-size: 0.65rem;
  font-family: monospace;
  color: rgba(255, 255, 255, 0.4);
}

.hero-toggle {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0 4px;
}

.hero-toggle:hover {
  color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.hero-toggle.active {
  color: #e87b25; /* Brand 1 */
  text-shadow: 0 0 8px rgba(232, 123, 37, 0.5);
}

/* Chat Console */
.chat-console {
  display: flex;
  flex-direction: column;
  padding: 40px;
  background: radial-gradient(circle at top right, rgba(88, 207, 245, 0.05), transparent 40%);
}

.chat-history {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 80%;
  animation: fadeIn 0.4s ease forwards;
}

.message.bot {
  align-self: flex-start;
}

.message.user {
  align-self: flex-end;
  align-items: flex-end;
}

.message-bubble {
  padding: 16px 24px;
  border-radius: 16px;
  font-size: 0.95rem;
  line-height: 1.5;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.message.bot .message-bubble {
  background: rgba(255, 255, 255, 0.08);
  border-top-left-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #e87b25 0%, #d66a15 100%);
  color: #0b0f14;
  font-weight: 600;
  border-top-right-radius: 4px;
}

.message-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 24px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.yes {
  border-color: #58cff5;
  color: #58cff5;
}

.action-btn.yes:hover {
  background: rgba(88, 207, 245, 0.2);
}

.action-btn.no {
  border-color: #ff4d4d;
  color: #ff4d4d;
}

.action-btn.no:hover {
  background: rgba(255, 77, 77, 0.2);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
