<script setup lang="ts">
import { computed } from 'vue'

type ConnectionIssue = 'server' | 'config' | 'auth' | null

const props = defineProps<{
  apiOnline: boolean
  apiBase: string
  issue?: ConnectionIssue
}>()

const title = computed(() =>
  props.apiOnline ? 'サーバに接続済み' : 'サーバにつながっていません',
)

const description = computed(() =>
  props.apiOnline
    ? 'IZAKAYAのサーバに接続できています。通常どおりご利用いただけます。'
    : '現在、IZAKAYAのサーバに接続できないため、オフライン表示になっています。',
)

const stateLabel = computed(() => (props.apiOnline ? 'オンライン' : 'オフライン'))

const reason = computed(() => {
  if (props.apiOnline) return ''
  switch (props.issue) {
    case 'auth':
      return '認証が必要な可能性があります。'
    case 'config':
      return '接続先の設定ミスの可能性があります。'
    default:
      return 'サーバが止まっている可能性があります。'
  }
})
</script>

<template>
  <section class="connection-status" :class="{ 'connection-status--offline': !apiOnline }">
    <header class="connection-status__header">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </header>
    <dl class="connection-status__details">
      <div>
        <dt>接続先</dt>
        <dd>{{ apiBase }}</dd>
      </div>
      <div>
        <dt>現在の状態</dt>
        <dd>{{ stateLabel }}</dd>
      </div>
      <div v-if="!apiOnline">
        <dt>推定理由</dt>
        <dd>{{ reason }}</dd>
      </div>
    </dl>
    <p class="connection-status__action">
      対処：しばらくしてから再読み込みしてください。直らない場合は運営に連絡してください。
    </p>
  </section>
</template>

<style scoped>
.connection-status {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  padding: 16px 20px;
  background: rgba(8, 15, 28, 0.65);
  display: grid;
  gap: 12px;
  font-size: 0.95rem;
}

.connection-status--offline {
  border-color: rgba(255, 107, 107, 0.6);
  background: rgba(40, 0, 0, 0.6);
}

.connection-status__header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.connection-status__header p {
  margin: 4px 0 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.connection-status__details {
  display: grid;
  gap: 8px;
  margin: 0;
}

.connection-status__details div {
  display: grid;
  gap: 4px;
}

.connection-status__details dt {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.7;
}

.connection-status__details dd {
  margin: 0;
  font-weight: 600;
  word-break: break-all;
}

.connection-status__action {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.85;
}
</style>
