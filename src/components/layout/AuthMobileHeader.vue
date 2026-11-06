<script setup>
import { NavArrowLeft } from '@iconoir/vue'
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
  <header class="w-full flex items-center justify-between h-14 pt-1">
    <!-- Left: Back button or empty spacer -->
    <div class="w-11 flex items-center justify-start">
      <button
        v-if="showBack"
        type="button"
        @click="emit('back')"
        class="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer shadow-xs"
        aria-label="Kembali"
      >
        <NavArrowLeft class="w-5 h-5" />
      </button>
    </div>

    <!-- Center: Title (label hardware-embossed) -->
    <h2 v-if="title" class="label-caps text-slate-500 dark:text-zinc-400 text-center">
      {{ title }}
    </h2>

    <!-- Right: Theme Toggle -->
    <div class="w-11 flex items-center justify-end">
      <ThemeToggle />
    </div>
  </header>
</template>
