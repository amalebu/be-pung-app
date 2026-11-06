<script setup>
import { SystemRestart } from '@iconoir/vue'

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
  <!-- Primary Pill: Primary Deep Forest (light) / Primary Fixed Dim (dark) -->
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-full font-semibold bg-[#144229] hover:bg-[#2d5a3f] text-white hover:shadow-floating hover:-translate-y-px dark:bg-[#a1d2af] dark:text-[#002110] dark:hover:bg-[#bceecb] active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#144229] focus-visible:ring-offset-2 dark:focus-visible:ring-[#a1d2af] dark:focus-visible:ring-offset-zinc-950 transition-all duration-150 disabled:bg-[#f3f3f6] disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 disabled:cursor-not-allowed cursor-pointer"
    :class="[
      block ? 'w-full' : '',
      size === 'sm' ? 'px-4 py-2 text-xs' : '',
      size === 'md' ? 'px-6 py-3 text-sm' : '',
      size === 'lg' ? 'px-6 min-h-12 py-3.5 text-base' : '',
    ]"
  >
    <SystemRestart v-if="loading" class="w-4 h-4 animate-spin" />
    <slot />
  </button>
</template>
