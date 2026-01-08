const coerceBoolean = (value: string | boolean | undefined, fallback = false): boolean => {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return fallback
}

const env = (import.meta?.env ?? {}) as Record<string, string>

export const FEATURE_3D_PLOT = coerceBoolean(env.VITE_FEATURE_3D_PLOT, false)
export const FEATURE_SOULCORE_BFF = coerceBoolean(env.VITE_FEATURE_SOULCORE_BFF, false)
export const FEATURE_SOULCORE_PNG_EMBED = coerceBoolean(env.VITE_FEATURE_SOULCORE_PNG_EMBED, true)
export const FEATURE_USER_SHARE = coerceBoolean(env.VITE_FEATURE_USER_SHARE, true)
export const FEATURE_USER_DOWNLOAD = coerceBoolean(env.VITE_FEATURE_USER_DOWNLOAD, true)

export type FeatureFlagMap = {
  FEATURE_3D_PLOT: boolean
  FEATURE_SOULCORE_BFF: boolean
  FEATURE_SOULCORE_PNG_EMBED: boolean
  FEATURE_USER_SHARE: boolean
  FEATURE_USER_DOWNLOAD: boolean
}

export const featureFlags: FeatureFlagMap = {
  FEATURE_3D_PLOT,
  FEATURE_SOULCORE_BFF,
  FEATURE_SOULCORE_PNG_EMBED,
  FEATURE_USER_SHARE,
  FEATURE_USER_DOWNLOAD,
}

export const isFeatureEnabled = (flag: keyof FeatureFlagMap): boolean => featureFlags[flag]
