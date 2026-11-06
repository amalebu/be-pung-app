<script setup>
import { computed, ref, onMounted } from 'vue'
import { getHabitCellVisual, getTodayDateStr } from '@/stores/habitStore'
import { formatDateJakarta } from '@/utils/dateUtils'

const props = defineProps({
  habit: {
    type: Object,
    required: true,
  },
  weeksCount: {
    type: Number,
    default: 20, // 20 minggu (~5 bulan) per kartu agar muat rapi di HP & bisa di-scroll
  },
})

const emit = defineEmits(['select-date'])

const scrollContainerRef = ref(null)

function formatDateLocal(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const logMap = computed(() => {
  const map = {}
  for (const log of props.habit.logs || []) {
    if (log.logged_date) {
      map[log.logged_date] = Number(log.value || 0)
    }
  }
  return map
})

const weeksGrid = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = getTodayDateStr(0)

  // Cari hari Minggu di akhir minggu berjalan agar kolom seperti GitHub (Senin..Minggu)
  const dayOfWeek = today.getDay() // 0 Minggu .. 6 Sabtu
  const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek // 1 Senin .. 7 Minggu
  const endOfCurrentWeek = new Date(today)
  endOfCurrentWeek.setDate(today.getDate() + (7 - isoDay))

  const totalDays = props.weeksCount * 7
  const startDate = new Date(endOfCurrentWeek)
  startDate.setDate(endOfCurrentWeek.getDate() - totalDays + 1)

  const weeks = []
  let lastMonth = -1

  for (let w = 0; w < props.weeksCount; w++) {
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

      const val = logMap.value[dateStr] ?? 0
      const visual = isFuture
        ? {
            level: -1,
            className: 'bg-transparent border border-dashed border-slate-200/40 dark:border-zinc-800/40 opacity-35 pointer-events-none',
            label: 'Belum waktunya',
          }
        : getHabitCellVisual(props.habit, val)

      const readableDate = formatDateJakarta(cellDate, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })

      days.push({
        dateStr,
        readableDate,
        value: val,
        isFuture,
        isToday,
        visual,
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
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollLeft = scrollContainerRef.value.scrollWidth
  }
})
</script>

<template>
  <div class="pt-2">
    <div
      ref="scrollContainerRef"
      class="overflow-x-auto pb-1 no-scrollbar"
    >
      <div class="inline-flex flex-col min-w-full">
        <!-- Month Labels Row -->
        <div class="flex items-center gap-1 pl-6 mb-1 text-[10px] text-slate-400 dark:text-zinc-500 font-medium select-none">
          <div
            v-for="week in weeksGrid"
            :key="week.weekIndex"
            class="w-3.5 shrink-0 overflow-visible whitespace-nowrap"
          >
            {{ week.monthLabel }}
          </div>
        </div>

        <!-- Grid Body: Day Labels + Weekly Columns -->
        <div class="flex items-start gap-1">
          <!-- Day of Week Labels (Sen, Rab, Jum) -->
          <div class="flex flex-col gap-1 pr-1 text-[9px] text-slate-400 dark:text-zinc-500 font-medium select-none w-5 shrink-0">
            <span class="h-3.5 leading-[14px]">Sen</span>
            <span class="h-3.5 leading-[14px]"></span>
            <span class="h-3.5 leading-[14px]">Rab</span>
            <span class="h-3.5 leading-[14px]"></span>
            <span class="h-3.5 leading-[14px]">Jum</span>
            <span class="h-3.5 leading-[14px]"></span>
            <span class="h-3.5 leading-[14px]">Min</span>
          </div>

          <!-- Week Columns -->
          <div
            v-for="week in weeksGrid"
            :key="week.weekIndex"
            class="flex flex-col gap-1 shrink-0"
          >
            <button
              v-for="day in week.days"
              :key="day.dateStr"
              type="button"
              :disabled="day.isFuture"
              @click="emit('select-date', day.dateStr)"
              class="w-3.5 h-3.5 rounded-[3px] transition-transform duration-100 hover:scale-125 cursor-pointer"
              :class="[
                day.visual.className,
                day.isToday ? 'ring-1.5 ring-indigo-500 dark:ring-indigo-400 ring-offset-1 dark:ring-offset-zinc-900' : '',
              ]"
              :title="`${day.readableDate}: ${day.visual.label}`"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
