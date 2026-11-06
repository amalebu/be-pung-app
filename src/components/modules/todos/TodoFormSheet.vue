<script setup>
import { ref, watch, computed } from 'vue'
import { TriangleFlag, Calendar, Clock, Plus, Trash, Check, Spark } from '@iconoir/vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { getJakartaTodayStr } from '@/utils/dateUtils'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  editingTodo: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'submit'])

const title = ref('')
const description = ref('')
const priority = ref('medium')
const dueDate = ref('')
const dueTime = ref('')
const items = ref([])
const newSubItemText = ref('')

const isEditMode = computed(() => Boolean(props.editingTodo?.id))

function getPresetDate(type) {
  if (type === 'today') {
    return getJakartaTodayStr(0)
  }
  if (type === 'tomorrow') {
    return getJakartaTodayStr(1)
  }
  if (type === 'weekend') {
    const todayStr = getJakartaTodayStr(0)
    const [y, m, d] = todayStr.split('-').map(Number)
    const now = new Date(y, m - 1, d)
    const day = now.getDay() // 0 Sun .. 6 Sat
    const daysUntilSaturday = day === 6 ? 7 : (6 - day)
    return getJakartaTodayStr(daysUntilSaturday)
  }
  return ''
}

function applyDatePreset(type) {
  if (type === 'none') {
    dueDate.value = ''
    dueTime.value = ''
    return
  }
  dueDate.value = getPresetDate(type)
}

watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) return
    if (props.editingTodo) {
      title.value = props.editingTodo.title || ''
      description.value = props.editingTodo.description || ''
      priority.value = props.editingTodo.priority || 'medium'
      dueDate.value = props.editingTodo.due_date || ''
      dueTime.value = props.editingTodo.due_time || ''
      items.value = Array.isArray(props.editingTodo.items)
        ? props.editingTodo.items.map((i) => ({
            id: i.id,
            title: i.title,
            is_completed: Boolean(i.is_completed),
          }))
        : []
    } else {
      title.value = ''
      description.value = ''
      priority.value = 'medium'
      dueDate.value = getPresetDate('today')
      dueTime.value = ''
      items.value = []
    }
    newSubItemText.value = ''
  },
  { immediate: true }
)

function addDraftSubtask() {
  const text = newSubItemText.value.trim()
  if (!text) return
  items.value.push({
    title: text,
    is_completed: false,
  })
  newSubItemText.value = ''
}

function removeDraftSubtask(index) {
  items.value.splice(index, 1)
}

function handleFormSubmit() {
  if (!title.value.trim()) return

  // If the user typed a subtask in the input box but didn't press '+' yet, include it automatically
  if (newSubItemText.value.trim()) {
    addDraftSubtask()
  }

  emit('submit', {
    title: title.value.trim(),
    description: description.value.trim() || null,
    priority: priority.value,
    due_date: dueDate.value || null,
    due_time: dueDate.value && dueTime.value ? dueTime.value : null,
    items: items.value
      .filter((i) => i.title && i.title.trim() !== '')
      .map((i) => ({
        title: i.title.trim(),
        is_completed: Boolean(i.is_completed),
      })),
  })
}

const priorityOptions = [
  {
    value: 'low',
    label: 'Rendah',
    activeClass: 'border-slate-500 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100',
    dotClass: 'bg-slate-400',
  },
  {
    value: 'medium',
    label: 'Sedang',
    activeClass: 'border-amber-500 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  {
    value: 'high',
    label: 'Tinggi',
    activeClass: 'border-rose-500 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300',
    dotClass: 'bg-rose-500',
  },
]
</script>

<template>
  <BottomSheet
    :show="show"
    :title="isEditMode ? 'Edit Tugas' : 'Tambah Tugas Baru'"
    @close="emit('close')"
  >
    <form @submit.prevent="handleFormSubmit" class="space-y-4">
      <BaseAlert v-if="errorMessage" variant="danger">
        {{ errorMessage }}
      </BaseAlert>

      <!-- Judul Tugas -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
          Judul Tugas <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="title"
          type="text"
          required
          placeholder="Contoh: Bayar tagihan listrik & internet"
          class="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
      </div>

      <!-- Catatan / Deskripsi Opsional -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
          Catatan Tambahan <span class="text-slate-400 font-normal">(Opsional)</span>
        </label>
        <textarea
          v-model="description"
          rows="2"
          placeholder="Tulis rincian atau link penting..."
          class="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
        />
      </div>

      <!-- Prioritas -->
      <div>
        <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
          <TriangleFlag class="w-3.5 h-3.5 text-indigo-500" />
          Prioritas Tugas
        </label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="opt in priorityOptions"
            :key="opt.value"
            type="button"
            @click="priority = opt.value"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer"
            :class="
              priority === opt.value
                ? opt.activeClass
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
            "
          >
            <span class="w-2 h-2 rounded-full" :class="opt.dotClass" />
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <!-- Deadline / Due Date + Time Opsional + Quick Presets -->
      <div class="space-y-2">
        <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          <Calendar class="w-3.5 h-3.5 text-indigo-500" />
          Deadline / Jatuh Tempo
        </label>

        <!-- Quick Date Presets -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            @click="applyDatePreset('today')"
            class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
            :class="
              dueDate === getPresetDate('today')
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-transparent hover:border-slate-300'
            "
          >
            Hari Ini
          </button>
          <button
            type="button"
            @click="applyDatePreset('tomorrow')"
            class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
            :class="
              dueDate === getPresetDate('tomorrow')
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-transparent hover:border-slate-300'
            "
          >
            Besok
          </button>
          <button
            type="button"
            @click="applyDatePreset('weekend')"
            class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
            :class="
              dueDate === getPresetDate('weekend')
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-transparent hover:border-slate-300'
            "
          >
            Akhir Pekan
          </button>
          <button
            v-if="dueDate"
            type="button"
            @click="applyDatePreset('none')"
            class="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:underline cursor-pointer"
          >
            Tanpa Tenggat
          </button>
        </div>

        <!-- Date & Optional Time Inputs -->
        <div class="grid grid-cols-2 gap-2.5 pt-0.5">
          <div>
            <BaseText size="xs" variant="muted" class="mb-1">Tanggal</BaseText>
            <input
              v-model="dueDate"
              type="date"
              class="w-full px-3 py-2 rounded-xl text-xs sm:text-sm tabular-nums bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <BaseText size="xs" variant="muted" class="mb-1 flex items-center gap-1">
              <Clock class="w-3 h-3" /> Jam (Opsional)
            </BaseText>
            <input
              v-model="dueTime"
              type="time"
              :disabled="!dueDate"
              class="w-full px-3 py-2 rounded-xl text-xs sm:text-sm tabular-nums bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 disabled:opacity-40 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <!-- Sub-Checklist Builder -->
      <div class="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
            <Spark class="w-3.5 h-3.5 text-indigo-500" />
            Sub-Checklist
          </label>
          <span class="text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
            {{ items.length }} item
          </span>
        </div>

        <!-- Existing Draft Items -->
        <div v-if="items.length > 0" class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          <div
            v-for="(sub, idx) in items"
            :key="idx"
            class="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 px-2.5 py-1.5 rounded-xl border border-slate-200/70 dark:border-zinc-700/60"
          >
            <button
              type="button"
              @click="sub.is_completed = !sub.is_completed"
              class="w-4 h-4 rounded-md flex items-center justify-center border transition-colors cursor-pointer shrink-0"
              :class="
                sub.is_completed
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
              "
            >
              <Check v-if="sub.is_completed" class="w-3 h-3 stroke-[3]" />
            </button>

            <input
              v-model="sub.title"
              type="text"
              class="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-zinc-100 focus:outline-none"
              :class="sub.is_completed ? 'line-through text-slate-400' : ''"
            />

            <button
              type="button"
              @click="removeDraftSubtask(idx)"
              class="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
            >
              <Trash class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Add New Sub-Checklist Input -->
        <div class="flex items-center gap-2">
          <input
            v-model="newSubItemText"
            type="text"
            placeholder="Ketik langkah sub-checklist lalu tekan +..."
            @keydown.enter.prevent="addDraftSubtask"
            class="flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            @click="addDraftSubtask"
            :disabled="!newSubItemText.trim()"
            class="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 disabled:opacity-40 cursor-pointer shrink-0 flex items-center gap-1"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>

        <BaseText size="xs" variant="muted">
          Tip: Tugas utama otomatis selesai saat semua sub-checklist dicentang.
        </BaseText>
      </div>

      <!-- Footer Submit Buttons -->
      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <SecondaryButton type="button" @click="emit('close')">
          Batal
        </SecondaryButton>
        <PrimaryButton type="submit" :loading="saving">
          {{ isEditMode ? 'Simpan Perubahan' : 'Buat Tugas' }}
        </PrimaryButton>
      </div>
    </form>
  </BottomSheet>
</template>
