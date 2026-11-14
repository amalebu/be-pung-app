<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  ticker: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md', // xs | sm | md | lg | xl
  },
})

const hasError = ref(false)
const isLoaded = ref(false)

const cleanTicker = computed(() => {
  const raw = String(props.ticker || '').trim().toUpperCase()
  // Buang suffix .JK jika ada (contoh: BBRI.JK -> BBRI)
  const stripped = raw.replace(/\.JK$/i, '').trim()
  return stripped.replace(/[^A-Z0-9]/g, '')
})

const iconUrl = computed(() => {
  if (!cleanTicker.value) return ''
  return `https://assets.stockbit.com/logos/companies/${cleanTicker.value}.png`
})

const firstLetter = computed(() => {
  return cleanTicker.value.charAt(0) || '•'
})

watch(
  () => props.ticker,
  () => {
    hasError.value = false
    isLoaded.value = false
  }
)

function handleError() {
  hasError.value = true
  isLoaded.value = false
}

function handleLoad() {
  isLoaded.value = true
  hasError.value = false
}

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-6 h-6 text-[10px]'
    case 'sm':
      return 'w-8 h-8 text-xs'
    case 'lg':
      return 'w-12 h-12 text-base'
    case 'xl':
      return 'w-14 h-14 text-lg'
    case 'md':
    default:
      return 'w-10 h-10 text-sm'
  }
})
</script>

<template>
  <div
    class="relative rounded-full shrink-0 flex items-center justify-center overflow-hidden select-none transition-transform"
    :class="sizeClasses"
    :title="alt || ticker"
  >
    <!-- 1. Gambar Logo Resmi Perusahaan (Stockbit) -->
    <img
      v-if="!hasError && iconUrl"
      :src="iconUrl"
      :alt="alt || ticker"
      class="w-full h-full object-contain rounded-full bg-white p-0.5 border border-slate-200/80 dark:border-zinc-700 shadow-2xs transition-opacity duration-150"
      :class="isLoaded ? 'opacity-100' : 'opacity-0'"
      loading="lazy"
      referrerpolicy="no-referrer"
      @error="handleError"
      @load="handleLoad"
    />

    <!-- 2. Fallback: Lingkaran Hijau Default dengan 1 Huruf Pertama -->
    <div
      v-if="hasError || !isLoaded"
      class="absolute inset-0 rounded-full flex items-center justify-center font-extrabold uppercase tracking-tight bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-2xs border border-[#144229]/20 dark:border-[#a1d2af]/30"
    >
      {{ firstLetter }}
    </div>
  </div>
</template>
