<script setup>
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    @click="toggleTheme"
    class="inline-flex items-center justify-center w-10 h-10 rounded-md border border-pod-sage/12 dark:border-zinc-800 bg-white/75 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 hover:shadow-surface active:scale-95 transition-all cursor-pointer"
    :title="isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'"
  >
    <Sun v-if="isDark" class="w-4 h-4 text-pod-lime" />
    <Moon v-else class="w-4 h-4" />
  </button>
</template>
