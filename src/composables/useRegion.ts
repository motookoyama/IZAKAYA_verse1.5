import { ref, onMounted, onUnmounted, readonly } from 'vue'

export interface RegionAtmosphere {
    visual_theme: string;
    bgm_url?: string | null;
    ambient_sounds?: string[];
}

export interface RegionV3 {
    id: string;
    name: string;
    label_jp: string;
    description: string;
    atmosphere: RegionAtmosphere;
    laws: string[];
    connected_regions: string[];
    level: number;
    version: string;
    slides?: Array<{ image: string; title: string; subtitle: string; align?: string }>;
}

// Global State (Singleton pattern suitable for basic app-wide context)
const activeRegion = ref<RegionV3 | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const POLLING_INTERVAL_MS = 5000
// Static Pages builds never infer a local BFF. Region polling is an explicitly
// enabled development integration, not a public runtime dependency.
const STATIC_PAGES = import.meta.env.VITE_STATIC_PAGES === 'true'
const BFF_URL = STATIC_PAGES ? '' : (import.meta.env.VITE_REGION_BFF_URL || import.meta.env.VITE_BFF_URL || '')
const GATE_KEY = STATIC_PAGES ? '' : (import.meta.env.VITE_GATE_KEY || '')
const ENABLE_REGION_POLLING = !STATIC_PAGES && import.meta.env.VITE_ENABLE_REGION_POLLING === 'true'

export function useRegion() {
    let pollingInterval: number | null = null

    const fetchRegion = async () => {
        if (!BFF_URL) {
            isLoading.value = false
            return
        }
        try {
            const res = await fetch(`${BFF_URL}/api/v1/regions/active`, {
                headers: {
                    'X-IZAKAYA-GATE': GATE_KEY
                }
            })

            if (!res.ok) throw new Error('Failed to fetch region')

            const data = await res.json()
            if (data.ok && data.region) {
                // Deep equality check optimization could be added here, 
                // but simple ID check usually suffice for region swaps.
                if (activeRegion.value?.id !== data.region.id) {
                    activeRegion.value = data.region
                    console.log(`[Region] Context switched to: ${data.region.name}`)
                }
            } else {
                activeRegion.value = null
            }
            error.value = null
        } catch (err) {
            // console.error('[Region] Connection lost to Yggdrasill', err)
            // Keep previous region active on transient failure to avoid localized flashing
            // error.value = 'Offline' 
        } finally {
            isLoading.value = false
        }
    }

    onMounted(() => {
        if (!ENABLE_REGION_POLLING) {
            isLoading.value = false
            return
        }
        // Start polling if not already started (or restart on component mount logic)
        // For a singleton, we might only want one poller running.
        // This simple implementation allows multiple components to trigger the check.
        fetchRegion()
        pollingInterval = window.setInterval(fetchRegion, POLLING_INTERVAL_MS)
    })

    onUnmounted(() => {
        if (pollingInterval) clearInterval(pollingInterval)
    })

    return {
        activeRegion: readonly(activeRegion),
        isLoading: readonly(isLoading),
        error: readonly(error),
        refetch: fetchRegion
    }
}
