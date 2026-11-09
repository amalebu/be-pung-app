<script setup>
import { computed } from 'vue'
import { Plus, Check, NavArrowRight, FireFlame, Spark } from '@iconoir/vue'
import { getHabitIcon } from '@/utils/habitIcons'

const props = defineProps({
  habits: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  limit: { type: Number, default: 5 },
})

const emit = defineEmits(['increment', 'create'])

function formatNumber(n) {
  const v = Math.round(Number(n || 0) * 100) / 100
  return Number.isInteger(v) ? String(v) : v.toLocaleString('id-ID')
}

// Good habit yang belum tercapai tampil lebih dulu
const visibleHabits = computed(() =>
  [...props.habits]
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'good' ? -1 : 1
      if (a.is_today_goal_met !== b.is_today_goal_met) return a.is_today_goal_met ? 1 : -1
      return Number(b.current_streak || 0) - Number(a.current_streak || 0)
    })
    .slice(0, props.limit)
)

function progressPercent(habit) {
  const target = Number(habit.target_value || 0)
  const val = Number(habit.today_value || 0)
  if (habit.type === 'bad') {
    // Bad habit: bar penuh = masih bersih, berkurang saat mendekati/melewati batas
    if (val === 0) return 100
    const limit = target > 0 ? target : 1
    return Math.max(0, Math.round((1 - val / (limit + 1)) * 100))
  }
  if (target <= 0) return val > 0 ? 100 : 0
  return Math.min(100, Math.round((val / target) * 100))
}

function barClass(habit) {
  if (habit.type === 'bad') {
    return habit.is_today_goal_met ? 'bg-[#9fcfad] dark:bg-[#2d5a3f]' : 'bg-rose-500'
  }
  return habit.is_today_goal_met ? 'bg-[#144229] dark:bg-[#a1d2af]' : 'bg-[#9fcfad] dark:bg-[#4e7d61]'
}
</script>

<template>
  <section class="flex flex-col rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Habit Hari Ini</h3>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Ketuk + untuk mencatat progres</p>
      </div>
      <router-link
        to="/habits"
        class="inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-[#f3f3f6] dark:hover:bg-zinc-800 transition-colors"
      >
        Kelola
        <NavArrowRight class="w-3.5 h-3.5" />
      </router-link>
    </div>

    <!-- Skeleton -->
    <div v-if="loading && !visibleHabits.length" class="mt-4 space-y-2.5">
      <div v-for="n in 3" :key="n" class="h-16 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/60 animate-pulse" />
    </div>

    <TransitionGroup
      v-else-if="visibleHabits.length"
      tag="ul"
      name="list"
      class="mt-4 space-y-2 relative"
    >
      <li
        v-for="habit in visibleHabits"
        :key="habit.id"
        class="flex items-center gap-3 rounded-2xl px-3 py-3 bg-[#f9f9fc] dark:bg-zinc-800/40"
      >
        <span
          class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
          :class="habit.type === 'good'
            ? 'bg-[#d3e4d8] text-[#144229] dark:bg-[#2d5a3f] dark:text-[#bceecb]'
            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'"
        >
          <component :is="getHabitIcon(habit.icon)" class="w-5 h-5" />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">{{ habit.name }}</p>
            <span
              v-if="Number(habit.current_streak) > 0"
              class="inline-flex items-center gap-0.5 shrink-0 text-[11px] font-bold text-amber-600 dark:text-amber-400 tabular-nums"
              :title="`Streak ${habit.current_streak} hari`"
            >
              <FireFlame class="w-3.5 h-3.5" />
              {{ habit.current_streak }}
            </span>
          </div>
          <div class="mt-1.5 h-1.5 w-full rounded-full bg-[#e2e2e5] dark:bg-zinc-700/70 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              :class="barClass(habit)"
              :style="{ width: `${progressPercent(habit)}%` }"
            />
          </div>
          <p class="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
            {{ formatNumber(habit.today_value) }}
            <template v-if="habit.type === 'good'">/ {{ formatNumber(habit.target_value) }}</template>
            <template v-else>· batas {{ formatNumber(habit.target_value) }}</template>
            {{ habit.unit }}
          </p>
        </div>

        <button
          v-if="habit.type === 'good' && habit.is_today_goal_met"
          type="button"
          disabled
          class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110]"
          title="Target hari ini tercapai"
        >
          <Check class="w-4 h-4 stroke-[2.5]" />
        </button>
        <button
          v-else
          type="button"
          @click="emit('increment', habit)"
          class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:border-[#144229] hover:text-[#144229] dark:hover:border-[#a1d2af] dark:hover:text-[#a1d2af] active:scale-90 transition-all cursor-pointer"
          :title="`Catat +${formatNumber(habit.step_value || 1)} ${habit.unit || ''}`"
        >
          <Plus class="w-4 h-4 stroke-[2.2]" />
        </button>
      </li>
    </TransitionGroup>

    <!-- Empty state -->
    <div v-else class="mt-4 flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[#e2e2e5] dark:border-zinc-800 px-6 py-8">
      <span class="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#d3e4d8] text-[#144229] dark:bg-[#2d5a3f] dark:text-[#bceecb]">
        <Spark class="w-5 h-5" />
      </span>
      <p class="mt-3 text-sm font-semibold text-slate-800 dark:text-zinc-100">Belum ada habit</p>
      <p class="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Bangun kebiasaan baik mulai hari ini.</p>
      <button
        type="button"
        @click="emit('create')"
        class="mt-4 rounded-full px-4 py-2 text-xs font-semibold bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] hover:bg-[#2d5a3f] transition-colors cursor-pointer"
      >
        Buat habit
      </button>
    </div>
  </section>
</template>
