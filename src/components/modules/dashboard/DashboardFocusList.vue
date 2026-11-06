<script setup>
import { computed } from 'vue'
import { Check, NavArrowRight, Clock, WarningTriangle, TaskList } from '@iconoir/vue'
import { getJakartaTodayStr, formatDateJakarta } from '@/utils/dateUtils'

const props = defineProps({
  todos: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  limit: { type: Number, default: 5 },
})

const emit = defineEmits(['toggle', 'create'])

function todayStr() {
  return getJakartaTodayStr()
}

const priorityRank = { high: 1, medium: 2, low: 3 }

// Urutan fokus: terlambat -> hari ini -> prioritas -> tenggat terdekat
const focusTodos = computed(() => {
  const today = todayStr()
  return props.todos
    .filter((t) => !t.is_completed)
    .map((t) => ({
      ...t,
      _bucket: t.is_overdue ? 0 : t.due_date === today ? 1 : t.due_date ? 2 : 3,
    }))
    .sort((a, b) => {
      if (a._bucket !== b._bucket) return a._bucket - b._bucket
      const pa = priorityRank[a.priority] || 2
      const pb = priorityRank[b.priority] || 2
      if (pa !== pb) return pa - pb
      return String(a.due_date || '9999').localeCompare(String(b.due_date || '9999'))
    })
    .slice(0, props.limit)
})

const remainingCount = computed(() => props.todos.filter((t) => !t.is_completed).length)

const priorityDot = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300 dark:bg-zinc-600',
}

function dueLabel(todo) {
  if (!todo.due_date) return null
  const today = todayStr()
  if (todo.is_overdue) return 'Terlambat'
  if (todo.due_date === today) return todo.due_time ? `Hari ini · ${todo.due_time.slice(0, 5)}` : 'Hari ini'
  const d = new Date(`${todo.due_date}T00:00:00`)
  return formatDateJakarta(d, { day: 'numeric', month: 'short' })
}
</script>

<template>
  <section class="flex flex-col rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Fokus Hari Ini</h3>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          <span class="tabular-nums">{{ remainingCount }}</span> tugas aktif
        </p>
      </div>
      <router-link
        to="/todos"
        class="inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-[#f3f3f6] dark:hover:bg-zinc-800 transition-colors"
      >
        Lihat semua
        <NavArrowRight class="w-3.5 h-3.5" />
      </router-link>
    </div>

    <!-- Skeleton -->
    <div v-if="loading && !focusTodos.length" class="mt-4 space-y-2.5">
      <div v-for="n in 3" :key="n" class="h-14 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/60 animate-pulse" />
    </div>

    <!-- Daftar tugas -->
    <ul v-else-if="focusTodos.length" class="mt-4 space-y-2">
      <li
        v-for="todo in focusTodos"
        :key="todo.id"
        class="group flex items-center gap-3 rounded-2xl px-3 py-3 bg-[#f9f9fc] dark:bg-zinc-800/40 border border-transparent hover:border-[#e2e2e5] dark:hover:border-zinc-700 transition-colors"
      >
        <button
          type="button"
          @click="emit('toggle', todo.id)"
          class="w-6 h-6 shrink-0 rounded-full border-2 border-[#c1c9c0] dark:border-zinc-600 flex items-center justify-center text-transparent hover:border-[#144229] hover:text-[#144229] dark:hover:border-[#a1d2af] dark:hover:text-[#a1d2af] transition-colors cursor-pointer"
          :title="`Tandai selesai: ${todo.title}`"
        >
          <Check class="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">{{ todo.title }}</p>
          <div class="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
            <span class="inline-flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full" :class="priorityDot[todo.priority] || priorityDot.medium" />
              <span class="capitalize">{{ todo.priority === 'high' ? 'Tinggi' : todo.priority === 'low' ? 'Rendah' : 'Sedang' }}</span>
            </span>
            <span
              v-if="dueLabel(todo)"
              class="inline-flex items-center gap-1"
              :class="todo.is_overdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''"
            >
              <WarningTriangle v-if="todo.is_overdue" class="w-3 h-3" />
              <Clock v-else class="w-3 h-3" />
              {{ dueLabel(todo) }}
            </span>
            <span v-if="todo.subtasks_total" class="tabular-nums">
              {{ todo.subtasks_completed }}/{{ todo.subtasks_total }} sub
            </span>
          </div>
        </div>
      </li>
    </ul>

    <!-- Empty state -->
    <div v-else class="mt-4 flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[#e2e2e5] dark:border-zinc-800 px-6 py-8">
      <span class="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#d3e4d8] text-[#144229] dark:bg-[#2d5a3f] dark:text-[#bceecb]">
        <TaskList class="w-5 h-5" />
      </span>
      <p class="mt-3 text-sm font-semibold text-slate-800 dark:text-zinc-100">Tidak ada tugas aktif</p>
      <p class="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Nikmati harimu, atau rencanakan hal baru.</p>
      <button
        type="button"
        @click="emit('create')"
        class="mt-4 rounded-full px-4 py-2 text-xs font-semibold bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] hover:bg-[#2d5a3f] transition-colors cursor-pointer"
      >
        Tambah tugas
      </button>
    </div>
  </section>
</template>
