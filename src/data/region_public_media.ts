export type RegionPublicMediaRecord = {
  thumbnail: string
  status: 'approved' | 'quarantined'
  reason: string
}

const publicAssetPath = (path: string) => {
  if (!path || /^(https?:|data:|blob:)/.test(path) || !path.startsWith('/')) return path
  const base = import.meta.env.BASE_URL || '/'
  if (base !== '/' && path.startsWith(base)) return path
  return `${base.replace(/\/$/, '')}${path}`
}

// Public surface must read only from this explicit approval lane.
// If a background is not manually approved, leave thumbnail empty and render the placeholder.
// Canonical protocol:
// 1. raw: /Volumes/Yggdrasill/yggdrasill_workspace/outputs/cloud_regions/<batch_id>/
// 2. review: /Volumes/Yggdrasill/yggdrasill_workspace/outputs/regions/cleanroom_review/<region_id>/
// 3. approved master: /Volumes/Yggdrasill/yggdrasill_workspace/outputs/regions/public_approved/<region_id>/
// 4. deploy asset: /Volumes/Yggdrasill/GitHub/IZAKAYA_verse1.5/public/assets/regions/<region_id>/approved_<region_id>.png
// Do not read Night Shift research outputs or review/pending lanes from the public surface.
export const REGION_PUBLIC_MEDIA: Record<string, RegionPublicMediaRecord> = {
  mtuber_region: {
    thumbnail: publicAssetPath('/assets/regions/mtuber_region/selected/sub2.png'),
    status: 'approved',
    reason: 'catalog_selected_scene',
  },
  iz_help_nexus: {
    thumbnail: publicAssetPath('/assets/regions/iz_help_nexus/selected/main.png'),
    status: 'approved',
    reason: 'catalog_selected_scene',
  },
  yoidore_region: {
    thumbnail: publicAssetPath('/assets/regions/yoidore_region/selected/sub2.png'),
    status: 'approved',
    reason: 'catalog_selected_scene',
  },
  ambient_region: {
    thumbnail: publicAssetPath('/assets/regions/ambient_region/selected/main.png'),
    status: 'approved',
    reason: 'catalog_selected_scene',
  },
  mobility_region: {
    thumbnail: publicAssetPath('/assets/regions/mobility_region/selected/sub1.png'),
    status: 'approved',
    reason: 'catalog_selected_scene',
  },
  reincarnation_judgment: {
    thumbnail: publicAssetPath('/assets/regions/reincarnation_judgment/selected/sub1.png'),
    status: 'approved',
    reason: 'catalog_selected_scene',
  },
}

export function getRegionPublicMedia(regionId: string): RegionPublicMediaRecord {
  return REGION_PUBLIC_MEDIA[regionId] ?? {
    thumbnail: '',
    status: 'quarantined',
    reason: 'media_record_missing',
  }
}
