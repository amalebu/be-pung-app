<script setup>
import {
  ListTodo,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'

defineProps({
  counts: {
    type: Object,
    required: true,
  },
  activeFilter: {
    type: String,
    default: 'all',
  },
})

const emit = defineEmits(['select-filter'])

const cards = [
  {
    key: 'all',
    countKey: 'active',
    label: 'Tugas Aktif',
    icon: ListTodo,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    activeBorder: 'ring-2 ring-indigo-500/40 border-indigo-400 dark:border-indigo-500',
  },
  {
    key: 'today',
    countKey: 'today',
    label: 'Hari Ini',
    icon: CalendarClock,
    iconColor: 'text-amber-500 dark:text-amber-400',
    activeBorder: 'ring-2 ring-amber-500/40 border-amber-400 dark:border-amber-500',
  },
  {
    key: 'overdue',
    countKey: 'overdue',
    label: 'Terlambat',
    icon: AlertTriangle,
    iconColor: 'text-rose-600 dark:text-rose-400',
    activeBorder: 'ring-2 ring-rose-500/40 border-rose-400 dark:border-rose-500',
  },
  {
    key: 'completed',
    countKey: 'completed',
    label: 'Selesai',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    activeBorder: 'ring-2 ring-emerald-500/40 border-emerald-400 dark:border-emerald-500',
  },
]
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
    <button
      v-for="card in cards"
      :key="card.key"
      type="button"
      @click="emit('select-filter', card.key)"
      class="text-left transition-all duration-150 cursor-pointer active:scale-[0.98]"
    >
      <BaseCard
        padding="p-3.5 sm:p-4"
        class="h-full transition-colors"
        :class="activeFilter === card.key ? card.activeBorder : 'hover:border-slate-300 dark:hover:border-zinc-700'"
      >
        <div class="flex items-center justify-between gap-2">
          <BaseText size="xs" variant="muted" weight="medium">
            {{ card.label }}
          </BaseText>
          <component :is="card.icon" class="w-4 h-4 shrink-0" :class="card.iconColor" />
        </div>
        <BaseHeading as="p" size="xl" weight="bold" tabular class="mt-1.5">
          {{ counts[card.countKey] ?? 0 }}
        </BaseHeading>
      </BaseCard>
    </button>
  </div>
</template>
