<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import V2QRScanner from '../components/V2QRScanner.vue'
import { decodeReincarnation } from '../utils/reincarnation'
import type { SampleCard } from '../data/sampleCards'

const { t, tm } = useI18n()
const lead = computed(() => (tm('pages.reincarnation.lead') as string[]) || [])
const workflow = computed(() => (tm('pages.reincarnation.workflow') as string[]) || [])
const workflowTitle = computed(() => t('pages.reincarnation.workflowTitle'))
const notesTitle = computed(() => t('pages.reincarnation.notesTitle'))
const notes = computed(() => (tm('pages.reincarnation.notes') as string[]) || [])

const gateKey = import.meta.env.VITE_GATE_KEY
const bffUrl = import.meta.env.VITE_BFF_URL
const result = ref<SampleCard | null>(null)
const copyFeedback = ref(false)

const formattedPrompt = computed(() => {
  if (!result.value) return ''
  const c = result.value
  return `You are ${c.name}.\n\nDESCRIPTION:\n${c.summary}\n\nPERSONALITY:\n${c.raw.personality}\n\nSCENARIO:\n${c.raw.scenario}`
})

function onScanned(data: string) {
  const decoded = decodeReincarnation(data)
  if (decoded) {
    result.value = decoded
  }
}

async function copyToClipboard() {
  if (!formattedPrompt.value) return
  try {
    await navigator.clipboard.writeText(formattedPrompt.value)
    copyFeedback.value = true
    setTimeout(() => {
      copyFeedback.value = false
    }, 2000)
  } catch (err) {
    console.error('Copy failed', err)
  }
}

function clearResult() {
  result.value = null
}
</script>

<template>
  <div class="reincarnation-page">
    <header class="page-header">
      <h1 class="page-title">{{ t('pages.reincarnation.title') }}</h1>
      <div class="page-lead">
        <p v-for="line in lead" :key="line">{{ line }}</p>
      </div>
    </header>

    <div class="page-grid">
      <section class="scanner-section">
        <V2QRScanner :gate-key="gateKey" :bff-url="bffUrl" @scanned="onScanned" />
        
        <div v-if="result" class="result-card glass">
          <div class="result-header">
            <span class="badge">DETECTED</span>
            <h3>{{ result.name }}</h3>
          </div>
          <p class="result-summary">{{ result.summary }}</p>
          
          <div class="result-actions">
            <button class="btn-copy" @click="copyToClipboard">
              {{ copyFeedback ? t('pages.reincarnation.copySuccess') : t('pages.reincarnation.extractButton') }}
            </button>
            <button class="btn-clear" @click="clearResult">×</button>
          </div>
        </div>
      </section>

      <aside class="info-section">
        <div class="guide-box glass">
          <h3>{{ workflowTitle }}</h3>
          <ul>
            <li v-for="step in workflow" :key="step">{{ step }}</li>
          </ul>
        </div>

        <div class="guide-box glass">
          <h3>{{ notesTitle }}</h3>
          <ul>
            <li v-for="note in notes" :key="note">{{ note }}</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.reincarnation-page {
  display: grid;
  gap: 40px;
  animation: fade-in 0.6s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: grid;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-lead {
  max-width: 800px;
  opacity: 0.8;
  line-height: 1.6;
}

.page-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  align-items: start;
}

.scanner-section {
  display: grid;
  gap: 24px;
}

.info-section {
  display: grid;
  gap: 24px;
}

.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
}

.guide-box h3 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: var(--brand-2, #58cff5);
}

.guide-box ul {
  margin: 0;
  padding-left: 1.2rem;
  display: grid;
  gap: 10px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.result-card {
  display: grid;
  gap: 16px;
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.05);
  position: relative;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  background: #10b981;
  color: #000;
  border-radius: 4px;
}

.result-summary {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-actions {
  display: flex;
  gap: 12px;
}

.btn-copy {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background: #10b981;
  color: #000;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-copy:hover {
  background: #34d399;
  transform: translateY(-2px);
}

.btn-clear {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
}

@media (max-width: 900px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
