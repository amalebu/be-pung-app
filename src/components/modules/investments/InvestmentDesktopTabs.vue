<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  activeTab: {
    type: String,
    default: '',
  },
})

const route = useRoute()
const router = useRouter()

const currentTab = computed(() => {
  if (props.activeTab) return props.activeTab
  if (route.path.startsWith('/investments/cash') || route.name === 'investments-cash') {
    return 'cash'
  }
  if (route.path.startsWith('/investments/history') || route.name === 'investments-history') {
    return 'history'
  }
  return 'stocks'
})

const tabs = [
  { id: 'stocks', label: 'Saham', path: '/investments' },
  { id: 'history', label: 'Riwayat', path: '/investments/history' },
  { id: 'cash', label: 'Cash RDN', path: '/investments/cash' },
]

function selectTab(tab) {
  if (currentTab.value !== tab.id) {
    router.push(tab.path)
  }
}
</script>

<template>
  <div class="hidden md:flex items-center gap-8 border-b border-slate-200 dark:border-zinc-800 select-none">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      @click="selectTab(tab)"
      class="text-sm tracking-tight transition-all pb-3 relative -mb-px cursor-pointer inline-flex items-center gap-1.5 focus:outline-none"
      :class="
        currentTab === tab.id
          ? 'font-bold text-slate-900 dark:text-zinc-100 border-b-2 border-[#144229] dark:border-[#a1d2af]'
          : 'font-medium text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 border-b-2 border-transparent'
      "
    >
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>
