<script setup>
import { computed } from 'vue'
import { Calendar, Clock, WarningCircle } from '@iconoir/vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { getJakartaTodayStr, formatDateJakarta } from '@/utils/dateUtils'

const props = defineProps({
  dueDate: {
    type: String,
    default: null, // YYYY-MM-DD
  },
  dueTime: {
    type: String,
    default: null, // HH:mm
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  isOverdue: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'xs',
  },
})

function getLocalDateStr(offsetDays = 0) {
  return getJakartaTodayStr(offsetDays)
}

const formattedDate = computed(() => {
  if (!props.dueDate) return ''

  const today = getLocalDateStr(0)
  const tomorrow = getLocalDateStr(1)
  const yesterday = getLocalDateStr(-1)

  let datePart = props.dueDate
  if (props.dueDate === today) {
    datePart = 'Hari Ini'
  } else if (props.dueDate === tomorrow) {
    datePart = 'Besok'
  } else if (props.dueDate === yesterday) {
    datePart = 'Kemarin'
  } else {
    const [y, m, d] = props.dueDate.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    datePart = formatDateJakarta(dateObj, {
      day: 'numeric',
      month: 'short',
      year: y !== Number(getJakartaTodayStr().slice(0, 4)) ? 'numeric' : undefined,
    })
  }

  if (props.dueTime) {
    return `${datePart}, ${props.dueTime}`
  }

  return datePart
})

const badgeVariant = computed(() => {
  if (props.isCompleted) return 'neutral'
  if (props.isOverdue) return 'rose'
  if (props.dueDate === getLocalDateStr(0)) return 'indigo'
  return 'neutral'
})
</script>

<template>
  <BaseBadge
    v-if="dueDate"
    :variant="badgeVariant"
    :size="size"
    class="tabular-nums"
  >
    <WarningCircle v-if="isOverdue && !isCompleted" class="w-2.5 h-2.5" />
    <Clock v-else-if="dueTime" class="w-2.5 h-2.5" />
    <Calendar v-else class="w-2.5 h-2.5" />
    <span>{{ isOverdue && !isCompleted ? `Terlambat • ${formattedDate}` : formattedDate }}</span>
  </BaseBadge>
</template>
