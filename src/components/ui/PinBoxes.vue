<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  /** String digit PIN yang sedang diketik (maks `length`) */
  value: {
    type: String,
    default: '',
  },
  length: {
    type: Number,
    default: 6,
  },
  error: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

// Digit terbaru tampil ~0.6 detik lalu berubah menjadi titik (gaya mobile banking)
const REVEAL_MS = 600
const revealIndex = ref(-1)
let revealTimer = null

function clearReveal() {
  if (revealTimer) {
    clearTimeout(revealTimer)
    revealTimer = null
  }
  revealIndex.value = -1
}

watch(
  () => props.value.length,
  (newLen, oldLen) => {
    clearReveal()
    if (newLen > oldLen) {
      revealIndex.value = newLen - 1
      revealTimer = setTimeout(() => {
        revealIndex.value = -1
        revealTimer = null
      }, REVEAL_MS)
    }
  }
)

watch(
  () => [props.loading, props.error],
  ([isLoading, hasError]) => {
    if (isLoading || hasError) clearReveal()
  }
)

onBeforeUnmount(clearReveal)
</script>

<template>
  <!-- Kotak PIN bukan <input>, sehingga keyboard ponsel tidak pernah muncul -->
  <div
    role="img"
    :aria-label="`${value.length} dari ${length} digit PIN terisi`"
    class="flex items-center justify-center gap-2 sm:gap-3 py-3"
    :class="error ? 'animate-pin-shake' : ''"
  >
    <span
      v-for="idx in length"
      :key="idx"
      class="w-11 h-11 sm:w-12 sm:h-12 rounded-md flex items-center justify-center text-lg font-semibold tabular-nums transition-all duration-200"
      :class="[
        loading ? 'animate-pulse' : '',
        error
          ? 'bg-error-container dark:bg-rose-950/60 text-error dark:text-rose-300'
          : idx <= value.length
            ? 'bg-pod-sage text-white shadow-floating scale-105'
            : idx === value.length + 1 && !loading
              ? 'bg-white dark:bg-zinc-800 ring-2 ring-pod-lime shadow-bio-glow'
              : 'bg-pod-well dark:bg-zinc-800 shadow-well',
      ]"
    >
      <template v-if="idx <= value.length">
        <span v-if="!error && !loading && revealIndex === idx - 1">
          {{ value[idx - 1] }}
        </span>
        <span
          v-else
          class="w-2.5 h-2.5 rounded-full"
          :class="error ? 'bg-error dark:bg-rose-300' : 'bg-pod-lime'"
        />
      </template>
    </span>
  </div>
</template>
