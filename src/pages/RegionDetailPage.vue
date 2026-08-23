<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { findShowcaseRegion } from '../data/regions_v3'
import { PAGE_PATHS, navigateTo } from '../constants/navigation'
import { commercialGateNotice, releaseBadge } from '../core/releaseProfile'

type RegionScene = {
  label: string
  title: string
  body: string
  image: string
}

type RegionCard = {
  name: string
  role: string
  image: string
  file?: string
  note?: string
}

type RegionPageSpec = {
  id: string
  eyebrow: string
  title: string
  lead: string
  visualTitle: string
  visualBody: string
  logo?: string
  heroImage?: string
  statusSticker?: string
  statusNote?: string
  scenes: RegionScene[]
  cards: RegionCard[]
  flow: Array<{ title: string; body: string }>
  createTitle: string
  createBody: string
  createPrice: string
}

const currentHash = ref(typeof window !== 'undefined' ? window.location.hash : PAGE_PATHS.regions)

const publicAssetPath = (path: string) => {
  if (!path || /^(https?:|data:|blob:)/.test(path) || !path.startsWith('/')) return path
  const base = import.meta.env.BASE_URL || '/'
  if (base !== '/' && path.startsWith(base)) return path
  return `${base.replace(/\/$/, '')}${path}`
}

const regionId = computed(() => {
  const raw = currentHash.value.replace(/^#\/?/, '')
  if (!raw.startsWith('region/')) return ''
  return raw.slice('region/'.length)
})

const region = computed(() => findShowcaseRegion(regionId.value))

const cardAssets = {
  exeMachina: new URL('../assets/v2cards/エグゼ・マキナ.png', import.meta.url).href,
  kokoroeYouma: new URL('../assets/v2cards/ココロエ・ヨウマ.png', import.meta.url).href,
  dagamiTenkai: new URL('../assets/v2cards/ダガミ・テンカイ.png', import.meta.url).href,
  hawatariZan: new URL('../assets/v2cards/ハワタリ・ザン.png', import.meta.url).href,
  hawawa: new URL('../assets/v2cards/ハワワ.png', import.meta.url).href,
  miyakoSwim: new URL('../assets/v2cards/ミヤコ・スイム.png', import.meta.url).href,
  yoridokoroYuika: new URL('../assets/v2cards/ヨリドコロ・ユイカ.png', import.meta.url).href,
  oshimashiInc: new URL('../assets/v2cards/株式会社オシマシ.png', import.meta.url).href,
  anna: new URL('../assets/v2cards/generated/アンナ_ガルバルディ_20260619073956.png', import.meta.url).href,
  marlow: new URL('../assets/v2cards/generated/マーロウ_ブラックフィン_20260619074339.png', import.meta.url).href,
  baldo: new URL('../assets/v2cards/generated/バルド_オールドキール_20260619074357.png', import.meta.url).href,
  astraia: new URL('../assets/v2cards/generated/アストライア_リライト_20260619074416.png', import.meta.url).href,
  lumiel: new URL('../assets/v2cards/generated/ルミエル_セーフガード_20260619074432.png', import.meta.url).href,
  velvet: new URL('../assets/v2cards/generated/ヴェルベット_ナイトフォール_20260619074501.png', import.meta.url).href,
}

const cardFiles = {
  exeMachina: new URL('../data/v2cards/エグゼ・マキナ.json', import.meta.url).href,
  kokoroeYouma: new URL('../data/v2cards/ココロエ・ヨウマ.json', import.meta.url).href,
  dagamiTenkai: new URL('../data/v2cards/ダガミ・テンカイ.json', import.meta.url).href,
  hawatariZan: new URL('../data/v2cards/ハワタリ・ザン.json', import.meta.url).href,
  hawawa: new URL('../data/v2cards/ハワワ.json', import.meta.url).href,
  miyakoSwim: new URL('../data/v2cards/ミヤコ・スイム.json', import.meta.url).href,
  yoridokoroYuika: new URL('../data/v2cards/ヨリドコロ・ユイカ.json', import.meta.url).href,
  oshimashiInc: new URL('../data/v2cards/株式会社オシマシ.json', import.meta.url).href,
  anna: new URL('../data/v2cards/アンナ・ガルバルディ.json', import.meta.url).href,
  marlow: new URL('../data/v2cards/マーロウ・ブラックフィン.json', import.meta.url).href,
  baldo: new URL('../data/v2cards/バルド・オールドキール.json', import.meta.url).href,
  astraia: new URL('../data/v2cards/アストライア・リライト.json', import.meta.url).href,
  lumiel: new URL('../data/v2cards/ルミエル・セーフガード.json', import.meta.url).href,
  velvet: new URL('../data/v2cards/ヴェルベット・ナイトフォール.json', import.meta.url).href,
}

const pageSpecs: Record<string, RegionPageSpec> = {
  mtuber_region: {
    id: 'mtuber_region',
    eyebrow: releaseBadge(),
    title: 'メタチューバー',
    logo: '/assets/regions/mtuber_region/selected/logo_meta_tuber_0001.png',
    statusSticker: 'PRELAUNCH',
    statusNote: commercialGateNotice(),
    lead: '目録で採用されたシーンと公式V2カードから入る、配信スタジオ型リージョンです。キャスト、観客、ステージの熱量を見て、自分のAI環境へ持ち込む入口を選んでください。',
    visualTitle: 'ロゴ、ステージ、キャストで世界を一気に伝える場所。',
    visualBody: 'このページのメインビジュアルは目録のMAIN/SUB登録を正本にします。目録で人間が採用したロゴとシーンだけを公開面へ出し、カード画像はキャラクターカードとして別枠に置きます。',
    scenes: [
      { label: 'SUB1', title: '一期生ラインアップ', body: 'ステージに立つキャストたちを一目で見せる、メタチューバーの集合ビジュアル。', image: '/assets/regions/mtuber_region/selected/sub0.png' },
      { label: 'SUB2', title: 'ショーケースステージ', body: 'ライブ、転生、マスコットの気配が同居する、放送リージョンの入口シーン。', image: '/assets/regions/mtuber_region/selected/sub1.png' },
      { label: 'SUB3', title: '配信ユニット', body: 'カメラ、観客、ペンライト、キャストの距離感が近い、遊び始めの熱量を伝えるシーン。', image: '/assets/regions/mtuber_region/selected/sub2.png' },
    ],
    cards: [
      { name: 'エグゼ・マキナ', role: '配信演出と進行を支える中核キャスト', image: cardAssets.exeMachina, file: cardFiles.exeMachina },
      { name: 'ココロエ・ヨウマ', role: '企画の温度を読み、会話の芯を整えるナビゲーター', image: cardAssets.kokoroeYouma, file: cardFiles.kokoroeYouma },
      { name: 'ダガミ・テンカイ', role: '展開の切り替えとステージ進行を担う演出役', image: cardAssets.dagamiTenkai, file: cardFiles.dagamiTenkai },
      { name: 'ハワタリ・ザン', role: '緊張感と型を持ち込み、配信空間を引き締める武芸派', image: cardAssets.hawatariZan, file: cardFiles.hawatariZan },
      { name: 'ハワワ', role: '初回入場者を明るく迎えるスターター', image: cardAssets.hawawa, file: cardFiles.hawawa },
      { name: 'ミヤコ・スイム', role: '空気を軽くして会話を動かす案内役', image: cardAssets.miyakoSwim, file: cardFiles.miyakoSwim },
      { name: 'ヨリドコロ・ユイカ', role: 'ユーザーとキャストの距離を近づけるよりどころ', image: cardAssets.yoridokoroYuika, file: cardFiles.yoridokoroYuika },
      { name: '株式会社オシマシ', role: 'リージョン運用と企画を束ねる組織カード', image: cardAssets.oshimashiInc, file: cardFiles.oshimashiInc },
    ],
    flow: [
      { title: 'まず雰囲気を見る', body: '配信スタジオ、キャスト、運用カードを眺めて、このリージョンの遊び方を掴みます。' },
      { title: 'カードを持ち出す', body: 'V2カードを起点に、配信準備、企画相談、キャラクター会話の設定を自分のAI環境へ渡します。' },
      { title: '主人公カードで参加する', body: '自分のV2カードを作り、IZAKAYA Verseのリージョン設定と組み合わせて体験に接続します。' },
    ],
    createTitle: 'このリージョン所属の新キャラを作る',
    createBody: 'ユーザーのオリジナルV2カードを、自分のAI環境でメタチューバー所属キャストとして作るためのガイドです。原本と画像は手元に保存し、公式目録への登録はこの段階では行いません。',
    createPrice: 'セルフV2作成（ユーザー自身のAI環境）',
  },
  reincarnation_judgment: {
    id: 'reincarnation_judgment',
    eyebrow: releaseBadge(),
    title: '転生裁判',
    heroImage: '/assets/regions/reincarnation_judgment/selected/sub1.png',
    statusNote: commercialGateNotice(),
    lead: '魂の転生先を、女神裁判官、守護天使、誘惑の悪魔が審理するリージョンです。荘厳さ、救済、誘惑を同じ法廷に置き、ユーザーの選択で物語の温度が変わります。',
    visualTitle: '天上の法廷で、魂の行き先を選ぶ。',
    visualBody: '目録で採用された裁判シーンを正本にし、キャラクターカードは審理に参加する役割として分離します。2.0の継承候補として検品します。',
    scenes: [
      { label: 'SUB1', title: '転生法廷', body: '裁きと祈りが同じ空間に立ち上がる、リージョン全体の基準シーン。', image: '/assets/regions/reincarnation_judgment/selected/sub0.png' },
      { label: 'SUB2', title: '光の審理', body: '救済と再出発の気配を見せる、ユーザーが入りやすい転生導入。', image: '/assets/regions/reincarnation_judgment/selected/sub1.png' },
      { label: 'SUB3', title: '裁判の余白', body: '選択肢の揺れや誘惑を残す、会話開始前の緊張感。', image: '/assets/regions/reincarnation_judgment/selected/sub2.png' },
    ],
    cards: [
      { name: 'アストライア・リライト', role: '魂の記録を読み替える女神裁判官', image: cardAssets.astraia, file: cardFiles.astraia },
      { name: 'ルミエル・セーフガード', role: 'ユーザーを守りながら審理を支える守護天使', image: cardAssets.lumiel, file: cardFiles.lumiel },
      { name: 'ヴェルベット・ナイトフォール', role: '別の選択を囁く誘惑の悪魔', image: cardAssets.velvet, file: cardFiles.velvet },
    ],
    flow: [
      { title: '罪状ではなく状況を見る', body: 'まず自分がどんな魂として呼ばれたのかを確認します。' },
      { title: '裁判官たちに答える', body: '女神、天使、悪魔の問いに返答し、転生先の方向を決めます。' },
      { title: '主人公として転生する', body: 'V2カードを使って、裁判結果をリージョン体験へ接続します。' },
    ],
    createTitle: '転生者カードを作る',
    createBody: 'この法廷に呼び出される魂、裁判官、守護者、誘惑者を、自分のAI環境で作るためのガイドです。公式への掲載・投稿はこの段階では行いません。',
    createPrice: 'セルフV2作成（ユーザー自身のAI環境）',
  },
  yoidore_region: {
    id: 'yoidore_region',
    eyebrow: releaseBadge(),
    title: 'よいどれ',
    heroImage: '/assets/regions/yoidore_region/selected/sub2.png',
    statusNote: commercialGateNotice(),
    lead: '酒場、港、海賊、旅人の声が混ざる会話リージョンです。人間味のあるやり取りを中心に、食事、噂、依頼、夜の空気から物語を始めます。',
    visualTitle: '港の酒場で、会話から物語が始まる。',
    visualBody: '目録採用シーンの酒場感と海賊キャストを前面に出し、カードは話しかける相手として分離します。',
    scenes: [
      { label: 'SUB1', title: '酒場の顔役', body: 'リージョンの会話温度を作る、人物中心の導入シーン。', image: '/assets/regions/yoidore_region/selected/sub1.png' },
      { label: 'SUB2', title: '酔いどれの灯り', body: '酒場の喧騒と夜の港を感じさせる、公開ページの背景軸。', image: '/assets/regions/yoidore_region/selected/sub2.png' },
    ],
    cards: [
      { name: 'アンナ・ガルバルディ', role: '酒場の空気を明るくする案内役', image: cardAssets.anna, file: cardFiles.anna },
      { name: 'マーロウ・ブラックフィン', role: '海と噂を連れてくる黒鰭の語り手', image: cardAssets.marlow, file: cardFiles.marlow },
      { name: 'バルド・オールドキール', role: '古い樽と古い約束を知る酒場の重鎮', image: cardAssets.baldo, file: cardFiles.baldo },
    ],
    flow: [
      { title: '席につく', body: 'まず店の空気を読み、誰に声をかけるかを決めます。' },
      { title: '一言目を決める', body: '噂、注文、旅の目的を設定し、自分のAI環境で会話を始める準備をします。' },
      { title: '依頼や関係を広げる', body: '気に入ったキャストから、港の物語を深く進めます。' },
    ],
    createTitle: '酒場の新キャストを作る',
    createBody: '常連、船乗り、料理人、旅人など、よいどれ所属の新しいV2カードを自分のAI環境で作り、手元に保存する導線です。',
    createPrice: 'セルフV2作成（ユーザー自身のAI環境）',
  },
  mobility_region: {
    id: 'mobility_region',
    eyebrow: releaseBadge(),
    title: 'モビリティ',
    heroImage: '/assets/regions/mobility_region/selected/sub1.png',
    statusNote: commercialGateNotice(),
    lead: '移動体、ロボティクス、未来交通を主題にした技術リージョンです。メカ系キャラクターカードは制作評価中のため、まずはシーンと設計思想を中心に見せます。',
    visualTitle: '移動する機構と、未来交通の物語。',
    visualBody: 'プロンプト評価は高く、メカのカード画像は慎重に扱います。今回は目録採用シーンを中心に、リージョンの方向性を公開します。',
    scenes: [
      { label: 'SUB1', title: '機動体の入口', body: 'モビリティリージョンの速度感と機構感を伝える採用シーン。', image: '/assets/regions/mobility_region/selected/sub0.png' },
      { label: 'SUB2', title: '軌道と制御', body: '交通、制御、センサーの雰囲気を見せる技術寄りのシーン。', image: '/assets/regions/mobility_region/selected/sub1.png' },
      { label: 'SUB3', title: '未来移動の試験場', body: 'メカの形状指定を深めるための、公開前レビュー用の採用シーン。', image: '/assets/regions/mobility_region/selected/sub2.png' },
    ],
    cards: [],
    flow: [
      { title: '機構を見る', body: '車輪、装甲、センサー、腕、上部装置などのシルエットを読む。' },
      { title: '用途を選ぶ', body: '輸送、護衛、探索、整備など、どの役割で動かすかを決める。' },
      { title: 'カード化へ進む', body: '納得できるメカ画像ができた段階で、V2カードとして登録します。' },
    ],
    createTitle: 'メカV2カードを設計する',
    createBody: 'モビリティは人物用プロンプトではなく、パーツ、機構、用途、シルエット指定を重くしたセルフV2制作ガイドへ接続します。',
    createPrice: 'セルフV2作成（ユーザー自身のAI環境）',
  },
  ambient_region: {
    id: 'ambient_region',
    eyebrow: releaseBadge(),
    title: 'アンビエント',
    heroImage: '/assets/regions/ambient_region/selected/main.png',
    statusNote: commercialGateNotice(),
    lead: '静けさ、余白、空気感を楽しむ審美リージョンです。強い事件よりも、滞在、風景、音、短い対話で世界を味わいます。',
    visualTitle: '静かな景色に、会話の余白を置く。',
    visualBody: '目録採用シーンを使って、低ノイズで入りやすいリージョン体験を見せます。カードは今後の滞在者や案内役として追加できます。',
    scenes: [
      { label: 'MAIN', title: '静謐の入口', body: 'アンビエントの第一印象を作るメインビジュアル。', image: '/assets/regions/ambient_region/selected/main.png' },
      { label: 'SUB1', title: '余白の風景', body: '言葉を急がず、眺める時間を作るシーン。', image: '/assets/regions/ambient_region/selected/sub0.png' },
      { label: 'SUB2', title: '光と空気', body: 'BGMや短い会話と相性のよい、低刺激の採用シーン。', image: '/assets/regions/ambient_region/selected/sub1.png' },
      { label: 'SUB3', title: '滞在の余韻', body: '再訪したくなる静かな印象を残すシーン。', image: '/assets/regions/ambient_region/selected/sub2.png' },
    ],
    cards: [],
    flow: [
      { title: '景色を見る', body: 'まずは背景と空気を眺めて、リージョンの温度に入ります。' },
      { title: '短い導入を作る', body: '長い命令より、一言の感想や問いかけを決め、自分のAI環境へ持ち込みます。' },
      { title: '滞在を重ねる', body: '気に入った空気を、カードやBGMと一緒に育てます。' },
    ],
    createTitle: '滞在者カードを作る',
    createBody: '静かな案内役、観測者、旅人など、アンビエントに合うV2カードを自分のAI環境で作り、手元に保存する導線です。',
    createPrice: 'セルフV2作成（ユーザー自身のAI環境）',
  },
  iz_help_nexus: {
    id: 'iz_help_nexus',
    eyebrow: releaseBadge(),
    title: 'IZヘルプ',
    heroImage: '/assets/regions/iz_help_nexus/selected/main.png',
    statusSticker: 'STATIC GUIDE',
    statusNote: 'IZヘルプの静的ガイドは誰でも読めます。利用権の販売・発行は商業ゲート成立後にのみ開始します。',
    lead: '初めて来たユーザーが、リージョン、V2カード、QR転生、セルフ制作、持ち出し型の遊び方を理解するための公式案内リージョンです。',
    visualTitle: '迷ったら、まずここから。',
    visualBody: '目録採用画像を使い、ヘルプを単なるFAQではなく、世界へ入るための案内ページとして見せます。',
    scenes: [
      { label: 'MAIN', title: '公式案内口', body: 'ユーザーが迷わず最初に入れるヘルプの顔。', image: '/assets/regions/iz_help_nexus/selected/main.png' },
      { label: 'SUB1', title: '導線確認', body: 'QRや入口の意味を伝えるための採用シーン。', image: '/assets/regions/iz_help_nexus/selected/sub1.png' },
      { label: 'SUB2', title: 'ヘルプの余白', body: '説明疲れを起こさず、次のページへ案内するための補助シーン。', image: '/assets/regions/iz_help_nexus/selected/sub2.jpg' },
    ],
    cards: [],
    flow: [
      { title: '遊び方を読む', body: 'リージョン、V2カード、自分のAI環境への持ち出し方を短く確認します。' },
      { title: '行き先を選ぶ', body: 'リージョン、カード、セルフV2制作、ガイドのどこへ行くかを決めます。' },
      { title: '困ったら戻る', body: '画像、カード、QR、利用権の案内で迷った時に戻る場所です。' },
    ],
    createTitle: '案内カードを追加する',
    createBody: '必要に応じて、ヘルプ担当の案内キャラクターや運用カードを自分のAI環境で作る導線です。',
    createPrice: 'セルフV2作成（ユーザー自身のAI環境）',
  },
}

const page = computed(() => {
  const spec = pageSpecs[regionId.value]
  if (spec) return spec
  const fallback = region.value
  if (!fallback) return null
  return {
    id: fallback.id,
    eyebrow: releaseBadge(),
    title: fallback.label_jp,
    lead: fallback.description,
    visualTitle: `${fallback.label_jp}の入口`,
    visualBody: 'このリージョンは目録採用画像の登録待ちです。共通テンプレートで表示しています。',
    scenes: [],
    cards: [],
    flow: [
      { title: '世界を選ぶ', body: 'リージョンのテーマと空気を確認します。' },
      { title: 'キャストを見る', body: '登録カードがある場合は、持ち出す相手や役割を選びます。' },
      { title: '体験へ進む', body: '共通ガイドを読み、自分のAI環境で始める準備をします。' },
    ],
    createTitle: '新しいカードを作る',
    createBody: 'このリージョン所属のV2カード制作導線です。',
    createPrice: 'セルフV2作成（ユーザー自身のAI環境）',
  } satisfies RegionPageSpec
})

const activeScenes = computed(() => page.value?.scenes ?? [])
const heroVisual = computed(() => page.value?.logo || page.value?.heroImage || activeScenes.value[0]?.image || '')
const cards = computed(() => page.value?.cards ?? [])

const onHash = () => {
  currentHash.value = window.location.hash || PAGE_PATHS.regions
}

const goBack = () => navigateTo(PAGE_PATHS.regions)
const goGuide = () => navigateTo(PAGE_PATHS.region_guide)
const goCreate = () => navigateTo(PAGE_PATHS.region_guide)

onMounted(() => {
  window.addEventListener('hashchange', onHash)
  if (!region.value) navigateTo(PAGE_PATHS.regions)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', onHash)
})
</script>

<template>
  <div v-if="region && page" class="region-story-page">
    <section class="story-hero">
      <div class="story-hero__copy">
        <button type="button" class="back-btn" @click="goBack">Back To Regions</button>
        <p class="kicker">{{ page.eyebrow }}</p>
        <div class="hero-visual" :class="{ 'hero-visual--logo': page.logo }" :aria-label="page.title">
          <img v-if="heroVisual" :src="publicAssetPath(heroVisual)" :alt="page.title" />
          <h1 v-else>{{ page.title }}</h1>
          <span v-if="page.statusSticker" class="free-sticker">{{ page.statusSticker }}</span>
        </div>
        <p class="lead">{{ page.lead }}</p>
        <p v-if="page.statusNote" class="free-note">{{ page.statusNote }}</p>
        <div class="hero-actions">
          <button type="button" @click="goGuide">持ち出し方を見る</button>
          <button type="button" class="secondary" @click="goBack">リージョン一覧</button>
        </div>
      </div>

      <div class="scene-board" aria-label="目録採用シーン">
        <article v-for="scene in activeScenes" :key="`${scene.label}-${scene.image}`" class="scene-card">
          <img :src="publicAssetPath(scene.image)" :alt="scene.title" />
          <div>
            <span>{{ scene.label }}</span>
            <h2>{{ scene.title }}</h2>
            <p>{{ scene.body }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="intro-band">
      <div>
        <p class="kicker">What Is This Region?</p>
        <h2>{{ page.visualTitle }}</h2>
      </div>
      <p>{{ page.visualBody }}</p>
    </section>

    <section class="flow-grid" aria-label="遊び方">
      <article v-for="(step, index) in page.flow" :key="step.title">
        <span>{{ index + 1 }}</span>
        <h2>{{ step.title }}</h2>
        <p>{{ step.body }}</p>
      </article>
    </section>

    <section class="cast-section">
      <header>
        <p class="kicker">V2 Card Cast</p>
        <h2>公式V2カードを選んで入る</h2>
        <p>
          所属キャストはキャラクターカードとして扱います。商業ゲート成立前は、販売・ポイント消費・
          利用権発行を開始しません。オリジナルV2カードはユーザー自身のAI環境で作成・保存します。
        </p>
      </header>

      <div v-if="cards.length" class="cast-grid">
        <article v-for="card in cards" :key="card.name" class="cast-card">
          <img :src="card.image" :alt="card.name" />
          <div>
            <h3>{{ card.name }}</h3>
            <p>{{ card.role }}</p>
            <p v-if="card.note" class="card-note">{{ card.note }}</p>
            <span v-if="card.file" class="download-link download-link--disabled">カードデータ：PRELAUNCH</span>
          </div>
        </article>
      </div>
      <div v-else class="empty-cast">
        <strong>カード登録準備中</strong>
        <p>このリージョンは、目録採用シーンを先に公開します。キャラクターカードは制作・Mind Sync確認後に追加します。</p>
      </div>
    </section>

    <section class="create-cta">
      <div>
        <p class="kicker">Create Your Cast</p>
        <h2>{{ page.createTitle }}</h2>
        <p>{{ page.createBody }}</p>
      </div>
      <div class="price-panel">
        <strong>{{ page.createPrice }}</strong>
        <button type="button" @click="goCreate">作成フローを開く</button>
      </div>
    </section>

    <section class="guide-cta">
      <div>
        <p class="kicker">Need Help?</p>
        <h2>全リージョン共通の遊び方へ</h2>
        <p>
          QR転生コード、V2カード、24時間初回券、100P・30日利用権、外部AI環境への持ち出し方は共通解説ページで確認できます。
        </p>
      </div>
      <div class="guide-cta__actions">
        <button type="button" @click="goGuide">詳しい解説を見る</button>
        <button type="button" class="secondary" @click="goBack">リージョン一覧へ戻る</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.region-story-page {
  display: grid;
  gap: 22px;
  padding-bottom: 36px;
}

.story-hero {
  min-height: 640px;
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(360px, 0.72fr);
  gap: 28px;
  align-items: stretch;
  padding: clamp(20px, 4vw, 48px);
  border: 1px solid rgba(255, 84, 180, 0.3);
  border-radius: 18px;
  background:
    radial-gradient(circle at 72% 16%, rgba(63, 205, 255, 0.22), transparent 32%),
    radial-gradient(circle at 14% 82%, rgba(255, 72, 170, 0.22), transparent 34%),
    linear-gradient(135deg, #130f21, #080b12 52%, #160b17);
  overflow: hidden;
}

.story-hero__copy,
.scene-board,
.intro-band,
.flow-grid article,
.cast-section,
.cast-card,
.guide-cta,
.create-cta {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(8, 11, 20, 0.72);
}

.story-hero__copy {
  display: grid;
  align-content: center;
  gap: 18px;
  padding: clamp(18px, 3vw, 34px);
  border-radius: 16px;
}

.back-btn {
  width: fit-content;
  min-height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #f7fbff;
  border-radius: 999px;
  padding: 0 13px;
  cursor: pointer;
}

.kicker {
  margin: 0;
  color: #72d7ff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-visual {
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 300px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  border: 1px solid rgba(114, 215, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.hero-visual--logo {
  min-height: 210px;
  background:
    linear-gradient(45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%),
    rgba(255, 255, 255, 0.05);
  background-position: 0 0, 0 12px, 12px -12px, -12px 0;
  background-size: 24px 24px;
}

.hero-visual img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 430px;
  object-fit: cover;
}

.hero-visual--logo img {
  width: 100%;
  max-width: 620px;
  height: auto;
  max-height: 280px;
  object-fit: contain;
  filter: drop-shadow(0 0 28px rgba(104, 224, 255, 0.36));
}

.hero-visual h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(42px, 8vw, 94px);
}

.free-sticker {
  position: absolute;
  top: 18px;
  right: -18px;
  transform: rotate(12deg);
  display: inline-grid;
  place-items: center;
  min-width: 140px;
  min-height: 54px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  background: #ffef4d;
  color: #2a1600;
  font-size: 18px;
  font-weight: 950;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.32);
}

.lead,
.free-note {
  max-width: 760px;
  margin: 0;
  color: rgba(245, 248, 255, 0.82);
  font-size: 17px;
  line-height: 1.75;
}

.free-note {
  border-left: 3px solid #ffef4d;
  padding-left: 12px;
  color: #fff3a8;
  font-size: 14px;
}

.hero-actions,
.guide-cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

button {
  min-height: 44px;
  border: 1px solid rgba(114, 215, 255, 0.48);
  border-radius: 999px;
  padding: 0 18px;
  background: #72d7ff;
  color: #06121d;
  font-weight: 900;
  cursor: pointer;
}

button.secondary {
  background: rgba(255, 255, 255, 0.06);
  color: #f7fbff;
}

.scene-board {
  display: grid;
  gap: 14px;
  align-content: center;
  padding: 16px;
  border-radius: 16px;
}

.scene-card {
  min-height: 190px;
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
}

.scene-card img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 10px;
  background: #111827;
}

.cast-card img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 10px;
  background: #111827;
}

.scene-card h2,
.cast-card h3,
.intro-band h2,
.flow-grid h2,
.cast-section h2,
.guide-cta h2,
.create-cta h2 {
  margin: 0;
  color: #fff;
}

.scene-card p,
.cast-card p,
.intro-band p,
.flow-grid p,
.cast-section p,
.guide-cta p,
.create-cta p,
.empty-cast p {
  margin: 0;
  color: rgba(245, 248, 255, 0.72);
  line-height: 1.65;
}

.scene-card span {
  display: inline-flex;
  width: fit-content;
  margin-bottom: 8px;
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(255, 84, 180, 0.18);
  color: #ff9ed8;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.intro-band,
.guide-cta,
.create-cta {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
  gap: 22px;
  align-items: center;
  padding: clamp(20px, 3vw, 30px);
  border-radius: 16px;
}

.intro-band h2,
.guide-cta h2,
.create-cta h2 {
  font-size: clamp(24px, 3vw, 38px);
  line-height: 1.18;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.flow-grid article {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 14px;
}

.flow-grid span {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 84, 180, 0.18);
  color: #ff9ed8;
  font-weight: 950;
}

.cast-section {
  display: grid;
  gap: 18px;
  padding: clamp(18px, 3vw, 28px);
  border-radius: 16px;
}

.cast-section header {
  max-width: 860px;
}

.cast-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.cast-card {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
}

.card-note {
  font-size: 13px;
}

.download-link {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  margin-top: 10px;
  border: 1px solid rgba(114, 215, 255, 0.42);
  border-radius: 999px;
  padding: 0 12px;
  color: #72d7ff;
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
}

.download-link--disabled {
  border-color: rgba(255, 196, 112, 0.36);
  color: #ffd58c;
  cursor: not-allowed;
}

.empty-cast {
  display: grid;
  gap: 8px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  padding: 18px;
  background: rgba(255, 255, 255, 0.04);
}

.empty-cast strong {
  color: #fff;
}

.price-panel {
  display: grid;
  gap: 12px;
  justify-items: start;
  border-radius: 14px;
  padding: 18px;
  background: rgba(255, 84, 180, 0.12);
}

.price-panel strong {
  color: #fff;
  font-size: 22px;
}

.guide-cta__actions {
  justify-content: flex-end;
}

@media (max-width: 980px) {
  .story-hero,
  .intro-band,
  .guide-cta,
  .create-cta {
    grid-template-columns: 1fr;
  }

  .story-hero {
    min-height: auto;
  }

  .scene-board {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .scene-card {
    grid-template-columns: 1fr;
  }

  .flow-grid,
  .cast-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .guide-cta__actions {
    justify-content: flex-start;
  }
}

@media (max-width: 620px) {
  .scene-board,
  .flow-grid,
  .cast-grid {
    grid-template-columns: 1fr;
  }

  .free-sticker {
    right: -14px;
    min-width: 126px;
    min-height: 46px;
    font-size: 16px;
  }
}
</style>
