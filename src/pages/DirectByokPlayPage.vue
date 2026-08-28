<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import chatIcon from '../assets/icons/chat-frame.png'
import { findNavigatorCard, getIzakayaV2Card, loadNavigatorCard, navigatorCards, type SampleCard } from '../data/sampleCards'

const slots = ref<string[]>(navigatorCards.slice(0, 3).map((card) => card.id))
const playSeed = ref('まずは短い挨拶から、選んだキャラクターとして会話を始めてください。')
const copyStatus = ref('')
const loadedSlotCards = ref<Record<string, SampleCard>>({})
const loadingCards = ref(false)

const selectedCards = computed(() =>
  slots.value
    .map((id) => findNavigatorCard(id))
    .filter((card): card is NonNullable<ReturnType<typeof findNavigatorCard>> => Boolean(card))
)

async function hydrateSelectedCards(ids: string[]) {
  loadingCards.value = true
  try {
    const cards = await Promise.all(ids.map((id) => loadNavigatorCard(id)))
    const next = { ...loadedSlotCards.value }
    for (const card of cards) {
      if (card) next[card.id] = card
    }
    loadedSlotCards.value = next
  } finally {
    loadingCards.value = false
  }
}

watch(slots, (ids) => { void hydrateSelectedCards(ids) }, { immediate: true, deep: true })

function cardContext(id: string, slotIndex: number) {
  const card = loadedSlotCards.value[id] ?? findNavigatorCard(id)
  if (!card) return ''
  const izakayaV2 = getIzakayaV2Card(card.raw)
  if (!izakayaV2) {
    return `Slot${slotIndex + 1}: ${card.name}\nカード設定を読み込み中です。`
  }
  const persona = String(izakayaV2.personaPrompt ?? '').trim()
  const scenario = String(izakayaV2.blueprint?.mission ?? '').trim()
  const firstMessage = String(izakayaV2.first_mes ?? '').trim()
  const lines = [
    `Slot${slotIndex + 1}: ${card.name}`,
    `概要: ${izakayaV2.summary?.trim() || card.summary}`,
    persona ? `人格: ${persona}` : '',
    scenario ? `状況: ${scenario}` : '',
    firstMessage ? `初回の一言: ${firstMessage}` : '',
  ].filter(Boolean)
  return lines.join('\n')
}

const exportedPrompt = computed(() => {
  const cardBlocks = slots.value.map(cardContext).filter(Boolean)
  const instructions = [
    'あなたはIZAKAYA Verse 2.0のロールプレイ補助役です。',
    '以下のV2カード由来の設定を尊重し、ユーザーの発言に日本語で応答してください。',
    '設定にない事実は断定せず、ロールプレイとして安全に補完してください。',
    '最初は長文の自己紹介をせず、短い挨拶または状況描写から始めてください。',
  ]
  return [
    instructions.join('\n'),
    '--- カード設定 ---',
    cardBlocks.join('\n\n'),
    '--- 今回の遊び方 ---',
    playSeed.value.trim() || '自由会話を始めてください。',
  ].join('\n\n')
})

function updateSlot(index: number, id: string) {
  const next = [...slots.value]
  next[index] = id
  slots.value = next
  copyStatus.value = ''
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(exportedPrompt.value)
    copyStatus.value = 'テスト用プロンプトをコピーしました。外部AIの新規チャットへ貼り付けてください。'
  } catch {
    copyStatus.value = 'コピーできませんでした。下のプロンプト欄から手動でコピーしてください。'
  }
}
</script>

<template>
  <main class="byok-play">
    <header class="byok-play__hero">
      <img :src="chatIcon" alt="Chat" class="byok-play__icon" />
      <div>
        <p class="byok-play__eyebrow">DIRECT BYOK · ONLINE</p>
        <h1>チャットボット試遊</h1>
        <p>カードを選び、あなた自身のAI環境で試遊するためのプロンプトを作ります。</p>
      </div>
    </header>

    <section class="byok-play__boundary" aria-label="計算コストとデータの境界">
      <strong>IZAKAYAは推論・画像生成・APIキーを受け取りません。</strong>
      <p>APIキー、課金、会話内容は利用者と選んだAI提供者の間だけで扱われます。この画面はキーを保存せず、サーバーへ送信しません。</p>
    </section>

    <section class="byok-play__steps" aria-label="開始手順">
      <article>
        <span>1</span>
        <h2>自分のAI環境を用意</h2>
        <p>Geminiを使う場合は、Google AI Studioで本人のキーと利用条件を確認します。</p>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI StudioでAPIキーを管理する</a>
        <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer">Gemini APIキーの公式ガイドを読む</a>
      </article>
      <article>
        <span>2</span>
        <h2>カードを選ぶ</h2>
        <p>最大3枚のV2カード設定を、外部AIに貼り付ける試遊プロンプトへまとめます。</p>
      </article>
      <article>
        <span>3</span>
        <h2>外部AIで会話する</h2>
        <p>下のプロンプトをコピーし、本人のアカウントで新規チャットを開始します。</p>
      </article>
    </section>

    <section class="byok-play__builder" aria-label="試遊プロンプト作成">
      <div class="byok-play__builder-heading">
        <div>
          <p class="byok-play__eyebrow">PROMPT BUILDER</p>
          <h2>試遊する組み合わせ</h2>
        </div>
        <span>{{ selectedCards.length }} / 3 cards</span>
      </div>
      <div class="byok-play__slots">
        <label v-for="(_, index) in slots" :key="index">
          <span>Slot {{ index + 1 }}</span>
          <select :value="slots[index]" @change="updateSlot(index, ($event.target as HTMLSelectElement).value)">
            <option v-for="card in navigatorCards" :key="card.id" :value="card.id">{{ card.name }}</option>
          </select>
        </label>
      </div>
      <label class="byok-play__seed">
        <span>今回の遊び方・最初の場面</span>
        <textarea v-model="playSeed" rows="3" maxlength="800" />
      </label>
      <div class="byok-play__prompt-heading">
        <label for="byok-prompt">外部AIへ渡すプロンプト</label>
        <button type="button" :disabled="loadingCards" @click="copyPrompt">{{ loadingCards ? 'カード設定を読込中…' : 'コピーする' }}</button>
      </div>
      <textarea id="byok-prompt" class="byok-play__prompt" :value="exportedPrompt" rows="16" readonly />
      <p v-if="copyStatus" class="byok-play__copy-status" role="status">{{ copyStatus }}</p>
    </section>

    <p class="byok-play__footnote">対応プロバイダーの個別接続は、秘密情報をサイトへ渡さない方式を検証してから追加します。現在この画面はプロンプトの作成・持ち出しだけを提供します。</p>
  </main>
</template>

<style scoped>
.byok-play { display: grid; gap: 22px; padding-bottom: 48px; }
.byok-play__hero, .byok-play__boundary, .byok-play__builder, .byok-play__steps article { border: 1px solid rgba(255,255,255,.13); background: rgba(10,16,30,.68); border-radius: 18px; }
.byok-play__hero { display: flex; align-items: center; gap: 18px; padding: clamp(20px,4vw,34px); }
.byok-play__hero h1, .byok-play__builder h2, .byok-play__steps h2 { margin: 0; }
.byok-play__hero p { margin: 8px 0 0; color: rgba(255,255,255,.78); }
.byok-play__icon { width: clamp(48px,7vw,76px); height: auto; }
.byok-play__eyebrow { margin: 0 0 6px; font-size: .75rem; letter-spacing: .14em; color: #80e5ff; }
.byok-play__boundary { padding: 18px 20px; border-color: rgba(255,195,97,.42); background: rgba(75,48,10,.3); }
.byok-play__boundary p, .byok-play__footnote { margin: 7px 0 0; line-height: 1.55; color: rgba(255,255,255,.78); }
.byok-play__steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.byok-play__steps article { padding: 18px; }
.byok-play__steps span { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #80e5ff; color: #07111e; font-weight: 800; }
.byok-play__steps h2 { margin-top: 12px; font-size: 1rem; }
.byok-play__steps p { color: rgba(255,255,255,.74); line-height: 1.45; }
.byok-play__steps a { display: block; margin-top: 9px; color: #80e5ff; font-size: .88rem; }
.byok-play__builder { padding: clamp(18px,3vw,28px); }
.byok-play__builder-heading, .byok-play__prompt-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.byok-play__builder-heading > span { color: rgba(255,255,255,.6); font-size: .86rem; }
.byok-play__slots { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin: 18px 0; }
.byok-play__slots label, .byok-play__seed { display: grid; gap: 6px; color: rgba(255,255,255,.82); font-size: .88rem; }
.byok-play select, .byok-play textarea { box-sizing: border-box; width: 100%; border: 1px solid rgba(255,255,255,.18); border-radius: 10px; padding: 10px; background: rgba(3,7,16,.75); color: inherit; font: inherit; }
.byok-play__seed { margin-bottom: 18px; }
.byok-play__prompt-heading { margin-bottom: 8px; }
.byok-play__prompt-heading button { border: 0; border-radius: 9px; padding: 9px 14px; background: #80e5ff; color: #07111e; font-weight: 700; cursor: pointer; }.byok-play__prompt-heading button:disabled { cursor: wait; opacity: .65; }
.byok-play__prompt { line-height: 1.5; resize: vertical; }
.byok-play__copy-status { color: #9effb8; font-size: .9rem; }
.byok-play__footnote { font-size: .88rem; }
@media (max-width: 800px) { .byok-play__steps, .byok-play__slots { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .byok-play__hero { align-items: flex-start; } .byok-play__hero { gap: 12px; } }
</style>
