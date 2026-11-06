<script setup>
import { onMounted } from 'vue'
import { Plus, Spark, ShieldAlert, Search, Xmark } from '@iconoir/vue'
import AppShell from '@/components/layout/AppShell.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import HabitSummaryBar from '@/components/modules/habits/HabitSummaryBar.vue'
import HabitOverallHeatmap from '@/components/modules/habits/HabitOverallHeatmap.vue'
import HabitCard from '@/components/modules/habits/HabitCard.vue'
import HabitLogDaySheet from '@/components/modules/habits/HabitLogDaySheet.vue'
import { useHabitStore, getTodayDateStr } from '@/stores/habitStore'

const habitStore = useHabitStore()

function handleSearchInput(val) {
  habitStore.searchQuery = val
  habitStore.refreshFromLocalCache()
}

async function handleIncrementToday(habit) {
  const step = Math.max(0.01, Number(habit.step_value || 1))
  await habitStore.logProgress(habit.id, {
    logged_date: getTodayDateStr(0),
    mode: 'increment',
    value: step,
  })
}

async function handleDecrementToday(habit) {
  const step = Math.max(0.01, Number(habit.step_value || 1))
  await habitStore.logProgress(habit.id, {
    logged_date: getTodayDateStr(0),
    mode: 'increment',
    value: -step,
  })
}

function handleSelectDateCell({ habit, dateStr }) {
  habitStore.openLogDaySheet(habit, dateStr)
}

async function handleSaveDayLog(payload) {
  await habitStore.logProgress(payload.habitId, {
    logged_date: payload.logged_date,
    mode: payload.mode,
    value: payload.value,
    note: payload.note,
    immediate: payload.immediate ?? true,
  })
}

const typeTabs = [
  { id: 'all', label: 'Semua Habit' },
  { id: 'good', label: 'Good Habits (Hijau)' },
  { id: 'bad', label: 'Remove Bad Habits (Merah)' },
]

onMounted(() => {
  habitStore.fetchHabits()
})
</script>

<template>
  <AppShell>
    <div class="space-y-5">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <BaseHeading as="h2" size="xl" weight="semibold">
            Habit Tracker & GitHub Heatmap
          </BaseHeading>
          <BaseText size="sm" variant="muted" class="mt-0.5">
            Bangun kebiasaan baik (Hijau) & hilangkan kebiasaan buruk (Putih/Merah) dengan kalender konsistensi.
          </BaseText>
        </div>

        <div class="flex items-center gap-2">
          <SecondaryButton
            size="sm"
            @click="habitStore.openCreateSheet('bad')"
          >
            <ShieldAlert class="w-4 h-4 text-rose-500" />
            <span>+ Bad Habit</span>
          </SecondaryButton>

          <PrimaryButton
            size="sm"
            @click="habitStore.openCreateSheet('good')"
          >
            <Plus class="w-4 h-4" />
            <span>+ Good Habit</span>
          </PrimaryButton>
        </div>
      </div>

      <!-- Summary Metric Cards -->
      <HabitSummaryBar
        :summary="habitStore.summary"
        :active-type-filter="habitStore.activeTypeFilter"
        @select-type="habitStore.setTypeFilter"
      />

      <!-- GitHub Contribution Heatmap Overview + Color Saturation Legend -->
      <HabitOverallHeatmap :habits="habitStore.habits" />

      <!-- Filter Tabs & Search Box -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            v-for="tab in typeTabs"
            :key="tab.id"
            type="button"
            @click="habitStore.setTypeFilter(tab.id)"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
            :class="
              habitStore.activeTypeFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
            "
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="relative sm:w-64">
          <Search class="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            :value="habitStore.searchQuery"
            type="text"
            placeholder="Cari habit..."
            @input="handleSearchInput($event.target.value)"
            class="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            v-if="habitStore.searchQuery"
            type="button"
            @click="handleSearchInput('')"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <Xmark class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- State 1: Loading Skeleton -->
      <div
        v-if="habitStore.loading && habitStore.habits.length === 0"
        class="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <div
          v-for="n in 2"
          :key="n"
          class="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse space-y-3"
        >
          <div class="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
          <div class="h-12 bg-slate-100 dark:bg-zinc-800/70 rounded" />
          <div class="h-24 bg-slate-100 dark:bg-zinc-800/60 rounded" />
        </div>
      </div>

      <!-- State 2: Empty State -->
      <BaseCard
        v-else-if="habitStore.habits.length === 0"
        padding="p-8 sm:p-10"
        class="text-center"
      >
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <Spark class="w-6 h-6" />
        </div>
        <BaseHeading as="h3" size="md" weight="semibold">
          Belum Ada Habit pada Kategori Ini
        </BaseHeading>
        <BaseText size="xs" variant="muted" class="mt-1 max-w-md mx-auto">
          Mulai bangun kebiasaan baik (seperti minum air 2 liter) atau hilangkan kebiasaan buruk dan lihat kalender GitHub Anda terisi setiap hari.
        </BaseText>
        <div class="mt-4 flex items-center justify-center gap-2.5">
          <PrimaryButton size="md" @click="habitStore.openCreateSheet('good')">
            <Plus class="w-4 h-4" />
            <span>Buat Good Habit</span>
          </PrimaryButton>
          <SecondaryButton size="md" @click="habitStore.openCreateSheet('bad')">
            <ShieldAlert class="w-4 h-4 text-rose-500" />
            <span>Remove Bad Habit</span>
          </SecondaryButton>
        </div>
      </BaseCard>

      <!-- State 3: Habit Cards Grid (HabitKit Style) -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HabitCard
          v-for="habit in habitStore.habits"
          :key="habit.id"
          :habit="habit"
          @increment-today="handleIncrementToday"
          @decrement-today="handleDecrementToday"
          @select-date="handleSelectDateCell"
          @edit="habitStore.openEditSheet"
          @delete="habitStore.deleteHabit"
        />
      </div>
    </div>

    <!-- Bottom Sheet for Logging/Editing Specific Calendar Date (Backfill) -->
    <HabitLogDaySheet
      :show="habitStore.isLogSheetOpen"
      :target="habitStore.activeLogTarget"
      @close="habitStore.closeLogDaySheet()"
      @save="handleSaveDayLog"
    />
  </AppShell>
</template>
