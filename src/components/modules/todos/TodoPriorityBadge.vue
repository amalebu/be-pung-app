<script setup>
import { computed } from 'vue'
import { TriangleFlag } from '@iconoir/vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps({
  priority: {
    type: String,
    default: 'medium', // low | medium | high
  },
  size: {
    type: String,
    default: 'xs',
  },
})

const config = computed(() => {
  if (props.priority === 'high') {
    return {
      label: 'Tinggi',
      variant: 'rose',
    }
  }
  if (props.priority === 'low') {
    return {
      label: 'Rendah',
      variant: 'neutral',
    }
  }
  return {
    label: 'Sedang',
    variant: 'amber',
  }
})
</script>

<template>
  <BaseBadge :variant="config.variant" :size="size">
    <TriangleFlag class="w-2.5 h-2.5 fill-current" />
    <span>{{ config.label }}</span>
  </BaseBadge>
</template>
