<script setup>
import ThemeToggle from './ThemeToggle.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'

defineProps({
  title: {
    type: String,
    default: 'PersonalApp',
  },
  showThemeToggle: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <header class="max-w-md w-full mx-auto flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <BaseHeading as="span" size="sm" weight="semibold">
        {{ title }}
      </BaseHeading>
    </div>

    <ThemeToggle v-if="showThemeToggle" />
  </header>
</template>
