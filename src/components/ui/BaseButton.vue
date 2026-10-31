<script setup>
import { Loader2 } from 'lucide-vue-next'

defineProps({
  type: {
    type: String,
    default: 'button',
  },
  variant: {
    type: String,
    default: 'primary', // primary | secondary | danger | ghost
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
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-950 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    :class="[
      block ? 'w-full' : '',
      size === 'sm' ? 'px-3 py-1.5 text-xs' : '',
      size === 'md' ? 'px-4 py-2.5 text-sm' : '',
      size === 'lg' ? 'px-5 py-3 text-base' : '',
      variant === 'primary'
        ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500 shadow-xs'
        : '',
      variant === 'secondary'
        ? 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/80 focus:ring-slate-400'
        : '',
      variant === 'danger'
        ? 'bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500 shadow-xs'
        : '',
      variant === 'ghost'
        ? 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 focus:ring-slate-400'
        : '',
    ]"
  >
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
    <slot />
  </button>
</template>
