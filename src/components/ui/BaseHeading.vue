<script setup>
defineProps({
  as: {
    type: String,
    default: 'h1', // h1 | h2 | h3 | h4 | h5 | h6
  },
  size: {
    type: String,
    default: 'xl', // xs | sm | md | lg | xl | 2xl | 3xl
  },
  weight: {
    type: String,
    default: 'semibold', // normal | medium | semibold | bold | extrabold
  },
})
</script>

<template>
  <component
    :is="as"
    class="tracking-tight text-slate-900 dark:text-zinc-100"
    :class="[
      size === 'xs' ? 'text-xs' : '',
      size === 'sm' ? 'text-sm' : '',
      size === 'md' ? 'text-base' : '',
      size === 'lg' ? 'text-lg' : '',
      size === 'xl' ? 'text-xl' : '',
      size === '2xl' ? 'text-2xl' : '',
      size === '3xl' ? 'text-3xl' : '',
      weight === 'normal' ? 'font-normal' : '',
      weight === 'medium' ? 'font-medium' : '',
      weight === 'semibold' ? 'font-semibold' : '',
      weight === 'bold' ? 'font-bold' : '',
      weight === 'extrabold' ? 'font-extrabold' : '',
    ]"
  >
    <slot />
  </component>
</template>
