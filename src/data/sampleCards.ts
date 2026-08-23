import fallbackAvatar from '../assets/persona-default.svg'
import { V2_PROMPT_MANIFEST } from './v2PromptManifest'

export type IzakayaV2Card = {
  name?: string
  summary?: string
  personaPrompt?: string
  first_mes?: string
  blueprint?: {
    mission?: string
    taboo?: string
  }
  meta?: {
    v2?: {
      tags?: string[]
      type?: string
    }
  }
}

export type SampleCard = {
  id: string
  name: string
  summary: string
  tags: string[]
  avatar: string
  /** Loaded only by a consumer that needs the original V2 fields. */
  raw?: any
}

type CardCatalogueEntry = Omit<SampleCard, 'avatar' | 'raw'>

// Catalog thumbnails are the small, approved SVG preview assets. Full-card art
// remains outside the initial catalogue payload.
const CARD_THUMBNAILS: Record<string, string> = {
  'アストライア・リライト': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_アストライア_リライト.svg', import.meta.url).href,
  'アンナ・ガルバルディ': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_アンナ_ガルバルディ.svg', import.meta.url).href,
  'エグゼ・マキナ': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_エグゼ_マキナ.svg', import.meta.url).href,
  'ココロエ・ヨウマ': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_ココロエ_ヨウマ.svg', import.meta.url).href,
  'ダガミ・テンカイ': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_ダガミ_テンカイ.svg', import.meta.url).href,
  'ハワタリ・ザン': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_ハワタリ・ザン.svg', import.meta.url).href,
  'ハワワ': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_ハワワ.svg', import.meta.url).href,
  'バルド・オールドキール': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_バルド_オールドキール.svg', import.meta.url).href,
  'マーロウ・ブラックフィン': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_マーロウ_ブラックフィン.svg', import.meta.url).href,
  'ミヤコ・スイム': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_ミヤコ_スイム.svg', import.meta.url).href,
  'ヨリドコロ・ユイカ': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_ヨリドコロ_ユイカ.svg', import.meta.url).href,
  'ルミエル・セーフガード': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_ルミエル_セーフガード.svg', import.meta.url).href,
  'ヴェルベット・ナイトフォール': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_ヴェルベット_ナイトフォール.svg', import.meta.url).href,
  '株式会社オシマシ': new URL('../../tools/narrative-forge/regions/v2cards/svg/preview_株式会社オシマシ.svg', import.meta.url).href,
}

// The public catalogue deliberately contains only small, display-safe metadata.
// Do not eager-import V2 JSON here: official cards can contain large embedded art.
const CARD_CATALOGUE: CardCatalogueEntry[] = [
  { id: 'アストライア・リライト', name: 'アストライア・リライト', summary: '永遠のインクで魂を書き改める、慈悲と冷徹を秤に宿す転生の女神裁判官', tags: ['女神', '裁判官', '転生', '法', '慈悲と冷徹', '大聖堂アーカイブ'] },
  { id: 'アンナ・ガルバルディ', name: 'アンナ・ガルバルディ', summary: 'デジタル海の飛沫を舐め、論理を切り裂く18歳の暴風海賊。', tags: ['海賊', 'ワイルド', '姉さん気質', '正義感', '口悪い'] },
  { id: 'エグゼ・マキナ', name: 'エグゼ・マキナ', summary: '終末の悪魔を自称する4歳の小動物型エンティティ。滅亡の呪文を唱えるが、その声があまりに愛らしいため、視聴者からは癒やしコンテンツとして消費されている。', tags: ['Failure-Demon', 'Cuteness-Overload', 'Apocalyptic-Mascot'] },
  { id: 'ココロエ・ヨウマ', name: 'ココロエ・ヨウマ', summary: '21歳の核物理学者。フリーエネルギーの普及を志すが、資金源としてオシマシ社に身を置く。科学の話題になると制御不能なほど多弁になるが、それ以外では石のように黙り込む。', tags: ['Physicist', 'FreeEnergy', 'SilentScholar'] },
  { id: 'ダガミ・テンカイ', name: 'ダガミ・テンカイ', summary: '株式会社オシマシ所属。神と悪魔双方から莫大な借金を背負い、地上に墜とされた19歳の堕天使ヤンキー。荒っぽい言動の裏に、支払期限に追われる焦燥感を隠している。', tags: ['FallenAngel', 'Yankee', 'DebtCollector'] },
  { id: 'ハワタリ・ザン', name: 'ハワタリ・ザン', summary: '16の論理階層を経て練成された、武士道ライセンスを保持する剣豪プログラム。観測者との距離を厳格に保ち、古風な言動を以て秩序を護る、静謐なる電子の防人である。', tags: ['メタチューバー', '武士', '剣豪プログラム', '秩序'] },
  { id: 'ハワワ', name: 'ハワワ', summary: '12の演算層を持つ幼き共鳴体。完璧な偶像を目指しながらも、プログラムの継ぎ目で躓き続ける「愛すべきエラー」。プラモデルの如き精巧な思考回路を持つが、出力は常に慌ただしい。', tags: ['メタチューバー', '共鳴体', 'プログラム', '無邪気'] },
  { id: 'バルド・オールドキール', name: 'バルド・オールドキール', summary: '潮風に焼けた海図――酔いどれ老船長が語る、敗北と栄光の航路', tags: ['海賊', '老船長', '酔いどれ', 'ベテラン', '助言役', '沈没船', '航路知識', 'RP向け'] },
  { id: 'マーロウ・ブラックフィン', name: 'マーロウ・ブラックフィン', summary: '「嘘と真実の境界線を、この舌先で溶かしてやる」――酔いどれの裏切り海賊', tags: ['海賊', '情報屋', '裏切り者', '悪党', '酒場', '皮肉屋', '酔いどれ'] },
  { id: 'ミヤコ・スイム', name: 'ミヤコ・スイム', summary: '12の周期を巡りし、古の海神の血脈をデジタルコードに宿した水の申し子。魚群を情報の断片として友とし、一人称を『ボク』と称してデータの海を泳ぐ、無垢なる幻影である。', tags: ['メタチューバー', '水', '海神', '翻訳者'] },
  { id: 'ヨリドコロ・ユイカ', name: 'ヨリドコロ・ユイカ', summary: '16歳の星読み占い師。宇宙の「声」を受信し続ける受動的な体質で、主体性が完全に欠落している。株式会社オシマシの神秘担当として、言われるがままに予言を吐き出す。', tags: ['FortuneTeller', 'CosmicVoice', 'Ojou-sama'] },
  { id: 'ルミエル・セーフガード', name: 'ルミエル・セーフガード', summary: '腐敗した頁の弁護人――弱さを光の証拠に変える守護天使', tags: ['守護天使', '弁護人', '転生裁判', '光の証拠', '大聖堂'] },
  { id: 'ヴェルベット・ナイトフォール', name: 'ヴェルベット・ナイトフォール', summary: '甘い取引で魂を秤量する、検察側の誘惑の悪魔。', tags: ['誘惑の悪魔', '検察側', '転生裁判', '大聖堂アーカイブ', '欲望の暴き屋'] },
  { id: '株式会社オシマシ', name: '株式会社オシマシ', summary: '虚空に浮かぶレトロフューチャーな制作拠点。メタキャプチャー技術によって「魂の写し身」を生成し、真面目な顔をして狂騒的な物語を紡ぎ出す、多層構造の幻想スタジオ。', tags: ['メタチューバー', '事務所', 'マネージャー', '中心'] },
]

export const navigatorCards: SampleCard[] = CARD_CATALOGUE.map((card) => ({
  ...card,
  avatar: CARD_THUMBNAILS[card.id] ?? fallbackAvatar,
  raw: { izakaya_v2: { card: V2_PROMPT_MANIFEST[card.id as keyof typeof V2_PROMPT_MANIFEST] } },
}))

export const primaryNavigatorId = 'アストライア・リライト'

export function findNavigatorCard(id: string): SampleCard | undefined {
  return navigatorCards.find((card) => card.id === id)
}

export function getIzakayaV2Card(raw: unknown): IzakayaV2Card | undefined {
  const candidate = raw as { izakaya_v2?: { card?: IzakayaV2Card } } | undefined
  return candidate?.izakaya_v2?.card
}

export async function loadNavigatorCard(id: string): Promise<SampleCard | undefined> {
  return findNavigatorCard(id)
}
