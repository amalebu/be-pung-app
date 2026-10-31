<script setup>
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckSquare,
  Sparkles,
  PenLine,
} from 'lucide-vue-next'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'select'])

const actions = [
  {
    id: 'expense',
    title: 'Catat Pengeluaran',
    desc: 'Catat belanja, tagihan, atau kebutuhan harian',
    icon: ArrowDownRight,
    colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
  },
  {
    id: 'income',
    title: 'Catat Pemasukan',
    desc: 'Catat gaji, freelance, atau pemasukan lainnya',
    icon: ArrowUpRight,
    colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
  },
  {
    id: 'todo',
    title: 'Tambah Tugas Baru',
    desc: 'Catat to-do list harian dengan prioritas',
    icon: CheckSquare,
    colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
  },
  {
    id: 'habit',
    title: 'Ceklis Habit Hari Ini',
    desc: 'Tandai progres rutinitas dan bangun streak',
    icon: Sparkles,
    colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  },
  {
    id: 'journal',
    title: 'Tulis Jurnal Harian',
    desc: 'Refleksi hari ini, catatan ide, atau mood log',
    icon: PenLine,
    colorClass: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
  },
]

function handleSelect(action) {
  emit('select', action)
  emit('close')
}
</script>

<template>
  <BottomSheet :show="show" title="Aksi Cepat" @close="emit('close')">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <button
        v-for="item in actions"
        :key="item.id"
        type="button"
        @click="handleSelect(item)"
        class="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-800 bg-white dark:bg-zinc-900/60 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-left transition-all duration-150 cursor-pointer group active:scale-[0.98]"
      >
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          :class="item.colorClass"
        >
          <component :is="item.icon" class="w-5 h-5 stroke-[2.2]" />
        </div>

        <div class="flex-1 min-w-0">
          <BaseHeading as="h4" size="sm" weight="medium" class="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {{ item.title }}
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-0.5 line-clamp-2">
            {{ item.desc }}
          </BaseText>
        </div>
      </button>
    </div>
  </BottomSheet>
</template>
