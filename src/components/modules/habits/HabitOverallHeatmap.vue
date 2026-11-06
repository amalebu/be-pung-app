<script setup>
import { computed, ref, onMounted } from 'vue'
import { Calendar } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import { getTodayDateStr } from '@/stores/habitStore'
import { formatDateJakarta } from '@/utils/dateUtils'

const props = defineProps({
  habits: {
    type: Array,
    default: () => [],
  },
})

const scrollRef = ref(null)
const weeksCount = 26 // Setengah tahun penuh di kalender utama atas

function formatDateLocal(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const overallWeeks = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = getTodayDateStr(0)

  const dayOfWeek = today.getDay()
  const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek
  const endOfCurrentWeek = new Date(today)
  endOfCurrentWeek.setDate(today.getDate() + (7 - isoDay))

  const totalDays = weeksCount * 7
  const startDate = new Date(endOfCurrentWeek)
  startDate.setDate(endOfCurrentWeek.getDate() - totalDays + 1)

  const goodHabits = props.habits.filter((h) => h.type === 'good')
  const badHabits = props.habits.filter((h) => h.type === 'bad')

  // Pre-index logs per habit per date
  const habitLogsIndex = new Map()
  for (const h of props.habits) {
    const map = {}
    for (const l of h.logs || []) {
      if (l.logged_date) map[l.logged_date] = Number(l.value || 0)
    }
    habitLogsIndex.set(h.id, map)
  }

  const weeks = []
  let lastMonth = -1

  for (let w = 0; w < weeksCount; w++) {
    const days = []
    let monthLabel = ''

    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate)
      cellDate.setDate(startDate.getDate() + w * 7 + d)
      const dateStr = formatDateLocal(cellDate)
      const isFuture = dateStr > todayStr
      const isToday = dateStr === todayStr

      if (d === 0) {
        const m = cellDate.getMonth()
        if (m !== lastMonth) {
          monthLabel = formatDateJakarta(cellDate, { month: 'short' })
          lastMonth = m
        }
      }

      if (isFuture) {
        days.push({
          dateStr,
          isFuture: true,
          isToday: false,
          className:
            'bg-transparent border border-dashed border-slate-200/40 dark:border-zinc-800/40 opacity-35',
          tooltip: 'Belum waktunya',
        })
        continue
      }

      // Hitung rata-rata pencapaian Good Habit pada tanggal tersebut
      let totalRatio = 0
      for (const gh of goodHabits) {
        const val = habitLogsIndex.get(gh.id)?.[dateStr] ?? 0
        const target = Math.max(0.01, Number(gh.target_value || 1))
        totalRatio += Math.min(1, val / target)
      }
      const avgGoodRatio = goodHabits.length > 0 ? totalRatio / goodHabits.length : 0

      // Cek apakah ada Bad Habit yang melewati batas pada tanggal tersebut
      let badExceeded = false
      let badTempted = false
      for (const bh of badHabits) {
        const val = habitLogsIndex.get(bh.id)?.[dateStr] ?? 0
        const maxLimit = Math.max(0, Number(bh.target_value || 0))
        const step = Math.max(0.01, Number(bh.step_value || 1))
        if (val > 0) {
          const limit = maxLimit > 0 ? maxLimit : step
          if (val > limit) badExceeded = true
          else badTempted = true
        }
      }

      let className =
        'bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/70 dark:border-zinc-700/60'
      let statusDesc = 'Belum ada aktivitas'

      if (avgGoodRatio >= 1) {
        className =
          'bg-emerald-600 dark:bg-emerald-500 border border-emerald-700 dark:border-emerald-400'
        statusDesc = 'Semua Target Good Habit Tercapai (100%)'
      } else if (avgGoodRatio >= 0.7) {
        className =
          'bg-emerald-400 dark:bg-emerald-600/80 border border-emerald-500'
        statusDesc = `Progres Good Habit ${Math.round(avgGoodRatio * 100)}%`
      } else if (avgGoodRatio >= 0.35) {
        className =
          'bg-emerald-300 dark:bg-emerald-800/80 border border-emerald-400'
        statusDesc = `Progres Good Habit ${Math.round(avgGoodRatio * 100)}%`
      } else if (avgGoodRatio > 0) {
        className =
          'bg-emerald-200 dark:bg-emerald-950/90 border border-emerald-300'
        statusDesc = `Progres Good Habit ${Math.round(avgGoodRatio * 100)}%`
      } else if (badExceeded) {
        className =
          'bg-rose-600 dark:bg-rose-500 border border-rose-700'
        statusDesc = 'Bad Habit melewati batas maksimal'
      } else if (badTempted) {
        className =
          'bg-rose-300 dark:bg-rose-900/80 border border-rose-400'
        statusDesc = 'Tergoda sedikit pada Bad Habit'
      }

      const readableDate = formatDateJakarta(cellDate, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })

      days.push({
        dateStr,
        isFuture: false,
        isToday,
        className,
        tooltip: `${readableDate}: ${statusDesc}`,
      })
    }

    weeks.push({
      weekIndex: w,
      monthLabel,
      days,
    })
  }

  return weeks
})

onMounted(() => {
  if (scrollRef.value) {
    scrollRef.value.scrollLeft = scrollRef.value.scrollWidth
  }
})
</script>

<template>
  <BaseCard padding="p-4 sm:p-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Calendar class="w-4 h-4" />
        </div>
        <div>
          <BaseHeading as="h3" size="sm" weight="semibold">
            Kalender Konsistensi (GitHub Heatmap)
          </BaseHeading>
          <BaseText size="xs" variant="muted">
            Semakin pekat hijau = target Good Habit terpenuhi. Semakin merah = melewati batas Bad Habit.
          </BaseText>
        </div>
      </div>
    </div>

    <!-- Scrollable Heatmap Matrix -->
    <div ref="scrollRef" class="overflow-x-auto pb-2 no-scrollbar">
      <div class="inline-flex flex-col min-w-full">
        <!-- Month Headers -->
        <div class="flex items-center gap-1 pl-6 mb-1 text-[10px] text-slate-400 dark:text-zinc-500 font-medium select-none">
          <div
            v-for="week in overallWeeks"
            :key="week.weekIndex"
            class="w-3.5 shrink-0 overflow-visible whitespace-nowrap"
          >
            {{ week.monthLabel }}
          </div>
        </div>

        <!-- Rows -->
        <div class="flex items-start gap-1">
          <div class="flex flex-col gap-1 pr-1 text-[9px] text-slate-400 dark:text-zinc-500 font-medium select-none w-5 shrink-0">
            <span class="h-3.5 leading-[14px]">Sen</span>
            <span class="h-3.5 leading-[14px]"></span>
            <span class="h-3.5 leading-[14px]">Rab</span>
            <span class="h-3.5 leading-[14px]"></span>
            <span class="h-3.5 leading-[14px]">Jum</span>
            <span class="h-3.5 leading-[14px]"></span>
            <span class="h-3.5 leading-[14px]">Min</span>
          </div>

          <div
            v-for="week in overallWeeks"
            :key="week.weekIndex"
            class="flex flex-col gap-1 shrink-0"
          >
            <div
              v-for="day in week.days"
              :key="day.dateStr"
              class="w-3.5 h-3.5 rounded-[3px] transition-transform hover:scale-125"
              :class="[
                day.className,
                day.isToday ? 'ring-1.5 ring-indigo-500 dark:ring-indigo-400 ring-offset-1 dark:ring-offset-zinc-900' : '',
              ]"
              :title="day.tooltip"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Dual Color Saturation Legend (Good Habit Green Scale & Bad Habit Red Scale) -->
    <div class="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
      <!-- Good Habit Scale -->
      <div class="flex items-center gap-1.5">
        <span class="font-medium text-emerald-700 dark:text-emerald-400">Good Habit:</span>
        <span>0%</span>
        <span class="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700" title="0%" />
        <span class="w-3 h-3 rounded-[3px] bg-emerald-200 dark:bg-emerald-950 border border-emerald-300" title="25% Target" />
        <span class="w-3 h-3 rounded-[3px] bg-emerald-300 dark:bg-emerald-800 border border-emerald-400" title="50% Target" />
        <span class="w-3 h-3 rounded-[3px] bg-emerald-400 dark:bg-emerald-600 border border-emerald-500" title="75% Target" />
        <span class="w-3 h-3 rounded-[3px] bg-emerald-600 dark:bg-emerald-500 border border-emerald-700" title="100%+ Target Penuh" />
        <span>Target Penuh</span>
      </div>

      <!-- Bad Habit Scale -->
      <div class="flex items-center gap-1.5">
        <span class="font-medium text-rose-600 dark:text-rose-400">Bad Habit:</span>
        <span>Bersih (Putih)</span>
        <span class="w-3 h-3 rounded-[3px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700" title="Tidak tergoda sama sekali (Putih)" />
        <span class="w-3 h-3 rounded-[3px] bg-rose-300 dark:bg-rose-900/80 border border-rose-400" title="Tergoda sedikit (Agak Merah)" />
        <span class="w-3 h-3 rounded-[3px] bg-rose-600 dark:bg-rose-500 border border-rose-700" title="Melewati batas maksimal (Merah Pekat)" />
        <span>Lewat Batas</span>
      </div>
    </div>
  </BaseCard>
</template>
