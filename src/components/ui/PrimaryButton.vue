<script setup>
import { Loader2 } from 'lucide-vue-next'

defineProps({
  type: {
    type: String,
    default: 'submit',
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
  <!-- Primary Active Pill: carbon (light) / neon lime (dark) -->
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-md font-semibold bg-pod-carbon text-white hover:shadow-floating hover:-translate-y-px dark:bg-pod-lime dark:text-pod-carbon dark:hover:shadow-bio-glow active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-pod-sage focus-visible:ring-offset-2 dark:focus-visible:ring-pod-lime dark:focus-visible:ring-offset-zinc-950 transition-all duration-150 disabled:bg-pod-well disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed cursor-pointer"
    :class="[
      block ? 'w-full' : '',
      size === 'sm' ? 'px-4 py-2 text-xs' : '',
      size === 'md' ? 'px-6 py-3 text-sm' : '',
      size === 'lg' ? 'px-6 min-h-12 py-3.5 text-base' : '',
    ]"
  >
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
    <slot />
  </button>
</template>
