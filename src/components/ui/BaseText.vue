<script setup>
defineProps({
  as: {
    type: String,
    default: 'p', // p | span | div | label
  },
  variant: {
    type: String,
    default: 'default', // default | muted | secondary | danger | success
  },
  size: {
    type: String,
    default: 'sm', // xs | sm | base | lg
  },
  tabular: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <component
    :is="as"
    class="leading-relaxed"
    :class="[
      size === 'xs' ? 'text-xs' : '',
      size === 'sm' ? 'text-sm' : '',
      size === 'base' ? 'text-base' : '',
      size === 'lg' ? 'text-lg' : '',
      variant === 'default' ? 'text-slate-900 dark:text-zinc-100' : '',
      variant === 'secondary' ? 'text-slate-600 dark:text-zinc-300' : '',
      variant === 'muted' ? 'text-slate-500 dark:text-zinc-400' : '',
      variant === 'danger' ? 'text-rose-600 dark:text-rose-400' : '',
      variant === 'success' ? 'text-emerald-600 dark:text-emerald-400' : '',
      tabular ? 'tabular-nums' : '',
    ]"
  >
    <slot />
  </component>
</template>
