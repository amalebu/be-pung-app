<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@iconoir/vue'
import { getSubnavForRoute, isSubnavItemActive } from '@/config/navigation'

const emit = defineEmits(['quick-action'])

const route = useRoute()
const router = useRouter()

const subnavItems = computed(() => getSubnavForRoute(route))

function isItemActive(item) {
  return isSubnavItemActive(item, route)
}

function handleSubnavClick(item) {
  if (item.query) {
    router.push({ path: item.path, query: item.query })
  } else {
    router.push(item.path)
  }
}
</script>

<template>
  <nav
    v-if="subnavItems.length > 0"
    class="md:hidden fixed bottom-4 inset-x-0 z-40 flex items-center justify-center gap-2.5 px-4 pointer-events-none pb-safe"
  >
    <!-- Capsule Container for Submenu Icons (Tinggi h-13) -->
    <div
      class="pointer-events-auto h-13 flex items-center gap-1 px-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/90 dark:border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      <button
        v-for="item in subnavItems"
        :key="item.id"
        type="button"
        @click="handleSubnavClick(item)"
        class="flex items-center justify-center transition-all duration-200 rounded-full cursor-pointer"
        :class="isItemActive(item)
          ? 'w-10 h-10 bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs'
          : 'w-10 h-10 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300'"
        :title="item.name"
      >
        <component :is="item.icon" class="w-5 h-5 stroke-[2]" />
      </button>
    </div>

    <!-- Floating '+' Action Button (Ukuran w-13 h-13 presisi sama dengan kapsul) -->
    <button
      type="button"
      @click="emit('quick-action')"
      class="pointer-events-auto w-13 h-13 flex items-center justify-center rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] hover:bg-[#2d5a3f] active:scale-95 shadow-[0_8px_30px_rgba(20,66,41,0.2)] transition-all cursor-pointer shrink-0"
      title="Tambah Baru (+)"
    >
      <Plus class="w-5 h-5 stroke-[2.2]" />
    </button>
  </nav>
</template>
