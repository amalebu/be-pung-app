<script setup>
import { Search, Xmark, TriangleFlag } from '@iconoir/vue'

defineProps({
  activeFilter: {
    type: String,
    default: 'all',
  },
  activePriority: {
    type: String,
    default: '',
  },
  searchQuery: {
    type: String,
    default: '',
  },
  counts: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:filter', 'update:priority', 'update:search'])

const tabs = [
  { id: 'all', label: 'Semua', countKey: 'all' },
  { id: 'today', label: 'Hari Ini', countKey: 'today' },
  { id: 'upcoming', label: 'Mendatang', countKey: 'upcoming' },
  { id: 'overdue', label: 'Terlambat', countKey: 'overdue' },
  { id: 'completed', label: 'Selesai', countKey: 'completed' },
]

const priorities = [
  { id: 'high', label: 'Tinggi', activeClass: 'bg-rose-600 text-white border-rose-600' },
  { id: 'medium', label: 'Sedang', activeClass: 'bg-amber-500 text-white border-amber-500' },
  { id: 'low', label: 'Rendah', activeClass: 'bg-slate-700 dark:bg-zinc-200 text-white dark:text-zinc-900 border-slate-700' },
]
</script>

<template>
  <div class="space-y-3">
    <!-- Search Input & Priority Pills -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      <!-- Search Box -->
      <div class="relative flex-1">
        <Search class="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          :value="searchQuery"
          type="text"
          placeholder="Cari judul atau catatan tugas..."
          @input="emit('update:search', $event.target.value)"
          class="w-full pl-9 pr-9 py-2 rounded-xl text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="emit('update:search', '')"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
        >
          <Xmark class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Priority Quick Filter -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
        <span class="text-xs text-slate-400 dark:text-zinc-500 font-medium mr-1 flex items-center gap-1 shrink-0">
          <TriangleFlag class="w-3 h-3" /> Prioritas:
        </span>
        <button
          v-for="p in priorities"
          :key="p.id"
          type="button"
          @click="emit('update:priority', p.id)"
          class="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shrink-0"
          :class="
            activePriority === p.id
              ? p.activeClass
              : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
          "
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Horizontal Filter Tabs -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        @click="emit('update:filter', tab.id)"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
        :class="
          activeFilter === tab.id
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
        "
      >
        <span>{{ tab.label }}</span>
        <span
          class="px-1.5 py-0.5 rounded-md text-[10px] tabular-nums"
          :class="
            activeFilter === tab.id
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
          "
        >
          {{ counts[tab.countKey] ?? 0 }}
        </span>
      </button>
    </div>
  </div>
</template>
