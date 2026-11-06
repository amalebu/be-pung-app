<script setup>
import { ref, watch, computed } from 'vue'
import { Calendar, Plus, Minus } from '@iconoir/vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import BaseText from '@/components/ui/BaseText.vue'
import { formatDateJakarta } from '@/utils/dateUtils'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  target: {
    type: Object,
    default: null, // { habit, dateStr, currentValue, note }
  },
})

const emit = defineEmits(['close', 'save'])

const valueInput = ref(0)
const noteInput = ref('')
const isSaving = ref(false)

const habit = computed(() => props.target?.habit || null)
const isGood = computed(() => habit.value?.type === 'good')
const stepVal = computed(() => Math.max(0.01, Number(habit.value?.step_value || 1)))
const targetVal = computed(() => Math.max(0, Number(habit.value?.target_value || 0)))

const formattedDateLabel = computed(() => {
  const dStr = props.target?.dateStr
  if (!dStr) return ''
  const [y, m, d] = dStr.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  return formatDateJakarta(dateObj, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

watch(
  () => props.target,
  (newTarget) => {
    if (!newTarget) return
    valueInput.value = Number(newTarget.currentValue || 0)
    noteInput.value = newTarget.note || ''
  },
  { immediate: true }
)

function adjustValue(delta) {
  valueInput.value = Math.max(
    0,
    Math.round((Number(valueInput.value || 0) + delta) * 100) / 100
  )
}

async function handleSave() {
  if (!habit.value || !props.target?.dateStr || isSaving.value) return
  isSaving.value = true
  try {
    emit('save', {
      habitId: habit.value.id,
      logged_date: props.target.dateStr,
      mode: 'set',
      value: Math.max(0, Number(valueInput.value || 0)),
      note: noteInput.value.trim() || null,
      immediate: true,
    })
    // Re-enable tombol simpan terlebih dahulu sebelum modal ditutup:
    isSaving.value = false
    await new Promise((r) => setTimeout(r, 100))
    emit('close')
  } catch {
    isSaving.value = false
  }
}
</script>

<template>
  <BottomSheet
    :show="show"
    :title="habit ? `Catat Log: ${habit.name}` : 'Catat Log Habit'"
    @close="emit('close')"
  >
    <form v-if="habit" @submit.prevent="handleSave" class="space-y-4">
      <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800/70 text-xs font-medium text-slate-700 dark:text-zinc-300">
        <Calendar class="w-4 h-4 text-indigo-500 shrink-0" />
        <span>{{ formattedDateLabel }}</span>
      </div>

      <!-- Numeric Stepper & Direct Input -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
          {{ isGood ? `Jumlah Pencapaian (${habit.unit})` : `Jumlah Tergoda (${habit.unit})` }}
        </label>

        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="adjustValue(-stepVal)"
            class="w-11 h-11 rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
          >
            <Minus class="w-4 h-4" />
          </button>

          <div class="flex-1 relative">
            <input
              v-model.number="valueInput"
              type="number"
              step="any"
              min="0"
              class="w-full text-center py-2.5 px-4 rounded-xl text-lg font-bold tabular-nums bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
            <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {{ habit.unit }}
            </span>
          </div>

          <button
            type="button"
            @click="adjustValue(stepVal)"
            class="w-11 h-11 rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>

        <!-- Quick Value Chips -->
        <div class="flex flex-wrap items-center gap-1.5 mt-2.5">
          <button
            type="button"
            @click="valueInput = 0"
            class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 cursor-pointer"
          >
            Reset 0 ({{ isGood ? 'Kosong' : 'Bersih Putih' }})
          </button>

          <button
            v-if="isGood && targetVal > 0"
            type="button"
            @click="valueInput = Math.round((targetVal / 2) * 100) / 100"
            class="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 cursor-pointer tabular-nums"
          >
            Setengah ({{ Math.round((targetVal / 2) * 100) / 100 }} {{ habit.unit }})
          </button>

          <button
            v-if="isGood && targetVal > 0"
            type="button"
            @click="valueInput = targetVal"
            class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white cursor-pointer tabular-nums"
          >
            Penuh Target ({{ targetVal }} {{ habit.unit }})
          </button>
        </div>
      </div>

      <!-- Optional Note -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
          Catatan Hari Ini <span class="text-slate-400 font-normal">(Opsional)</span>
        </label>
        <input
          v-model="noteInput"
          type="text"
          placeholder="Tulis catatan singkat pada tanggal ini..."
          class="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <BaseText size="xs" variant="muted">
        Perubahan akan langsung memperbarui warna kotak pada Kalender GitHub.
      </BaseText>

      <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <SecondaryButton type="button" @click="emit('close')">
          Batal
        </SecondaryButton>
        <PrimaryButton type="submit" :loading="isSaving">
          Simpan Log
        </PrimaryButton>
      </div>
    </form>
  </BottomSheet>
</template>
