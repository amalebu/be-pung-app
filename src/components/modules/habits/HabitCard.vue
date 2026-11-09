<script setup>
import { computed } from 'vue'
import {
  FireFlame,
  Plus,
  Minus,
  EditPencil,
  Trash,
  CloudUpload,
  Calendar,
} from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import HabitHeatmapGrid from './HabitHeatmapGrid.vue'
import { getHabitIcon } from '@/utils/habitIcons'
import { getTodayDateStr } from '@/stores/habitStore'

const props = defineProps({
  habit: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits([
  'increment-today',
  'decrement-today',
  'select-date',
  'edit',
  'delete',
])

const iconComponent = computed(() => getHabitIcon(props.habit.icon))

const isGood = computed(() => props.habit.type === 'good')
const todayVal = computed(() => Number(props.habit.today_value || 0))
const targetVal = computed(() => Math.max(0, Number(props.habit.target_value || 0)))
const stepVal = computed(() => Math.max(0.01, Number(props.habit.step_value || 1)))

const progressPercent = computed(() => {
  if (isGood.value) {
    if (targetVal.value <= 0) return todayVal.value > 0 ? 100 : 0
    return Math.min(100, Math.round((todayVal.value / targetVal.value) * 100))
  }
  // Bad habit: 0 = bersih (0% bar), <= target = kuning/agak merah, > target = 100% merah pekat
  if (todayVal.value <= 0) return 0
  const maxRef = targetVal.value > 0 ? targetVal.value * 1.5 : stepVal.value * 2
  return Math.min(100, Math.round((todayVal.value / maxRef) * 100))
})

const progressBarColor = computed(() => {
  if (isGood.value) {
    if (progressPercent.value >= 100) return 'bg-emerald-600 dark:bg-emerald-500'
    if (progressPercent.value >= 60) return 'bg-emerald-400'
    return 'bg-emerald-300'
  }
  if (todayVal.value <= 0) return 'bg-slate-200 dark:zinc-700'
  const limit = targetVal.value > 0 ? targetVal.value : stepVal.value
  if (todayVal.value <= limit) return 'bg-rose-300 dark:bg-rose-400'
  return 'bg-rose-600 dark:bg-rose-500'
})

function handleSelectDate(dateStr) {
  emit('select-date', { habit: props.habit, dateStr })
}
</script>

<template>
  <BaseCard padding="p-4 sm:p-5" class="flex flex-col justify-between space-y-3.5 transition-all duration-200">
    <!-- Top Row: Icon, Title, Badges, & Edit/Delete -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3 min-w-0">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          :class="
            isGood
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50'
          "
        >
          <component :is="iconComponent" class="w-5 h-5" />
        </div>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-1.5">
            <BaseHeading as="h4" size="sm" weight="semibold" class="truncate">
              {{ habit.name }}
            </BaseHeading>

            <BaseBadge :variant="isGood ? 'emerald' : 'rose'" size="xs">
              {{ isGood ? 'Good Habit' : 'Remove Bad Habit' }}
            </BaseBadge>

            <BaseBadge variant="amber" size="xs" class="tabular-nums">
              <FireFlame class="w-2.5 h-2.5 fill-current" />
              <span>{{ habit.current_streak || 0 }} hari</span>
            </BaseBadge>

            <span
              v-if="habit.is_pending_sync"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70"
            >
              <CloudUpload class="w-2.5 h-2.5" />
              <span>Menunggu sync</span>
            </span>
          </div>

          <BaseText
            v-if="habit.description"
            size="xs"
            variant="muted"
            class="mt-0.5 line-clamp-1"
          >
            {{ habit.description }}
          </BaseText>
        </div>
      </div>

      <!-- Edit & Delete Buttons -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          type="button"
          @click="handleSelectDate(getTodayDateStr(0))"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
          title="Isi nilai spesifik / catatan hari ini"
        >
          <Calendar class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="emit('edit', habit)"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
          title="Edit pengaturan habit"
        >
          <EditPencil class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click="emit('delete', habit.id)"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 btn-press cursor-pointer"
          title="Hapus habit"
        >
          <Trash class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Today's Progress Bar & Quick +/- Controls -->
    <div class="p-3 rounded-xl bg-slate-50/90 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-800 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          @click="handleSelectDate(getTodayDateStr(0))"
          class="text-left cursor-pointer group"
        >
          <span class="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block">
            {{ isGood ? 'Progres Hari Ini:' : 'Catatan Tergoda Hari Ini:' }}
          </span>
          <span
            class="text-sm font-bold tabular-nums group-hover:underline"
            :class="
              isGood
                ? todayVal >= targetVal
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-zinc-100'
                : todayVal === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : todayVal <= targetVal
                    ? 'text-rose-500 dark:text-rose-300'
                    : 'text-rose-600 dark:text-rose-400'
            "
          >
            <template v-if="isGood">
              {{ todayVal }} / {{ targetVal }} {{ habit.unit }}
              <span v-if="todayVal >= targetVal" class="text-xs font-semibold ml-1">🎯 Target Penuh!</span>
            </template>
            <template v-else>
              <span v-if="todayVal === 0">0 {{ habit.unit }} (Bersih / Bebas)</span>
              <span v-else>{{ todayVal }} {{ habit.unit }} (Batas maks: {{ targetVal }} {{ habit.unit }})</span>
            </template>
          </span>
        </button>

        <!-- Quick Increment / Decrement Step Buttons -->
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            :disabled="todayVal <= 0"
            @click="emit('decrement-today', habit)"
            class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 disabled:opacity-35 disabled:pointer-events-none transition-all cursor-pointer active:scale-95"
            :title="`Kurangi ${stepVal} ${habit.unit}`"
          >
            <Minus class="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            @click="emit('increment-today', habit)"
            class="inline-flex items-center gap-1 px-3 h-8 rounded-lg text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer active:scale-95 tabular-nums"
            :class="
              isGood
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            "
          >
            <Plus class="w-3.5 h-3.5" />
            <span>{{ stepVal }} {{ habit.unit }}</span>
          </button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full h-1.5 bg-slate-200/80 dark:bg-zinc-700/70 rounded-md overflow-hidden">
        <div
          class="h-full rounded-md transition-all duration-300"
          :class="progressBarColor"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Individual GitHub Heatmap Calendar (Tap any day square to backfill/edit) -->
    <div>
      <div class="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 mb-0.5">
        <span>Kalender Riwayat (Ketuk kotak tanggal untuk edit)</span>
        <span class="tabular-nums">Rekor: {{ habit.longest_streak || 0 }} hari</span>
      </div>

      <HabitHeatmapGrid
        :habit="habit"
        @select-date="handleSelectDate"
      />
    </div>
  </BaseCard>
</template>
