<script setup>
import { computed } from 'vue'
import { CheckCircle, Spark } from '@iconoir/vue'
import { formatDateJakarta } from '@/utils/dateUtils'

const props = defineProps({
  percent: { type: Number, default: 0 },
  tasksDone: { type: Number, default: 0 },
  tasksTotal: { type: Number, default: 0 },
  habitsDone: { type: Number, default: 0 },
  habitsTotal: { type: Number, default: 0 },
})

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const safePercent = computed(() => Math.min(100, Math.max(0, Math.round(props.percent))))
const dashOffset = computed(() => CIRCUMFERENCE * (1 - safePercent.value / 100))

const todayLabel = computed(() =>
  formatDateJakarta(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })
)

const headline = computed(() => {
  const total = props.tasksTotal + props.habitsTotal
  if (total === 0) return 'Hari yang masih kosong'
  if (safePercent.value >= 100) return 'Semua beres hari ini!'
  if (safePercent.value >= 70) return 'Sedikit lagi, tetap semangat'
  if (safePercent.value >= 30) return 'Progresmu sudah jalan'
  return 'Ayo mulai dari satu hal kecil'
})

const subline = computed(() => {
  const total = props.tasksTotal + props.habitsTotal
  if (total === 0) return 'Belum ada tugas atau habit untuk hari ini. Tambahkan lewat tombol +.'
  const remaining = total - props.tasksDone - props.habitsDone
  if (remaining <= 0) return 'Seluruh tugas dan target habit hari ini sudah tercapai.'
  return `${remaining} hal lagi untuk menuntaskan hari ini.`
})
</script>

<template>
  <section
    class="relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white bg-gradient-to-br from-[#144229] via-[#1d5236] to-[#2d5a3f] dark:from-[#123823] dark:via-[#16422b] dark:to-[#1f4a33] shadow-[0px_10px_30px_rgba(20,66,41,0.18)]"
  >
    <!-- Ornamen dekoratif -->
    <div class="pointer-events-none absolute -top-16 -right-12 w-56 h-56 rounded-full bg-[#a1d2af]/20 blur-3xl" />
    <div class="pointer-events-none absolute -bottom-20 left-10 w-48 h-48 rounded-full bg-[#d3e4d8]/10 blur-2xl" />

    <div class="relative flex flex-col-reverse sm:flex-row sm:items-center gap-6">
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#a1d2af]">
          {{ todayLabel }}
        </p>
        <h2 class="mt-2 text-2xl sm:text-[28px] leading-tight font-bold tracking-tight">
          {{ headline }}
        </h2>
        <p class="mt-1.5 text-sm text-white/70 max-w-md">
          {{ subline }}
        </p>

        <div class="mt-5 flex flex-wrap gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
            <CheckCircle class="w-3.5 h-3.5 text-[#a1d2af]" />
            <span class="tabular-nums">{{ tasksDone }}/{{ tasksTotal }}</span> tugas
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
            <Spark class="w-3.5 h-3.5 text-[#a1d2af]" />
            <span class="tabular-nums">{{ habitsDone }}/{{ habitsTotal }}</span> habit
          </span>
        </div>
      </div>

      <!-- Progress Ring -->
      <div class="relative w-32 h-32 shrink-0 self-start sm:self-auto">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" :r="RADIUS" fill="none" stroke="currentColor" stroke-width="10" class="text-white/10" />
          <circle
            cx="60"
            cy="60"
            :r="RADIUS"
            fill="none"
            stroke="#a1d2af"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="dashOffset"
            class="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-3xl font-bold tabular-nums leading-none">{{ safePercent }}<span class="text-lg">%</span></span>
          <span class="mt-1 text-[11px] font-medium text-white/60">hari ini</span>
        </div>
      </div>
    </div>
  </section>
</template>
