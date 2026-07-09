import homeEmblem from '../assets/icons/home-emblem.png'

const publicAssetPath = (path: string) => {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/$/, '')}${path}`
}

export type TopSlide = {
  image: string
  title: string
  subtitle: string
  align: 'left' | 'right' | 'center' | 'top-left' | 'bottom-right'
  cta: string
  route: string
}

export const TOP_SLIDES_TAKE1: TopSlide[] = [
  {
    image: homeEmblem,
    title: 'IZAKAYA Verse',
    subtitle: '世界を選び、キャラクターに会い、会話で物語を始めよう。',
    align: 'center',
    cta: 'まず世界を選ぶ',
    route: '#/regions',
  },
  {
    image: publicAssetPath('/assets/regions/yoidore_region/selected/sub2.png'),
    title: '沈み梟の停泊地',
    subtitle: '嘘をつけない海賊酒場。宝の噂も、喧嘩も、真実の一杯から始まる。',
    align: 'left',
    cta: '海賊酒場へ',
    route: '#/region/yoidore_region',
  },
  {
    image: publicAssetPath('/assets/regions/reincarnation_judgment/selected/sub1.png'),
    title: '転生裁判',
    subtitle: '願いと罪が天秤にかけられる大聖堂。あなたの次の世界は、判決で決まる。',
    align: 'right',
    cta: '裁判を受ける',
    route: '#/regions',
  },
  {
    image: publicAssetPath('/assets/regions/mtuber_region/selected/sub2.png'),
    title: 'MetaTuber Studio',
    subtitle: '配信者、観客、AIキャストが交差する放送拠点。コメントから舞台が動き出す。',
    align: 'left',
    cta: '配信舞台を見る',
    route: '#/region/mtuber_region',
  },
  {
    image: publicAssetPath('/assets/regions/mobility_region/selected/sub1.png'),
    title: 'Orbit-Flow Mobility',
    subtitle: 'AIマシンが走り、都市が会話する。移動そのものがアドベンチャーになる。',
    align: 'right',
    cta: 'AIマシンに会う',
    route: '#/region/mobility_region',
  },
  {
    image: publicAssetPath('/assets/regions/ambient_region/selected/main.png'),
    title: '静かなリージョンもある',
    subtitle: '癒し、家族、旅、休息。戦わない物語も、会話から始められる。',
    align: 'left',
    cta: '癒しの旅へ',
    route: '#/region/ambient_region',
  },
  {
    image: publicAssetPath('/assets/regions/iz_help_nexus/selected/main.png'),
    title: '入口は、たった一言。',
    subtitle: '気になる世界を選んだら、キャラクターに話しかけるだけ。説明はあとからでいい。',
    align: 'center',
    cta: '遊び方を見る',
    route: '#/region-guide',
  },
]
