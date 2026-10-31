<script setup>
defineProps({
  text: {
    type: String,
    default: 'atau',
  },
})
</script>

<template>
  <div class="relative flex items-center py-2">
    <div class="flex-grow border-t border-slate-200 dark:border-zinc-800" />
    <span class="shrink-0 mx-4 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
      {{ text }}
    </span>
    <div class="flex-grow border-t border-slate-200 dark:border-zinc-800" />
  </div>
</template>
