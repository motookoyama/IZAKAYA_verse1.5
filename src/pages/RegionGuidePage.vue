<script setup lang="ts">
import { navigateTo } from '../constants/navigation'
import { commercialGateNotice, releaseProfile } from '../core/releaseProfile'

const platforms = [
  'ChatGPT / OpenAI',
  'Gemini',
  'Grok / xAI',
  'SillyTavern / V2カード互換環境',
  'ローカルLLM / 自分で管理するAI環境',
]

const steps = [
  {
    title: '世界を選ぶ',
    body: 'まずはリージョン一覧から、気になる世界を選びます。細かい仕様を読む必要はありません。',
  },
  {
    title: 'カードと設定を持ち出す',
    body: 'V2カード、リージョン設定、画像、導入プロンプトを使い、自分のAI環境で物語を始めます。',
  },
  {
    title: '好きな環境で遊ぶ',
    body: '対応プラットフォームへプロンプトやカードを持ち込み、ユーザー自身の計算コストで遊べます。',
  },
  {
    title: 'もっと遊びたくなったら進む',
    body: '商業ゲート成立後は、初回24時間フリーパスと100P・30日利用権を選べます。現在はPRELAUNCHです。',
  },
]

const v2BuildTips = [
  'リージョン名、役割、プレイヤーとの距離を先に決める。',
  '性格、口調、初回メッセージ、画像プロンプトを分けて書く。',
  '既存キャストと混ざらないよう、所属リージョンと立ち位置を明記する。',
  '完成後はV2カードJSONとして保存し、画像と一緒に確認する。',
]

const playStyles = [
  {
    key: 'same-person',
    title: 'あなた自身が主人公',
    label: '同一化型',
    body: 'プレイヤー本人がリージョンの中心に入ります。裁判、探索、転生、謎解きなど、あなたの選択がそのまま物語になります。',
    suited: '没入して遊びたい人',
  },
  {
    key: 'partner',
    title: 'キャラクターと旅する',
    label: 'パートナー型',
    body: 'あなたとキャラクターは別の存在です。相棒、後見人、先生、依頼者として、会話や成長を積み重ねます。',
    suited: '推しや相棒と関係を育てたい人',
  },
  {
    key: 'observer',
    title: '世界を外から見る',
    label: '観察者型',
    body: 'プレイヤーは世界の外側に立ち、ナレーターや案内役から出来事を聞きます。群像劇、歴史、キャンペーン更新に向きます。',
    suited: '世界観や流れを理解したい人',
  },
  {
    key: 'creator-proxy',
    title: '自作キャラを送り込む',
    label: '創作者代理型',
    body: 'ユーザーが作ったオリジナルキャラクターを、リージョンの主役やパートナーにします。画像、V2カード、Mind Syncと相性がよい遊び方です。',
    suited: '自分のキャラを動かしたい人',
  },
]
</script>

<template>
  <div class="region-guide-page">
    <section class="guide-hero">
      <p class="kicker">First Guide</p>
      <h1>リージョンの遊び方</h1>
      <p>
        IZAKAYA Verseは、好きな世界、キャラクター、V2カード、プロンプトを選び、
        あなたのAI環境へ持ち込んで物語を始めるための入口です。
      </p>
      <div class="hero-actions">
        <button type="button" @click="navigateTo('regions')">リージョンを選ぶ</button>
        <button type="button" class="secondary" @click="navigateTo('library')">カードを見る</button>
      </div>
    </section>

    <section class="guide-grid">
      <article v-for="(step, index) in steps" :key="step.title" class="guide-card">
        <span class="step">{{ index + 1 }}</span>
        <h2>{{ step.title }}</h2>
        <p>{{ step.body }}</p>
      </article>
    </section>

    <section class="playstyle-panel">
      <div class="section-heading">
        <p class="kicker">Play Style</p>
        <h2>リージョンには4つの入り方があります</h2>
        <p>
          最初に「あなたとキャラクターの距離」を決めると、会話、画像、物語の進み方が分かりやすくなります。
          特殊な遊び方もできますが、はじめての人はこの4つから選ぶのがおすすめです。
        </p>
      </div>
      <div class="playstyle-grid">
        <article v-for="style in playStyles" :key="style.key" class="playstyle-card">
          <span>{{ style.label }}</span>
          <h3>{{ style.title }}</h3>
          <p>{{ style.body }}</p>
          <strong>{{ style.suited }}</strong>
        </article>
      </div>
    </section>

    <section class="wide-panel">
      <div>
        <p class="kicker">Platforms</p>
        <h2>好きなプラットフォームで遊べます</h2>
        <p>
          リージョンは一つのアプリに閉じ込めるものではありません。
          カード、プロンプト、QR、画像を使い、あなたの使いやすいAI環境へ持ち込めます。
          IZAKAYAは世界とキャラクターを提供し、AIの実行環境はユーザー自身が選びます。
        </p>
      </div>
      <ul class="platform-list">
        <li v-for="platform in platforms" :key="platform">{{ platform }}</li>
      </ul>
    </section>

    <section class="wide-panel">
      <div>
        <p class="kicker">V2 Build Knowhow</p>
        <h2>担当AIにV2カード作成を教える</h2>
        <p>
          リージョン所属のオリジナルキャラクターを作る場合は、ユーザー側のAIに
          「どの世界の、どんな役割のカードを作るか」を先に教えます。
          IZAKAYAは完成カードだけでなく、V2カードを組み立てるための作法もガイドとして提供します。
        </p>
      </div>
      <ul class="platform-list">
        <li v-for="tip in v2BuildTips" :key="tip">{{ tip }}</li>
      </ul>
    </section>

    <section class="explain-grid">
      <article>
        <h2>QR転生コード</h2>
        <p>
          QRは長文データではなく、リージョンやカードを呼び出す入口です。
          公開後は、ポスター、SNS、ページから同じ世界へ戻るために使います。
        </p>
      </article>
      <article>
        <h2>V2カード</h2>
        <p>
          キャラクターの性格、会話の始まり方、画像、世界との接続をまとめたカードです。
          画像がなくても会話は始められますが、画像があると世界への入りやすさが上がります。
        </p>
      </article>
      <article>
        <h2>利用権とポイント</h2>
        <p>
          {{ releaseProfile.accessModel.firstPass }}。{{ releaseProfile.accessModel.monthlyPass }}。
          {{ commercialGateNotice() }}
        </p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.region-guide-page {
  display: grid;
  gap: 24px;
  padding-bottom: 32px;
}

.guide-hero,
.wide-panel,
.playstyle-panel,
.guide-card,
.playstyle-card,
.explain-grid article {
  border: 1px solid rgba(88, 207, 245, 0.22);
  background: rgba(9, 15, 26, 0.74);
  border-radius: 12px;
}

.guide-hero {
  min-height: 360px;
  display: grid;
  align-content: center;
  gap: 16px;
  padding: clamp(28px, 6vw, 72px);
  background:
    radial-gradient(circle at 75% 18%, rgba(88, 207, 245, 0.25), transparent 34%),
    linear-gradient(145deg, rgba(12, 19, 32, 0.92), rgba(6, 9, 16, 0.96));
}

.kicker {
  margin: 0;
  color: #58cff5;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.guide-hero h1,
.wide-panel h2,
.playstyle-panel h2,
.playstyle-card h3,
.guide-card h2,
.explain-grid h2 {
  margin: 0;
  color: #fff;
}

.guide-hero h1 {
  font-size: clamp(42px, 7vw, 86px);
  line-height: 0.95;
}

.guide-hero p,
.wide-panel p,
.section-heading p,
.playstyle-card p,
.guide-card p,
.explain-grid p {
  margin: 0;
  color: rgba(244, 247, 251, 0.74);
  line-height: 1.75;
}

.guide-hero p {
  max-width: 780px;
  font-size: 18px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

button {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(88, 207, 245, 0.52);
  background: #58cff5;
  color: #041018;
  font-weight: 800;
  cursor: pointer;
}

button.secondary {
  background: rgba(8, 15, 27, 0.72);
  color: #fff;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.guide-card {
  padding: 18px;
  display: grid;
  gap: 10px;
}

.step {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(88, 207, 245, 0.16);
  color: #58cff5;
  font-weight: 900;
}

.wide-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
  gap: 24px;
  padding: 24px;
}

.playstyle-panel {
  display: grid;
  gap: 20px;
  padding: 24px;
}

.section-heading {
  display: grid;
  gap: 10px;
  max-width: 900px;
}

.section-heading h2 {
  font-size: clamp(26px, 4vw, 44px);
}

.playstyle-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.playstyle-card {
  display: grid;
  gap: 10px;
  align-content: start;
  padding: 18px;
}

.playstyle-card span {
  width: fit-content;
  border: 1px solid rgba(88, 207, 245, 0.32);
  border-radius: 999px;
  padding: 4px 10px;
  color: #58cff5;
  font-size: 11px;
  font-weight: 800;
}

.playstyle-card h3 {
  font-size: 18px;
}

.playstyle-card strong {
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
}

.platform-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.platform-list li {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  color: rgba(244, 247, 251, 0.84);
  background: rgba(255, 255, 255, 0.04);
}

.explain-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.explain-grid article {
  padding: 20px;
  display: grid;
  gap: 10px;
}

@media (max-width: 980px) {
  .guide-grid,
  .playstyle-grid,
  .explain-grid,
  .wide-panel {
    grid-template-columns: 1fr;
  }
}
</style>
