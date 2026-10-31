<script setup>
import { Plus } from 'lucide-vue-next'

defineProps({
  label: {
    type: String,
    default: 'Aksi Cepat',
  },
})

const emit = defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    @click="emit('click')"
    class="fixed right-4 bottom-safe-nav md:bottom-8 md:right-8 z-50 flex items-center justify-center w-14 h-14 rounded-md bg-pod-lime text-pod-carbon hover:shadow-bio-glow active:scale-95 shadow-floating transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-pod-lime/40 cursor-pointer"
    :title="label"
  >
    <Plus class="w-6 h-6 stroke-[2.5]" />
  </button>
</template>
