<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Plus } from '@iconoir/vue'
import { getSubnavForRoute } from '@/config/navigation'

defineProps({
  label: {
    type: String,
    default: 'Aksi Cepat',
  },
})

const emit = defineEmits(['click'])
const route = useRoute()

// Jika rute saat ini memiliki submenu, tombol '+' sudah terintegrasi di dalam BottomNav floating bar
const hasSubnav = computed(() => getSubnavForRoute(route).length > 0)
</script>

<template>
  <button
    type="button"
    @click="emit('click')"
    class="fixed right-4 bottom-6 md:bottom-8 md:right-8 z-50 items-center justify-center w-13 h-13 rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] hover:bg-[#2d5a3f] dark:hover:bg-[#bceecb] hover:shadow-[0px_10px_30px_rgba(20,66,41,0.25)] active:scale-95 shadow-[0px_10px_30px_rgba(20,66,41,0.18)] transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#144229]/30 cursor-pointer"
    :class="hasSubnav ? 'hidden md:flex' : 'flex'"
    :title="label"
  >
    <Plus class="w-5 h-5 stroke-[2.2]" />
  </button>
</template>
