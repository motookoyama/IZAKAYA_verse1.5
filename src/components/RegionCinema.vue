<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  region: {
    id: string
    label_jp: string
    atmosphere?: {
      visual_theme: string
    }
  } | null
  defaultImages?: string[]
  slides?: Array<{ 
    image: string; 
    title: string; 
    subtitle: string;
    align?: 'left' | 'right' | 'center' | 'top-left' | 'bottom-right' // New: Alignment options
  }>
  interval?: number
  fullPage?: boolean
  isPaused?: boolean
}>(), { fullPage: true, isPaused: false })

const currentIdx = ref(0)
const slideInterval = props.interval || 8000
const timer = ref<ReturnType<typeof setInterval> | null>(null)

const currentImage = ref<string | null>(null)
const prevImage = ref<string | null>(null)
const currentCaption = ref<{ title: string; subtitle: string; align: string } | null>(null)
const prevCaption = ref<{ title: string; subtitle: string; align: string } | null>(null)

const isTransitioning = ref(false)
const isVideo = (url: string | null) => {
  if (!url) return false
  return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().includes('video')
}

// Video refs for play/pause control
const videoRef1 = ref<HTMLVideoElement | null>(null)
const videoRef2 = ref<HTMLVideoElement | null>(null)

const imageList = computed(() => {
  if (props.slides && props.slides.length > 0) {
    return props.slides.map(s => s.image)
  }
  if (props.region?.atmosphere?.visual_theme) {
     const theme = props.region.atmosphere.visual_theme
     if (theme.includes('/') || theme.startsWith('http')) {
       return [theme]
     }
  }
  return props.defaultImages || []
})

const captionList = computed(() => {
  if (props.slides && props.slides.length > 0) {
    return props.slides.map(s => ({ 
      title: s.title, 
      subtitle: s.subtitle,
      align: s.align || 'left' 
    }))
  }
  return []
})

function triggerFade() {
  isTransitioning.value = true
  setTimeout(() => {
    prevImage.value = null
    prevCaption.value = null
    isTransitioning.value = false
  }, 2500)
}

function updateSlide() {
  if (imageList.value.length === 0) return
  
  prevImage.value = currentImage.value
  prevCaption.value = currentCaption.value
  
  currentImage.value = imageList.value[currentIdx.value] ?? null
  currentCaption.value = captionList.value[currentIdx.value] ?? null
  
  if (prevImage.value) triggerFade()
}

function nextSlide() {
  if (imageList.value.length <= 1) return
  currentIdx.value = (currentIdx.value + 1) % imageList.value.length
  updateSlide()
}

watch(imageList, (newVal) => {
  if (newVal.length > 0) {
    currentIdx.value = 0
    updateSlide()
  } else {
    currentImage.value = null
    currentCaption.value = null
  }
}, { immediate: true })

function startTimer() {
  if (timer.value) clearInterval(timer.value)
  if (!props.isPaused) {
    timer.value = setInterval(nextSlide, slideInterval)
  }
}

function stopTimer() {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

onMounted(() => {
  startTimer()
})

watch(() => props.isPaused, (paused) => {
  if (paused) {
    stopTimer()
    videoRef1.value?.pause()
    videoRef2.value?.pause()
  } else {
    startTimer()
    videoRef1.value?.play().catch(() => {})
    videoRef2.value?.play().catch(() => {})
  }
})

onBeforeUnmount(() => {
  stopTimer()
})

function goToSlide(idx: number) {
  if (idx === currentIdx.value) return
  currentIdx.value = idx
  updateSlide()
}
</script>

<template>
  <div class="region-cinema">
    <!-- Base/Previous Layer (for cross-fade) -->
    <div 
      class="region-cinema__layer" 
      :class="{ 'ken-burns': !isPaused && !isVideo(prevImage) }"
      v-show="isTransitioning"
    >
      <img v-if="prevImage && !isVideo(prevImage)" :src="prevImage" alt="Background Previous" />
      <video 
        v-else-if="prevImage && isVideo(prevImage)"
        ref="videoRef2"
        :src="prevImage"
        autoplay
        loop
        muted
        playsinline
        class="region-cinema__video"
      ></video>
    </div>

    <!-- Active/Current Layer -->
    <div 
      class="region-cinema__layer" 
      :class="{ 
        'ken-burns': !isPaused && !isVideo(currentImage), 
        'fade-in': isTransitioning 
      }"
    >
      <img v-if="currentImage && !isVideo(currentImage)" :src="currentImage" alt="Background Current" />
      <video 
        v-else-if="currentImage && isVideo(currentImage)"
        ref="videoRef1"
        :src="currentImage"
        autoplay
        loop
        muted
        playsinline
        class="region-cinema__video"
      ></video>
    </div>
    
    <!-- Overlay for atmosphere -->
    <div class="region-cinema__overlay"></div>

    <!-- Caption Layer -->
    <div 
      class="region-cinema__captions"
      :class="[`region-cinema__captions--${currentCaption?.align || 'left'}`]"
    >
      <transition name="caption-fade" mode="out-in">
        <div :key="currentIdx" v-if="currentCaption" class="region-cinema__caption-box">
          <span class="region-cinema__caption-title">{{ currentCaption.title }}</span>
          <p class="region-cinema__caption-subtitle">{{ currentCaption.subtitle }}</p>
        </div>
      </transition>
    </div>

    <!-- Navigation Dots -->
    <nav class="region-cinema__nav">
      <button 
        v-for="(_, idx) in imageList" 
        :key="idx" 
        class="region-cinema__dot"
        :class="{ 'region-cinema__dot--active': idx === currentIdx }"
        @click="goToSlide(idx)"
      ></button>
    </nav>
  </div>
</template>

<style scoped>
.region-cinema {
  position: v-bind('fullPage ? "fixed" : "absolute"');
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  background-color: #0b0f18;
  pointer-events: none;
}

.region-cinema__layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  will-change: transform, opacity;
}

.region-cinema__layer--current {
  animation: kenburns 20s ease-in-out infinite alternate;
  animation-play-state: v-bind('isPaused ? "paused" : "running"');
  z-index: 2;
  opacity: 1;
}

.region-cinema__layer--prev {
  z-index: 3;
  opacity: 1;
  transition: opacity 2.5s ease-in-out;
  animation-play-state: v-bind('isPaused ? "paused" : "running"');
}

.region-cinema__layer--prev[style*="none"] {
  opacity: 0;
}

/* New styles for image and video elements */
.region-cinema__layer img,
.region-cinema__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.region-cinema__video {
  filter: brightness(0.85); /* Optional: match static image dimming if any */
}

/* Updated .region-cinema__layer--prev and .region-cinema__layer--current to use new structure */
.region-cinema__layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2; /* Default z-index */
  opacity: 1;
  transition: opacity 2.5s ease-in-out; /* For cross-fade */
}

.region-cinema__layer.ken-burns {
  animation: kenburns 20s ease-in-out infinite alternate;
  animation-play-state: v-bind('isPaused ? "paused" : "running"');
}

.region-cinema__layer[v-show="true"] {
  z-index: 3; /* Previous layer during transition */
}

.region-cinema__layer[v-show="false"] {
  opacity: 0;
  z-index: 1; /* Hidden layer */
}

.region-cinema__layer.fade-in {
  z-index: 2; /* Current layer */
  opacity: 1;
}

.region-cinema__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(11, 15, 24, 0.2) 0%, rgba(11, 15, 24, 0.6) 100%);
  z-index: 4;
  pointer-events: none;
}

.region-cinema__nav {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 12px;
  pointer-events: auto;
}

.region-cinema__dot {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  transition: background 0.3s ease, width 0.3s ease;
}

.region-cinema__dot--active {
  background: var(--brand-2, #58cff5);
  width: 48px;
}

.region-cinema__captions {
  position: absolute;
  z-index: 15;
  pointer-events: none;
  max-width: 600px;
  width: calc(100% - 96px);
  display: flex;
  transition: all 0.5s ease;
}

.region-cinema__captions--left {
  left: 48px;
  bottom: 80px;
  justify-content: flex-start;
  text-align: left;
}

.region-cinema__captions--right {
  right: 48px;
  bottom: 80px;
  justify-content: flex-end;
  text-align: right;
}

.region-cinema__captions--center {
  left: 50%;
  bottom: 120px;
  transform: translateX(-50%);
  justify-content: center;
  text-align: center;
  max-width: 800px;
}

.region-cinema__captions--top-left {
  left: 48px;
  top: 48px;
  justify-content: flex-start;
  text-align: left;
}

.region-cinema__captions--bottom-right {
  right: 48px;
  bottom: 120px;
  justify-content: flex-end;
  text-align: right;
}

.region-cinema__caption-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.region-cinema__caption-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  background: linear-gradient(90deg, #fff, #58cff5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.region-cinema__caption-subtitle {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.caption-fade-enter-active,
.caption-fade-leave-active {
  transition: all 0.8s ease;
}

.caption-fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.caption-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@keyframes kenburns {
  0% { transform: scale(1.0) translate(0, 0); }
  100% { transform: scale(1.18) translate(1%, 1%); }
}
</style>
