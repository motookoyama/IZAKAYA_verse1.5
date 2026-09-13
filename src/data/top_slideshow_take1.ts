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
    image: publicAssetPath('/adventures/spirit-appliances/media/hero.jpg'),
    title: '精霊家電',
    subtitle: 'おやつの支度から始まる、精霊たちとの小さな午後。',
    align: 'left',
    cta: '精霊家電へ',
    route: 'adventures/spirit-appliances/index.html',
  },
  {
    image: publicAssetPath('/adventures/dear-karma/media/hero.jpg'),
    title: 'ディア・カルマ',
    subtitle: '旅人として、最初の手助けを。古街道の先に物語が待っている。',
    align: 'left',
    cta: 'ディア・カルマへ',
    route: 'adventures/dear-karma/index.html',
  },
  {
    image: publicAssetPath('/adventures/battle-ai-colosseum/media/hero.jpg'),
    title: 'AIコロシアム',
    subtitle: 'あなたのAIと、王冠消失事件の最初の一問へ。',
    align: 'right',
    cta: 'AIコロシアムへ',
    route: 'adventures/battle-ai-colosseum/index.html',
  },
  {
    image: publicAssetPath('/adventures/chronicle-soul/media/hero.jpg'),
    title: 'クロニクル・ソウル',
    subtitle: '霧の街で、時計と影のずれを一つ確かめる。',
    align: 'right',
    cta: 'クロニクル・ソウルへ',
    route: 'adventures/chronicle-soul/index.html',
  },
]
