<script setup>
import { SystemRestart } from '@iconoir/vue'

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
  <!-- Secondary Pill: Secondary Mint background, Primary Deep Forest text -->
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-full font-semibold bg-[#d3e4d8] hover:bg-[#c2d7c9] text-[#144229] border border-[#bacbbf]/60 dark:bg-zinc-800 dark:border-zinc-700 dark:text-[#a1d2af] dark:hover:bg-zinc-700 hover:shadow-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-[#144229]/40 dark:focus-visible:ring-[#a1d2af]/50 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    :class="[
      block ? 'w-full' : '',
      size === 'sm' ? 'px-4 py-2 text-xs' : '',
      size === 'md' ? 'px-5 py-2.5 text-sm' : '',
      size === 'lg' ? 'px-6 min-h-12 py-3 text-base' : '',
    ]"
  >
    <SystemRestart v-if="loading" class="w-4 h-4 animate-spin" />
    <slot />
  </button>
</template>
