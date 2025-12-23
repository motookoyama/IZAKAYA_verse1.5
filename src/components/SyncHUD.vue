<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  sync: number
  tension: number
}>()

function clamp(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

const metrics = computed(() => [
  { id: 'sync', label: 'Sync', value: clamp(props.sync) },
  { id: 'tension', label: 'Tension', value: clamp(props.tension) },
])
</script>

<template>
  <div class="sync-hud">
    <div v-for="metric in metrics" :key="metric.id" class="sync-hud__row">
      <span class="sync-hud__label">{{ metric.label }}</span>
      <div class="sync-hud__bar">
        <span class="sync-hud__fill" :style="{ width: `${metric.value}%` }"></span>
      </div>
      <span class="sync-hud__value">{{ metric.value }}%</span>
    </div>
  </div>
</template>

<style scoped>
.sync-hud {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 0.72rem;
}

.sync-hud__row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sync-hud__label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.75;
}

.sync-hud__bar {
  width: 72px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.sync-hud__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #8ef1ff, #ff91fa);
  transition: width 0.2s ease;
}

.sync-hud__value {
  min-width: 32px;
  text-align: right;
  opacity: 0.75;
}
</style>
