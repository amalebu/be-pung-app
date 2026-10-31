<script setup>
import { Loader2 } from 'lucide-vue-next'

defineProps({
  type: {
    type: String,
    default: 'button',
  },
  size: {
    type: String,
    default: 'md', // sm | md | lg
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <!-- Secondary / Ghost Pill -->
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-md font-semibold bg-white/75 dark:bg-zinc-900/70 text-pod-carbon dark:text-zinc-100 border border-pod-sage/15 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-pod-sage/40 dark:focus-visible:ring-pod-lime/50 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    :class="[
      block ? 'w-full' : '',
      size === 'sm' ? 'px-4 py-2 text-xs' : '',
      size === 'md' ? 'px-5 py-2.5 text-sm' : '',
      size === 'lg' ? 'px-6 min-h-12 py-3 text-base' : '',
    ]"
  >
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
    <slot />
  </button>
</template>
