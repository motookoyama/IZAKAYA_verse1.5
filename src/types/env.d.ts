interface ImportMetaEnv {
  readonly VITE_FEATURE_3D_PLOT?: string
  readonly VITE_FEATURE_SOULCORE_BFF?: string
  readonly VITE_FEATURE_SOULCORE_PNG_EMBED?: string
  readonly VITE_FEATURE_USER_SHARE?: string
  readonly VITE_FEATURE_USER_DOWNLOAD?: string
  readonly VITE_API_BASE?: string
  readonly VITE_API_GATE_KEY?: string
  readonly VITE_BFF_URL?: string
  readonly VITE_GATE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
