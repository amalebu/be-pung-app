<script setup>
import { computed } from 'vue'
import { StatsReport } from '@iconoir/vue'
import { getTodayDateStr } from '@/stores/habitStore'
import { formatDateJakarta } from '@/utils/dateUtils'

const props = defineProps({
  habits: { type: Array, default: () => [] },
})

// Rasio pencapaian Good Habit per hari selama 7 hari terakhir (0..1)
const days = computed(() => {
  const goodHabits = props.habits.filter((h) => h.type === 'good')
  const logIndex = new Map()
  for (const h of goodHabits) {
    const map = {}
    for (const l of h.logs || []) {
      if (l.logged_date) map[l.logged_date] = Number(l.value || 0)
    }
    logIndex.set(h.id, map)
  }

  const result = []
  for (let offset = -6; offset <= 0; offset++) {
    const dateStr = getTodayDateStr(offset)
    const dateObj = new Date()
    dateObj.setDate(dateObj.getDate() + offset)

    let ratioSum = 0
    for (const h of goodHabits) {
      const val = logIndex.get(h.id)?.[dateStr] ?? 0
      const target = Number(h.target_value || 0)
      ratioSum += target > 0 ? Math.min(1, val / target) : val > 0 ? 1 : 0
    }
    const ratio = goodHabits.length > 0 ? ratioSum / goodHabits.length : 0

    result.push({
      dateStr,
      label: formatDateJakarta(dateObj, { weekday: 'short' }).replace('.', ''),
      ratio,
      percent: Math.round(ratio * 100),
      isToday: offset === 0,
    })
  }
  return result
})

const hasGoodHabits = computed(() => props.habits.some((h) => h.type === 'good'))

const weeklyAverage = computed(() => {
  if (!days.value.length) return 0
  return Math.round(days.value.reduce((s, d) => s + d.percent, 0) / days.value.length)
})
</script>

<template>
  <section class="flex flex-col rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Konsistensi 7 Hari</h3>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Rata-rata target good habit</p>
      </div>
      <span class="w-9 h-9 rounded-xl flex items-center justify-center bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
        <StatsReport class="w-[18px] h-[18px]" />
      </span>
    </div>

    <p class="mt-4 text-3xl font-bold tabular-nums text-slate-900 dark:text-zinc-100 leading-none">
      {{ weeklyAverage }}<span class="text-base font-semibold text-slate-400 dark:text-zinc-500">%</span>
    </p>

    <div v-if="hasGoodHabits" class="mt-5 flex-1 flex items-end justify-between gap-2 min-h-[120px]">
      <div
        v-for="day in days"
        :key="day.dateStr"
        class="flex-1 flex flex-col items-center gap-2 h-full"
        :title="`${day.label}: ${day.percent}%`"
      >
        <div class="relative w-full flex-1 flex items-end rounded-xl bg-[#f3f3f6] dark:bg-zinc-800/70 overflow-hidden">
          <div
            class="w-full rounded-xl transition-all duration-700 ease-out"
            :class="day.isToday ? 'bg-[#144229] dark:bg-[#a1d2af]' : 'bg-[#9fcfad] dark:bg-[#2d5a3f]'"
            :style="{ height: `${Math.max(day.percent, day.percent > 0 ? 8 : 0)}%` }"
          />
        </div>
        <span
          class="text-[11px] font-semibold capitalize"
          :class="day.isToday ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-400 dark:text-zinc-500'"
        >
          {{ day.label }}
        </span>
      </div>
    </div>

    <div v-else class="mt-5 flex-1 flex items-center justify-center min-h-[120px] rounded-2xl border border-dashed border-[#e2e2e5] dark:border-zinc-800 px-4 text-center">
      <p class="text-xs text-slate-400 dark:text-zinc-500">
        Grafik muncul setelah kamu membuat good habit pertama.
      </p>
    </div>
  </section>
</template>
