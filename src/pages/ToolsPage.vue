<script setup lang="ts">
import { computed, ref } from 'vue'
import toolsIcon from '../assets/icons/tools-hub-v1.png'
import { buildRegionHelpPrompt } from '../core/regionHelpProtocol'
import { REGION_HELP_PROFILES } from '../data/regionHelpProfiles'
import { PAGE_PATHS, navigateTo } from '../constants/navigation'
import QrUrlShareTool from '../components/QrUrlShareTool.vue'

const selectedRegionId = ref(REGION_HELP_PROFILES[0]?.regionId ?? '')
const copyStatus = ref('')
const selectedProfile = computed(() => REGION_HELP_PROFILES.find((profile) => profile.regionId === selectedRegionId.value) ?? REGION_HELP_PROFILES[0])
const regionHelpPrompt = computed(() => selectedProfile.value ? buildRegionHelpPrompt(selectedProfile.value) : '')

async function copyRegionHelpPrompt() {
  try {
    await navigator.clipboard.writeText(regionHelpPrompt.value)
    copyStatus.value = '補助プロンプトをコピーしました。必要な時だけ、ご自身のAIの新規チャットへ貼り付けてください。'
  } catch {
    copyStatus.value = 'コピーできませんでした。下の本文を手動でコピーしてください。'
  }
}

function selectRegion(regionId: string) {
  selectedRegionId.value = regionId
  copyStatus.value = ''
}
</script>

<template>
  <main class="tools-page">
    <header class="tools-hero">
      <img :src="toolsIcon" alt="IZAKAYA Tools" />
      <div>
        <p class="kicker">IZAKAYA TOOLS</p>
        <h1>遊び方と制作を支える道具箱</h1>
        <p>リージョンを遊ぶための必須画面ではありません。迷った時の案内、外部AIへの持ち出し、これから追加する制作・申請ツールを一か所にまとめます。</p>
      </div>
    </header>

    <section class="tool-grid" aria-label="利用できるツール">
      <article class="tool-card tool-card--active">
        <p class="tool-card__status">AVAILABLE</p>
        <h2>URL・QR受け渡し</h2>
        <p>QRを読めないAIにはURLをコピーして渡し、必要なら同じURLからQRを再発行できます。</p>
        <a href="#qr-url">URL・QRツールを開く</a>
      </article>
      <article class="tool-card tool-card--active">
        <p class="tool-card__status">AVAILABLE</p>
        <h2>リージョン会話ヘルプ</h2>
        <p>外部AIで迷った時だけ使う、`IZK: HELP` を含む共通補助プロンプトです。</p>
        <a href="#region-help">補助プロンプトを開く</a>
      </article>
      <article class="tool-card tool-card--active">
        <p class="tool-card__status">AVAILABLE</p>
        <h2>チャットボット試遊</h2>
        <p>公式V2カードを選び、ご自身のAI環境へ持ち出す試遊プロンプトを作ります。</p>
        <button type="button" @click="navigateTo(PAGE_PATHS.chat)">チャット試遊を開く</button>
      </article>
      <article class="tool-card"><p class="tool-card__status">PLANNED</p><h2>V2カード作成プロンプト</h2><p>ユーザー自身のAIでV2カードを確実に作るための、入力補助とプロンプト出力を準備中です。</p></article>
      <article class="tool-card"><p class="tool-card__status">PLANNED</p><h2>記録・リージョン申請</h2><p>公開してよいクエスト記録、サムネイル、プロフィールを分けて提出する窓口です。</p></article>
    </section>

    <QrUrlShareTool />

    <section id="region-help" class="region-help-tool" aria-labelledby="region-help-title">
      <header>
        <p class="kicker">FALLBACK ONLY</p>
        <h2 id="region-help-title">リージョン会話ヘルプ</h2>
        <p>世界・人物・ビジュアルから、そのまま遊び始めてください。これは操作を覚えるための導線ではなく、外部AIで迷った時にだけ開く非常口です。</p>
      </header>
      <div class="region-help-tool__controls">
        <label><span>対象リージョン</span><select v-model="selectedRegionId" @change="copyStatus = ''"><option v-for="profile in REGION_HELP_PROFILES" :key="profile.regionId" :value="profile.regionId">{{ profile.regionName }} · {{ profile.version }}</option></select></label>
        <div class="region-help-tool__quick-list" aria-label="リージョン選択ショートカット"><button v-for="profile in REGION_HELP_PROFILES" :key="profile.regionId" type="button" :class="{ active: profile.regionId === selectedRegionId }" @click="selectRegion(profile.regionId)">{{ profile.regionName }}</button></div>
      </div>
      <div class="region-help-tool__prompt-heading"><strong>{{ selectedProfile?.regionName }} 用の補助プロンプト</strong><button type="button" @click="copyRegionHelpPrompt">コピーする</button></div>
      <textarea :value="regionHelpPrompt" rows="18" readonly aria-label="リージョン共通ヘルプ用プロンプト" />
      <p v-if="copyStatus" class="copy-status" role="status">{{ copyStatus }}</p>
      <p class="boundary-note">このツールはAPIキー、会話ログ、元V2カード、画像原本を受け取りません。コピーした文を、利用者自身が選んだAIへ渡すだけです。</p>
    </section>

    <section class="external-guidance">
      <div><p class="kicker">EXTERNAL AI</p><h2>自分のAI環境で遊ぶ</h2><p>AIのアカウント、APIキー、推論・画像生成費用は、利用者と選んだ提供者の間で管理します。</p></div>
      <div class="external-guidance__actions"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a><a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer">Gemini APIキー公式ガイド</a></div>
    </section>
  </main>
</template>

<style scoped>
.tools-page { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px; padding-bottom: 44px; }
.tools-page > * { min-width: 0; }
.tools-hero, .tool-card, .region-help-tool, .external-guidance { border: 1px solid rgba(255, 255, 255, .12); border-radius: 18px; background: rgba(8, 11, 20, .72); }
.tools-hero { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 22px; padding: clamp(22px, 4vw, 42px); background: radial-gradient(circle at 82% 20%, rgba(255, 52, 144, .18), transparent 34%), rgba(8, 11, 20, .72); }.tools-hero img { width: clamp(68px, 10vw, 126px); height: auto; }
.kicker, .tool-card__status { margin: 0; color: #ff85c7; font-size: 12px; font-weight: 900; letter-spacing: .13em; }.tools-hero h1, .tool-card h2, .region-help-tool h2, .external-guidance h2 { margin: 6px 0 0; color: #fff; }.tools-hero p:last-child, .tool-card p, .region-help-tool header p:last-child, .boundary-note, .external-guidance p { color: rgba(245, 248, 255, .72); line-height: 1.65; }.tools-hero p:last-child { max-width: 820px; }
.tool-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }.tool-card { display: grid; align-content: start; gap: 10px; min-height: 180px; padding: 20px; }.tool-card--active { border-color: rgba(114, 215, 255, .36); }.tool-card--active .tool-card__status { color: #79e8ff; }
.tool-card a, .tool-card button, .region-help-tool__prompt-heading button, .external-guidance a { width: fit-content; min-height: 40px; border: 1px solid rgba(114, 215, 255, .48); border-radius: 999px; padding: 0 14px; background: #72d7ff; color: #06121d; font: inherit; font-weight: 900; line-height: 40px; text-decoration: none; cursor: pointer; }
.region-help-tool { display: grid; gap: 18px; padding: clamp(20px, 3vw, 30px); scroll-margin-top: 24px; }.region-help-tool header { max-width: 920px; }.region-help-tool__controls { display: grid; gap: 12px; }.region-help-tool label { display: grid; gap: 7px; max-width: 360px; color: rgba(245, 248, 255, .88); font-size: 14px; font-weight: 800; }.region-help-tool select, .region-help-tool textarea { box-sizing: border-box; width: 100%; border: 1px solid rgba(255, 255, 255, .18); border-radius: 10px; padding: 10px 12px; background: rgba(3, 7, 16, .78); color: #f5f8ff; font: inherit; }.region-help-tool__quick-list { display: flex; flex-wrap: wrap; gap: 8px; }.region-help-tool__quick-list button { min-height: 34px; border: 1px solid rgba(255, 255, 255, .18); border-radius: 999px; padding: 0 11px; background: rgba(255, 255, 255, .05); color: rgba(245, 248, 255, .82); cursor: pointer; }.region-help-tool__quick-list button.active { border-color: #72d7ff; background: rgba(114, 215, 255, .15); color: #c5f3ff; }.region-help-tool__prompt-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }.region-help-tool textarea { resize: vertical; font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }.copy-status { margin: 0; color: #9effb8; }.boundary-note { margin: 0; border-left: 3px solid #ffcf72; padding-left: 12px; font-size: 14px; }
.external-guidance { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 20px; padding: 24px; }.external-guidance__actions { display: flex; flex-wrap: wrap; gap: 10px; }.external-guidance a { background: rgba(255, 255, 255, .06); color: #bdefff; }
@media (max-width: 860px) { .tool-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .external-guidance { grid-template-columns: 1fr; } } @media (max-width: 620px) { .tools-hero { grid-template-columns: 1fr; } .tool-grid { grid-template-columns: 1fr; } .region-help-tool__prompt-heading { align-items: start; flex-direction: column; } }
</style>
