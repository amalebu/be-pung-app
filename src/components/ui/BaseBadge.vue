<script setup>
defineProps({
  variant: {
    type: String,
    default: 'neutral', // neutral | indigo | emerald | amber | rose
  },
  size: {
    type: String,
    default: 'sm', // xs | sm
  },
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-md font-medium"
    :class="[
      size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      variant === 'neutral'
        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60'
        : '',
      variant === 'indigo'
        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20'
        : '',
      variant === 'emerald'
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20'
        : '',
      variant === 'amber'
        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20'
        : '',
      variant === 'rose'
        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20'
        : '',
    ]"
  >
    <slot />
  </span>
</template>
