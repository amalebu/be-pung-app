<script setup>
import { Spark, CheckCircle, ShieldAlert, FireFlame } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'

defineProps({
  summary: {
    type: Object,
    required: true,
  },
  activeTypeFilter: {
    type: String,
    default: 'all',
  },
})

const emit = defineEmits(['select-type'])
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
    <!-- Total Habits -->
    <button
      type="button"
      @click="emit('select-type', 'all')"
      class="text-left transition-all cursor-pointer active:scale-[0.98]"
    >
      <BaseCard
        padding="p-3.5 sm:p-4"
        class="h-full"
        :class="
          activeTypeFilter === 'all'
            ? 'ring-2 ring-indigo-500/40 border-indigo-400 dark:border-indigo-500'
            : 'hover:border-slate-300 dark:hover:border-zinc-700'
        "
      >
        <div class="flex items-center justify-between gap-2">
          <BaseText size="xs" variant="muted" weight="medium">
            Semua Habit
          </BaseText>
          <Spark class="w-4 h-4 text-indigo-500 shrink-0" />
        </div>
        <BaseHeading as="p" size="xl" weight="bold" tabular class="mt-1.5">
          {{ summary.total ?? 0 }}
        </BaseHeading>
      </BaseCard>
    </button>

    <!-- Good Habits Progress Today -->
    <button
      type="button"
      @click="emit('select-type', 'good')"
      class="text-left transition-all cursor-pointer active:scale-[0.98]"
    >
      <BaseCard
        padding="p-3.5 sm:p-4"
        class="h-full"
        :class="
          activeTypeFilter === 'good'
            ? 'ring-2 ring-emerald-500/40 border-emerald-400 dark:border-emerald-500'
            : 'hover:border-slate-300 dark:hover:border-zinc-700'
        "
      >
        <div class="flex items-center justify-between gap-2">
          <BaseText size="xs" variant="muted" weight="medium">
            Good Habit Hari Ini
          </BaseText>
          <CheckCircle class="w-4 h-4 text-emerald-500 shrink-0" />
        </div>
        <BaseHeading as="p" size="xl" weight="bold" tabular class="mt-1.5 text-emerald-600 dark:text-emerald-400">
          {{ summary.good_completed_today ?? 0 }} / {{ summary.good_count ?? 0 }}
        </BaseHeading>
      </BaseCard>
    </button>

    <!-- Bad Habits Clean Today -->
    <button
      type="button"
      @click="emit('select-type', 'bad')"
      class="text-left transition-all cursor-pointer active:scale-[0.98]"
    >
      <BaseCard
        padding="p-3.5 sm:p-4"
        class="h-full"
        :class="
          activeTypeFilter === 'bad'
            ? 'ring-2 ring-rose-500/40 border-rose-400 dark:border-rose-500'
            : 'hover:border-slate-300 dark:hover:border-zinc-700'
        "
      >
        <div class="flex items-center justify-between gap-2">
          <BaseText size="xs" variant="muted" weight="medium">
            Bad Habit Terkendali
          </BaseText>
          <ShieldAlert class="w-4 h-4 text-rose-500 shrink-0" />
        </div>
        <BaseHeading as="p" size="xl" weight="bold" tabular class="mt-1.5 text-rose-600 dark:text-rose-400">
          {{ summary.bad_clean_today ?? 0 }} / {{ summary.bad_count ?? 0 }}
        </BaseHeading>
      </BaseCard>
    </button>

    <!-- Best Streak -->
    <BaseCard padding="p-3.5 sm:p-4" class="h-full">
      <div class="flex items-center justify-between gap-2">
        <BaseText size="xs" variant="muted" weight="medium">
          Streak Terbaik
        </BaseText>
        <FireFlame class="w-4 h-4 text-amber-500 shrink-0" />
      </div>
      <BaseHeading as="p" size="xl" weight="bold" tabular class="mt-1.5 text-amber-600 dark:text-amber-400">
        {{ summary.best_streak ?? 0 }} <span class="text-xs font-medium text-slate-500 dark:text-zinc-400">hari</span>
      </BaseHeading>
    </BaseCard>
  </div>
</template>
