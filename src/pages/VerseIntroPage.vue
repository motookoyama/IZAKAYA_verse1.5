<script setup lang="ts">
import { navigateTo } from '../constants/navigation'
import { releaseBadge } from '../core/releaseProfile'

const publicAssetPath = (path: string) => {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/$/, '')}${path}`
}

const verseIntroUrl = 'https://motookoyama.github.io/IZAKAYA_verse1.5/#/verse'

const regions = [
  {
    title: 'メタチューバー',
    copy: '配信の熱、ステージの光、画面越しに交わるキャストたち。',
    image: publicAssetPath('/assets/regions/mtuber_region/selected/sub2.png'),
    path: '#/region/mtuber_region',
  },
  {
    title: 'よいどれ',
    copy: '夜の居酒屋で、誰かの物語にふと居合わせる。',
    image: publicAssetPath('/assets/regions/yoidore_region/selected/sub2.png'),
    path: '#/region/yoidore_region',
  },
  {
    title: 'モビリティ',
    copy: '移動体と未来の風景をめぐる、もうひとつの入口。',
    image: publicAssetPath('/assets/regions/mobility_region/selected/sub1.png'),
    path: '#/region/mobility_region',
  },
]

function go(path: string) {
  navigateTo(path)
}
</script>

<template>
  <article class="verse-intro">
    <section class="hero" aria-labelledby="verse-title">
      <div class="hero__glow hero__glow--a"></div>
      <div class="hero__glow hero__glow--b"></div>
      <p class="eyebrow">{{ releaseBadge() }}</p>
      <h1 id="verse-title">世界を選ぶ。<br />物語は、その先で動き出す。</h1>
      <p class="lead">
        IZAKAYA Verseは、キャラクターと場面に出会い、
        自分のAIと一緒に物語を続けていくための世界集です。
      </p>
      <div class="hero__actions">
        <button class="button button--primary" type="button" @click="go('#/regions')">リージョンを選ぶ</button>
        <button class="button button--quiet" type="button" @click="go('#/region-guide')">遊び方を見る</button>
      </div>
    </section>

    <section class="promise" aria-label="IZAKAYA Verseでできること">
      <p>読むだけでは終わらない。</p>
      <div class="promise__items">
        <span>自分が主人公になる</span>
        <span>相棒と旅をする</span>
        <span>自作キャラクターを送り込む</span>
      </div>
    </section>

    <section class="regions" aria-labelledby="regions-title">
      <div class="section-heading">
        <p class="eyebrow">CHOOSE YOUR REGION</p>
        <h2 id="regions-title">まずは、気になる世界へ。</h2>
      </div>
      <div class="region-grid">
        <button
          v-for="region in regions"
          :key="region.title"
          class="region-card"
          type="button"
          :aria-label="`${region.title}のリージョンを開く`"
          @click="go(region.path)"
        >
          <img :src="region.image" :alt="`${region.title}のイメージ`" />
          <span class="region-card__shade"></span>
          <span class="region-card__body">
            <strong>{{ region.title }}</strong>
            <small>{{ region.copy }}</small>
            <em>この世界へ →</em>
          </span>
        </button>
      </div>
    </section>

    <section class="closing">
      <p class="eyebrow">YOUR AI, YOUR STORY</p>
      <h2>好きな世界を、<br />あなたの手元から始めよう。</h2>
      <div class="closing__cta">
        <button class="button button--primary" type="button" @click="go('#/regions')">IZAKAYA Verseへ入る</button>
        <a class="qr-link" :href="verseIntroUrl" aria-label="IZAKAYA Verse紹介ページを開く">
          <img :src="publicAssetPath('/assets/izakaya/qr_verse_intro.png')" alt="IZAKAYA Verse紹介ページへのQRコード" />
          <span>スマホで開く</span>
        </a>
      </div>
    </section>
  </article>
</template>

<style scoped>
.verse-intro { width: min(1160px, 100%); margin: 0 auto 40px; color: #f6f7ff; }
.hero, .closing { position: relative; overflow: hidden; border: 1px solid rgba(170, 190, 255, .28); border-radius: 24px; background: linear-gradient(135deg, #111a38 0%, #171033 50%, #071724 100%); }
.hero { padding: clamp(48px, 9vw, 112px) clamp(26px, 8vw, 100px); min-height: 500px; display: flex; flex-direction: column; justify-content: center; isolation: isolate; }
.hero__glow { position: absolute; z-index: -1; border-radius: 50%; filter: blur(6px); opacity: .72; }
.hero__glow--a { width: 520px; height: 520px; right: -180px; top: -230px; background: radial-gradient(circle, #6557ff 0%, rgba(101,87,255,0) 68%); }
.hero__glow--b { width: 480px; height: 480px; left: 42%; bottom: -360px; background: radial-gradient(circle, #00d0b4 0%, rgba(0,208,180,0) 68%); }
.eyebrow { margin: 0 0 14px; color: #8be9df; letter-spacing: .18em; font-size: .74rem; font-weight: 800; }
h1, h2, p { margin-top: 0; }
h1 { max-width: 760px; margin-bottom: 24px; font-size: clamp(2.45rem, 6vw, 5.3rem); line-height: 1.14; letter-spacing: -.045em; }
.lead { max-width: 620px; margin-bottom: 32px; color: #d6dbef; font-size: clamp(1rem, 1.8vw, 1.22rem); line-height: 1.85; }
.hero__actions { display: flex; gap: 12px; flex-wrap: wrap; }
.button { border: 1px solid rgba(231,239,255,.45); border-radius: 999px; padding: 13px 21px; color: #fff; cursor: pointer; font: inherit; font-weight: 750; transition: transform .18s ease, background .18s ease; }
.button:hover, .region-card:hover { transform: translateY(-3px); }
.button--primary { border-color: transparent; background: linear-gradient(100deg, #1ee4d5, #7072ff); box-shadow: 0 12px 30px rgba(42, 207, 211, .25); }
.button--quiet { background: rgba(255,255,255,.06); }
.promise { padding: 42px 18px; text-align: center; }
.promise > p { margin-bottom: 18px; color: #c7cce5; font-weight: 700; }
.promise__items { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }
.promise__items span { padding: 8px 14px; border: 1px solid rgba(161,178,225,.23); border-radius: 999px; color: #e7eaff; background: rgba(255,255,255,.035); font-size: .9rem; }
.regions { padding: 32px 0 74px; }
.section-heading { margin-bottom: 24px; }
.section-heading h2, .closing h2 { margin-bottom: 0; font-size: clamp(1.75rem, 3.5vw, 3rem); line-height: 1.22; letter-spacing: -.035em; }
.region-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.region-card { position: relative; min-height: 350px; overflow: hidden; border: 1px solid rgba(170,190,255,.23); border-radius: 18px; padding: 0; background: #11172a; color: #fff; text-align: left; cursor: pointer; transition: transform .18s ease, border-color .18s ease; }
.region-card:hover { border-color: #8be9df; }
.region-card img { width: 100%; height: 100%; position: absolute; inset: 0; object-fit: cover; opacity: .83; }
.region-card__shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(4,8,20,.02) 25%, rgba(4,8,20,.93) 100%); }
.region-card__body { position: absolute; inset: auto 22px 22px; display: grid; gap: 8px; }
.region-card strong { font-size: 1.55rem; letter-spacing: -.035em; }
.region-card small { color: #dbe0ee; line-height: 1.55; }
.region-card em { margin-top: 7px; color: #8be9df; font-size: .86rem; font-style: normal; font-weight: 750; }
.closing { padding: clamp(40px, 7vw, 76px) 22px; text-align: center; background: linear-gradient(135deg, #102439, #1b1740 58%, #122022); }
.closing h2 { margin-bottom: 28px; }
.closing__cta { display: flex; align-items: center; justify-content: center; gap: 18px; }
.qr-link { display: grid; gap: 4px; color: #dce3ff; font-size: .74rem; text-decoration: none; }
.qr-link img { width: 82px; height: 82px; padding: 5px; border-radius: 8px; background: #fff; }
@media (max-width: 760px) { .region-grid { grid-template-columns: 1fr; } .region-card { min-height: 270px; } .hero { min-height: 0; } }
</style>
