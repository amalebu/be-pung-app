<script setup>
import { ChevronLeft } from 'lucide-vue-next'
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  title: {
    type: String,
    default: 'Masuk',
  },
  showBack: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['back'])
</script>

<template>
  <header class="w-full flex items-center justify-between h-14">
    <!-- Left: Back button or Brand mark -->
    <div class="w-10 flex items-center justify-start">
      <button
        v-if="showBack"
        type="button"
        @click="emit('back')"
        class="w-10 h-10 rounded-md border border-pod-sage/12 dark:border-zinc-700 bg-white/75 dark:bg-zinc-900 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-surface active:scale-95 transition-all cursor-pointer"
        aria-label="Kembali"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>
      <div
        v-else
        class="relative w-10 h-10 rounded-md bg-pod-sage flex items-center justify-center text-white font-semibold text-base shadow-floating"
      >
        P
        <span class="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-pod-lime ring-2 ring-slate-50 dark:ring-zinc-950" />
      </div>
    </div>

    <!-- Center: Title (label hardware-embossed) -->
    <h2 class="label-caps text-slate-500 dark:text-zinc-400 text-center">
      {{ title }}
    </h2>

    <!-- Right: Theme Toggle -->
    <div class="w-10 flex items-center justify-end">
      <ThemeToggle />
    </div>
  </header>
</template>
