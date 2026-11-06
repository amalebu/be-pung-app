<script setup>
import { ref, watch, computed } from 'vue'
import { Spark, ShieldAlert, Droplet, Gym, OpenBook, CoffeeCup, Prohibition, HalfMoon, FireFlame, Heart } from '@iconoir/vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  editingHabit: {
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

const name = ref('')
const description = ref('')
const type = ref('good') // good | bad
const icon = ref('droplets')
const unit = ref('Liter')
const targetValue = ref(2)
const stepValue = ref(0.5)

const isEditMode = computed(() => Boolean(props.editingHabit?.id))

const starterTemplates = {
  good: [
    {
      name: 'Minum Air Putih 2 Liter',
      description: 'Hidrasi tubuh minimal 2 liter sehari',
      icon: 'droplets',
      unit: 'Liter',
      target_value: 2,
      step_value: 0.5,
    },
    {
      name: 'Olahraga / Jalan Pagi',
      description: 'Aktivitas fisik rutin setiap hari',
      icon: 'dumbbell',
      unit: 'Menit',
      target_value: 30,
      step_value: 10,
    },
    {
      name: 'Baca Buku',
      description: 'Membaca buku pengembangan diri',
      icon: 'book',
      unit: 'Halaman',
      target_value: 15,
      step_value: 5,
    },
  ],
  bad: [
    {
      name: 'Batasi Minuman Manis / Boba',
      description: 'Putih = 0 gelas, Agak Merah = 1 gelas, Merah = > 1 gelas',
      icon: 'coffee',
      unit: 'Gelas',
      target_value: 1,
      step_value: 1,
    },
    {
      name: 'Stop Merokok / Vape',
      description: 'Target bersih 0 batang setiap hari',
      icon: 'ban',
      unit: 'Batang',
      target_value: 0,
      step_value: 1,
    },
    {
      name: 'Stop Begadang Lewat Tengah Malam',
      description: 'Tidur tepat waktu sebelum jam 23:00',
      icon: 'moon',
      unit: 'kali',
      target_value: 0,
      step_value: 1,
    },
  ],
}

const iconOptions = [
  { id: 'droplets', label: 'Air', comp: Droplet },
  { id: 'dumbbell', label: 'Olahraga', comp: Gym },
  { id: 'book', label: 'Buku', comp: OpenBook },
  { id: 'coffee', label: 'Kopi/Boba', comp: CoffeeCup },
  { id: 'ban', label: 'Stop', comp: Prohibition },
  { id: 'moon', label: 'Tidur', comp: HalfMoon },
  { id: 'flame', label: 'Semangat', comp: FireFlame },
  { id: 'heart', label: 'Kesehatan', comp: Heart },
]

function applyTemplate(tpl) {
  name.value = tpl.name
  description.value = tpl.description
  icon.value = tpl.icon
  unit.value = tpl.unit
  targetValue.value = tpl.target_value
  stepValue.value = tpl.step_value
}

function selectType(newType) {
  type.value = newType
  if (!isEditMode.value) {
    if (newType === 'good') {
      icon.value = 'droplets'
      unit.value = 'Liter'
      targetValue.value = 2
      stepValue.value = 0.5
    } else {
      icon.value = 'ban'
      unit.value = 'Gelas'
      targetValue.value = 1
      stepValue.value = 1
    }
  }
}

watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) return
    if (props.editingHabit?.id) {
      name.value = props.editingHabit.name || ''
      description.value = props.editingHabit.description || ''
      type.value = props.editingHabit.type || 'good'
      icon.value = props.editingHabit.icon || 'droplets'
      unit.value = props.editingHabit.unit || 'kali'
      targetValue.value = Number(props.editingHabit.target_value ?? 1)
      stepValue.value = Number(props.editingHabit.step_value ?? 1)
    } else {
      const initialType = props.editingHabit?.type || 'good'
      name.value = ''
      description.value = ''
      selectType(initialType)
    }
  },
  { immediate: true }
)

function handleSubmit() {
  if (!name.value.trim()) return

  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim() || null,
    type: type.value,
    icon: icon.value,
    unit: unit.value.trim() || 'kali',
    target_value: Math.max(0, Number(targetValue.value || 0)),
    step_value: Math.max(0.01, Number(stepValue.value || 1)),
  })
}
</script>

<template>
  <BottomSheet
    :show="show"
    :title="isEditMode ? 'Edit Habit' : 'Buat Habit Baru'"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <BaseAlert v-if="errorMessage" variant="danger">
        {{ errorMessage }}
      </BaseAlert>

      <!-- Pilih Tipe Habit: Good Habit vs Remove Bad Habit -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
          Pilih Tipe Habit
        </label>
        <div class="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            @click="selectType('good')"
            class="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer"
            :class="
              type === 'good'
                ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
            "
          >
            <Spark class="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p class="text-xs font-bold">New Good Habit</p>
              <p class="text-[10px] opacity-80">Kalender Hijau Bertingkat</p>
            </div>
          </button>

          <button
            type="button"
            @click="selectType('bad')"
            class="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer"
            :class="
              type === 'bad'
                ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 ring-2 ring-rose-500/20'
                : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
            "
          >
            <ShieldAlert class="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <p class="text-xs font-bold">Remove Bad Habit</p>
              <p class="text-[10px] opacity-80">Putih Bersih • Merah Gagal</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Quick Starter Templates (Saat tambah baru) -->
      <div v-if="!isEditMode" class="space-y-1.5">
        <BaseText size="xs" variant="muted">
          Template Cepat (Ketuk untuk isi otomatis):
        </BaseText>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="tpl in starterTemplates[type]"
            :key="tpl.name"
            type="button"
            @click="applyTemplate(tpl)"
            class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            + {{ tpl.name }}
          </button>
        </div>
      </div>

      <!-- Nama Habit -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
          Nama Kebiasaan <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="name"
          type="text"
          required
          :placeholder="type === 'good' ? 'Contoh: Minum Air Putih 2 Liter' : 'Contoh: Kurangi Kopi Manis / Stop Merokok'"
          class="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <!-- Catatan / Motivasi -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
          Catatan / Alasan <span class="text-slate-400 font-normal">(Opsional)</span>
        </label>
        <input
          v-model="description"
          type="text"
          placeholder="Motivasi singkat..."
          class="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <!-- Pilih Ikon -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
          Pilih Ikon
        </label>
        <div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          <button
            v-for="item in iconOptions"
            :key="item.id"
            type="button"
            @click="icon = item.id"
            class="flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px] font-medium transition-all cursor-pointer"
            :class="
              icon === item.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                : 'border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800'
            "
          >
            <component :is="item.comp" class="w-4 h-4 mb-0.5" />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </div>

      <!-- Target / Batas Maksimal, Takaran Step, & Satuan -->
      <div class="grid grid-cols-3 gap-2.5 pt-1">
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            {{ type === 'good' ? 'Target Penuh' : 'Batas Maksimal' }}
          </label>
          <input
            v-model.number="targetValue"
            type="number"
            step="any"
            min="0"
            required
            class="w-full px-3 py-2 rounded-xl text-sm tabular-nums bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            Takaran Klik (+/-)
          </label>
          <input
            v-model.number="stepValue"
            type="number"
            step="any"
            min="0.01"
            required
            class="w-full px-3 py-2 rounded-xl text-sm tabular-nums bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            Satuan
          </label>
          <input
            v-model="unit"
            type="text"
            required
            placeholder="Liter / Gelas / kali"
            class="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <BaseText size="xs" variant="muted">
        <template v-if="type === 'good'">
          Kotak kalender akan berwarna <strong>Hijau Muda</strong> saat progres sebagian, dan <strong>Hijau Pekat</strong> saat mencapai $\ge$ {{ targetValue }} {{ unit }}.
        </template>
        <template v-else>
          Kotak kalender berwarna <strong>Putih Bersih</strong> jika 0 {{ unit }}, <strong>Agak Merah</strong> jika tergoda sedikit ($\le$ {{ targetValue || stepValue }} {{ unit }}), dan <strong>Merah Pekat</strong> jika melewati batas.
        </template>
      </BaseText>

      <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <SecondaryButton type="button" @click="emit('close')">
          Batal
        </SecondaryButton>
        <PrimaryButton type="submit" :loading="saving">
          {{ isEditMode ? 'Simpan Perubahan' : 'Buat Habit' }}
        </PrimaryButton>
      </div>
    </form>
  </BottomSheet>
</template>
