<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Slide {
  id: string
  url: string
  title: string
  subtitle?: string
}

const props = defineProps<{
  slides: Slide[]
  interval?: number
}>()

const currentIndex = ref(0)
let timer: number | null = null

const startTimer = () => {
  timer = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.slides.length
  }, props.interval || 5000)
}

onMounted(() => {
  if (props.slides.length > 1) {
    startTimer()
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="slideshow">
    <transition-group name="fade">
      <div
        v-for="(slide, index) in slides"
        v-show="index === currentIndex"
        :key="slide.id"
        class="slide"
        :class="{ 'is-active': index === currentIndex }"
        :style="{ backgroundImage: `url(${slide.url})` }"
      >
        <div class="slide-content">
          <div class="slide-overlay"></div>
          <div class="slide-text">
            <h2 class="slide-title">{{ slide.title }}</h2>
            <p v-if="slide.subtitle" class="slide-subtitle">{{ slide.subtitle }}</p>
          </div>
        </div>
      </div>
    </transition-group>

    <div class="slideshow-indicators" v-if="slides.length > 1">
      <button
        v-for="(_, index) in slides"
        :key="index"
        class="indicator"
        :class="{ active: index === currentIndex }"
        @click="currentIndex = index"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.slideshow {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 24px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  opacity: 0;
  will-change: transform, opacity;
}

.slide.is-active {
  animation: kenburns 20s linear infinite;
  opacity: 1;
}

.slide-content {
  position: relative;
  width: 100%;
  padding: 40px;
  z-index: 2;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(11, 15, 24, 0.9) 0%, rgba(11, 15, 24, 0) 60%);
  z-index: 1;
}

.slide-text {
  position: relative;
  z-index: 2;
  color: #fff;
  max-width: 600px;
}

.slide-title {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 800;
  margin: 0;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.slide-subtitle {
  font-size: 1.1rem;
  opacity: 0.8;
  margin-top: 8px;
  letter-spacing: 0.05em;
}

.slideshow-indicators {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: var(--brand, #e87b25);
  transform: scale(1.3);
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 1.5s ease-in-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes kenburns {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

@media (max-width: 768px) {
  .slide-content {
    padding: 20px;
  }
}
</style>
