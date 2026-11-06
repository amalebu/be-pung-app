<script setup>
defineProps({
  padding: {
    type: String,
    default: 'p-5',
  },
})
</script>

<template>
  <div
    class="bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 rounded-2xl shadow-surface"
    :class="padding"
  >
    <slot />
  </div>
</template>
