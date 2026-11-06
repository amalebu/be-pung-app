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
    class="mb-4 mt-8 flex items-center justify-center gap-2.5 w-full max-w-[320px] mx-auto"
    :class="error ? 'animate-pin-shake' : ''"
  >
    <div
      v-for="idx in length"
      :key="idx"
      class="w-11 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 select-none"
      :class="[
        error
          ? 'bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500'
          : idx <= value.length
            ? 'bg-white dark:bg-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),inset_0_-1px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-zinc-700/60'
            : idx === value.length + 1 && !loading
              ? 'bg-white dark:bg-zinc-900 border-2 border-[#144229] dark:border-[#a1d2af] shadow-[0_2px_12px_rgba(20,66,41,0.12)]'
              : 'bg-[#f3f3f6] dark:bg-zinc-800/50 border border-[#e2e2e5] dark:border-zinc-700/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]',
      ]"
    >
      <!-- STATE 1: Terisi (Filled) -->
      <template v-if="idx <= value.length">
        <!-- Peek Reveal Digit Sementara -->
        <span
          v-if="!error && !loading && revealIndex === idx - 1"
          class="text-xl font-bold text-slate-900 dark:text-zinc-100 tabular-nums leading-none"
        >
          {{ value[idx - 1] }}
        </span>
        <!-- Titik Bulat Berisi -->
        <span
          v-else
          class="w-3.5 h-3.5 rounded-full shadow-xs"
          :class="error ? 'bg-rose-600 dark:bg-rose-400' : 'bg-[#144229] dark:bg-[#a1d2af]'"
        />
      </template>

      <!-- STATE 2: Sedang Aktif / Kursor Berkedip (Focused) -->
      <template v-else-if="idx === value.length + 1 && !loading">
        <div
          class="w-0.5 h-5 rounded-full animate-pulse"
          :class="error ? 'bg-rose-600 dark:bg-rose-400' : 'bg-[#144229] dark:bg-[#a1d2af]'"
        />
      </template>

      <!-- STATE 3: Belum Terisi (Blank) -->
      <template v-else>
        <span class="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-600" />
      </template>
    </div>
  </div>
</template>
