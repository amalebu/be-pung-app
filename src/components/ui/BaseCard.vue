<script setup>
defineProps({
  padding: {
    type: String,
    default: 'p-6',
  },
})
</script>

<template>
  <div
    class="bg-white dark:bg-zinc-900 border border-pod-sage/10 dark:border-zinc-800 rounded-pod shadow-surface"
    :class="padding"
  >
    <slot />
  </div>
</template>
