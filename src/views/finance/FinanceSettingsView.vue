<script setup>
import { ref, computed } from 'vue'
import {
  Calendar,
  Plus,
  Trash,
  EditPencil,
  Globe,
  CheckCircle,
  Spark,
} from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import CategoryIconPickerModal from '@/components/modules/finance/CategoryIconPickerModal.vue'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { useFinanceStore } from '@/stores/financeStore'

const financeStore = useFinanceStore()

// State Kategori
const categoryTab = ref('all') // 'all', 'expense', 'income'
const showCategorySheet = ref(false)
const showIconPicker = ref(false)
const showDeleteCatSheet = ref(false)
const showEndPeriodSheet = ref(false)
const selectedCategoryForDelete = ref(null)
const editingCategory = ref(null)
const formError = ref('')

const categoryForm = ref({
  name: '',
  type: 'expense',
  icon: 'cutlery',
  color: '#144229',
})

const colorPresets = [
  '#144229',
  '#2d5a3f',
  '#0f766e',
  '#0284c7',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ba1a1a',
  '#ea580c',
  '#d97706',
  '#65a30d',
  '#373b3a',
]

const filteredCategories = computed(() => {
  if (categoryTab.value === 'all') return financeStore.categories
  return financeStore.categories.filter((c) => c.type === categoryTab.value)
})

function isUncategorized(cat) {
  return Boolean(cat.is_uncategorized) || (cat.name || '').toLowerCase() === 'uncategorized'
}

function openAddCategorySheet() {
  formError.value = ''
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    type: categoryTab.value === 'income' ? 'income' : 'expense',
    icon: 'cutlery',
    color: '#144229',
  }
  showCategorySheet.value = true
}

function openEditCategorySheet(cat) {
  formError.value = ''
  editingCategory.value = cat
  categoryForm.value = {
    name: cat.name,
    type: cat.type,
    icon: cat.icon || 'cutlery',
    color: cat.color || '#144229',
  }
  showCategorySheet.value = true
}

async function handleSaveCategory() {
  formError.value = ''
  if (!categoryForm.value.name.trim()) {
    formError.value = 'Nama kategori wajib diisi.'
    return
  }
  try {
    if (editingCategory.value) {
      await financeStore.editCategory(editingCategory.value.id, categoryForm.value)
    } else {
      await financeStore.saveCategory(categoryForm.value)
    }
    showCategorySheet.value = false
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan kategori.'
  }
}

function openDeleteCategorySheet(cat) {
  if (isUncategorized(cat)) return
  formError.value = ''
  selectedCategoryForDelete.value = cat
  showDeleteCatSheet.value = true
}

async function handleConfirmDeleteCategory() {
  if (!selectedCategoryForDelete.value) return
  formError.value = ''
  try {
    await financeStore.removeCategory(selectedCategoryForDelete.value.id)
    showDeleteCatSheet.value = false
    selectedCategoryForDelete.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menghapus kategori.'
  }
}

// State Pengaturan Periode & Desimal (Tersimpan Nyata ke Store & localStorage)
const cutoffDay = ref(financeStore.cutoffDay)
const showDecimals = ref(financeStore.showDecimals)
const saveStatusMessage = ref('')

const cutoffEndDay = computed(() => {
  const day = Math.max(1, Math.min(28, Number(cutoffDay.value) || 25))
  return day > 1 ? day - 1 : 28
})

function handleSavePreferences() {
  financeStore.savePreferences({
    cutoffDay: cutoffDay.value,
    showDecimals: showDecimals.value,
  })
  cutoffDay.value = financeStore.cutoffDay
  saveStatusMessage.value = 'Preferensi tanggal cut-off & format desimal berhasil disimpan!'
  setTimeout(() => {
    saveStatusMessage.value = ''
  }, 3000)
}

async function handleConfirmEndPeriod() {
  formError.value = ''
  try {
    financeStore.savePreferences({ cutoffDay: cutoffDay.value })
    await financeStore.endCurrentPeriod()
    showEndPeriodSheet.value = false
    saveStatusMessage.value = 'Periode sebelumnya telah ditutup dan periode baru sudah aktif!'
    setTimeout(() => {
      saveStatusMessage.value = ''
    }, 3500)
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal mengakhiri periode.'
  }
}
</script>

<template>
  <div class="space-y-4 md:space-y-5">
    <!-- Header Halaman -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading as="h2" size="xl" weight="semibold">Pengaturan Keuangan</BaseHeading>
        <BaseText size="sm" variant="muted" class="mt-0.5">
          Atur siklus tanggal periode pembukuan, kelola kategori transaksi, dan format tampilan angka.
        </BaseText>
      </div>
    </div>

    <!-- Feedback Toast -->
    <div
      v-if="saveStatusMessage"
      class="p-3.5 rounded-2xl bg-[#d3e4d8]/50 dark:bg-[#144229]/50 border border-[#d3e4d8] dark:border-[#2d5a3f] text-xs font-bold text-[#144229] dark:text-[#a1d2af] flex items-center gap-2"
    >
      <CheckCircle class="w-4 h-4 shrink-0" />
      <span>{{ saveStatusMessage }}</span>
    </div>

    <!-- KARTU 1: PENGATURAN PERIODE & SIKLUS PEMBUKUAN -->
    <BaseCard padding="p-4 sm:p-5" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e2e2e5] dark:border-zinc-800">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-[#d3e4d8]/50 dark:bg-[#144229]/50 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center shrink-0">
            <Calendar class="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Siklus Periode Pembukuan</h3>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              Siklus aktif setiap tanggal {{ financeStore.cutoffDay }} s/d tanggal {{ cutoffEndDay }} bulan berikutnya
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="showEndPeriodSheet = true"
          class="h-8 px-3.5 rounded-full bg-rose-50 hover:bg-rose-100 text-[#ba1a1a] dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/50 text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          Akhiri Periode Aktif
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Info Periode Aktif -->
        <div class="p-3.5 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/40 border border-[#e2e2e5] dark:border-zinc-800 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500 dark:text-zinc-400">Periode Terpilih:</span>
            <BaseBadge v-if="financeStore.activePeriod?.is_active" variant="emerald" size="xs">Aktif</BaseBadge>
            <BaseBadge v-else variant="neutral" size="xs">Arsip</BaseBadge>
          </div>
          <p class="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
            {{ financeStore.activePeriod?.name || 'Periode Finansial Aktif' }}
          </p>
          <p class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
            {{ financeStore.activePeriod?.start_date || '-' }} s/d {{ financeStore.activePeriod?.end_date || '-' }}
          </p>
        </div>

        <!-- Setting Cut-off Day -->
        <div class="p-3.5 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/40 border border-[#e2e2e5] dark:border-zinc-800 space-y-2">
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300">
            Tanggal Cut-off Rutin Bulanan (1 - 28)
          </label>
          <div class="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="28"
              v-model.number="cutoffDay"
              @change="handleSavePreferences"
              class="w-20 h-9 px-3 rounded-xl border border-[#e2e2e5] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-extrabold text-center tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
            />
            <span class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Mulai tanggal <strong class="text-slate-800 dark:text-zinc-200">{{ cutoffDay }}</strong> s/d tanggal <strong class="text-slate-800 dark:text-zinc-200">{{ cutoffEndDay }}</strong> bulan berikutnya.
            </span>
          </div>
        </div>
      </div>

      <!-- Riwayat Periode -->
      <div class="pt-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
          Riwayat Periode Terdaftar ({{ financeStore.periods.length }})
        </h4>
        <div class="divide-y divide-[#e2e2e5] dark:divide-zinc-800 text-xs max-h-52 overflow-y-auto pr-1">
          <div
            v-for="period in financeStore.periods"
            :key="period.id"
            class="py-2.5 flex items-center justify-between"
          >
            <div>
              <span class="font-bold text-slate-800 dark:text-zinc-200">{{ period.name }}</span>
              <span class="text-[11px] text-slate-400 dark:text-zinc-500 block tabular-nums">
                {{ period.start_date }} s/d {{ period.end_date }}
              </span>
            </div>
            <BaseBadge :variant="period.is_active ? 'emerald' : 'neutral'" size="xs">
              {{ period.is_active ? 'Sedang Berjalan' : 'Selesai' }}
            </BaseBadge>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- KARTU 2: KELOLA KATEGORI TRANSAKSI -->
    <BaseCard padding="p-4 sm:p-5" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e2e2e5] dark:border-zinc-800">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-[#d3e4d8]/50 dark:bg-[#144229]/50 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center shrink-0">
            <Spark class="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Kategori Transaksi</h3>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              Kelola ikon, warna, dan daftar kategori pemasukan maupun pengeluaran
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="openAddCategorySheet"
          class="h-8 px-3.5 rounded-full bg-[#144229] hover:bg-[#1f5637] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
        >
          <Plus class="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      <!-- Tab Filter Tipe Kategori (Pill Style) -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          @click="categoryTab = 'all'"
          class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
          :class="
            categoryTab === 'all'
              ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
              : 'bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
          "
        >
          Semua ({{ financeStore.categories.length }})
        </button>
        <button
          type="button"
          @click="categoryTab = 'expense'"
          class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
          :class="
            categoryTab === 'expense'
              ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
              : 'bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
          "
        >
          Pengeluaran ({{ financeStore.expenseCategories.length }})
        </button>
        <button
          type="button"
          @click="categoryTab = 'income'"
          class="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
          :class="
            categoryTab === 'income'
              ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
              : 'bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
          "
        >
          Pemasukan ({{ financeStore.incomeCategories.length }})
        </button>
      </div>

      <!-- Grid Kategori -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div
          v-for="cat in filteredCategories"
          :key="cat.id"
          class="p-3 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/40 border border-[#e2e2e5] dark:border-zinc-800 flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs shadow-2xs"
              :style="{ backgroundColor: cat.color || '#144229' }"
            >
              <component :is="getCategoryIcon(cat.icon)" class="w-4 h-4 stroke-[2]" />
            </div>
            <div class="min-w-0">
              <span class="text-xs font-bold text-slate-800 dark:text-zinc-200 block truncate">
                {{ cat.name }}
              </span>
              <span class="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold">
                {{ cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran' }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              @click="openEditCategorySheet(cat)"
              aria-label="Edit Kategori"
              title="Edit Kategori"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <EditPencil class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="!isUncategorized(cat)"
              type="button"
              @click="openDeleteCategorySheet(cat)"
              aria-label="Hapus Kategori"
              title="Hapus Kategori"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#ba1a1a] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- KARTU 3: PREFERENSI MATA UANG & TAMPILAN DESIMAL -->
    <BaseCard padding="p-4 sm:p-5" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e2e2e5] dark:border-zinc-800">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-[#d3e4d8]/50 dark:bg-[#144229]/50 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center shrink-0">
            <Globe class="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Format Nominal & Desimal (IDR)</h3>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              Diterapkan secara seragam di seluruh kartu saldo, dompet, dan riwayat transaksi
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="handleSavePreferences"
          class="h-8 px-4 rounded-full bg-[#144229] hover:bg-[#1f5637] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
        >
          Simpan Preferensi
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-3.5 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/40 border border-[#e2e2e5] dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span class="font-bold text-slate-800 dark:text-zinc-200 block">Mata Uang Standar</span>
            <span class="text-[11px] text-slate-400 dark:text-zinc-500">Rupiah Indonesia (IDR · Rp)</span>
          </div>
          <BaseBadge variant="emerald" size="xs">Aktif · IDR</BaseBadge>
        </div>

        <!-- Format Desimal -->
        <div class="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            @click="showDecimals = false; handleSavePreferences()"
            class="p-3 rounded-2xl border text-left cursor-pointer transition-all"
            :class="
              !showDecimals
                ? 'border-[#144229] bg-[#d3e4d8]/35 dark:border-[#a1d2af] dark:bg-[#144229]/40 font-bold text-slate-900 dark:text-zinc-100'
                : 'border-[#e2e2e5] dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
            "
          >
            <span class="block">Bulat (Tanpa Sen)</span>
            <span class="text-[11px] text-slate-400 tabular-nums">Rp 1.500.000</span>
          </button>
          <button
            type="button"
            @click="showDecimals = true; handleSavePreferences()"
            class="p-3 rounded-2xl border text-left cursor-pointer transition-all"
            :class="
              showDecimals
                ? 'border-[#144229] bg-[#d3e4d8]/35 dark:border-[#a1d2af] dark:bg-[#144229]/40 font-bold text-slate-900 dark:text-zinc-100'
                : 'border-[#e2e2e5] dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
            "
          >
            <span class="block">Dengan Sen (,00)</span>
            <span class="text-[11px] text-slate-400 tabular-nums">Rp 1.500.000,00</span>
          </button>
        </div>
      </div>
    </BaseCard>

    <!-- BottomSheet: Tambah / Edit Kategori -->
    <BottomSheet
      :show="showCategorySheet"
      :title="editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'"
      @close="showCategorySheet = false"
    >
      <form @submit.prevent="handleSaveCategory" class="space-y-3.5 text-xs">
        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Nama Kategori
          </label>
          <input
            type="text"
            v-model="categoryForm.name"
            :disabled="editingCategory && isUncategorized(editingCategory)"
            required
            placeholder="Contoh: Belanja, Hiburan, Gaji..."
            class="w-full p-2.5 rounded-xl border border-[#e2e2e5] dark:border-zinc-700 bg-[#f9f9fc] dark:bg-zinc-800 font-semibold text-slate-900 dark:text-zinc-100 outline-none disabled:opacity-60"
          />
        </div>

        <!-- Pilihan Ikon Kategori -->
        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Ikon Kategori
          </label>
          <button
            type="button"
            @click="showIconPicker = true"
            class="w-full h-11 px-3 rounded-xl border border-[#e2e2e5] dark:border-zinc-700 bg-[#f9f9fc] dark:bg-zinc-800 flex items-center justify-between text-xs cursor-pointer hover:border-[#144229]/50 transition-colors"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                :style="{ backgroundColor: categoryForm.color || '#144229' }"
              >
                <component :is="getCategoryIcon(categoryForm.icon)" class="w-4 h-4 stroke-[2]" />
              </div>
              <span class="font-bold text-slate-800 dark:text-zinc-200 capitalize">
                {{ categoryForm.icon || 'Pilih Ikon...' }}
              </span>
            </div>
            <span class="text-xs font-bold text-[#144229] dark:text-[#a1d2af]">Pilih Ikon →</span>
          </button>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Jenis Transaksi
          </label>
          <div class="flex items-center gap-1 p-1 rounded-full bg-[#f3f3f6] dark:bg-zinc-800">
            <button
              type="button"
              @click="categoryForm.type = 'expense'"
              class="flex-1 py-1.5 rounded-full font-bold transition-all cursor-pointer"
              :class="
                categoryForm.type === 'expense'
                  ? 'bg-[#ba1a1a] text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              "
            >
              Pengeluaran
            </button>
            <button
              type="button"
              @click="categoryForm.type = 'income'"
              class="flex-1 py-1.5 rounded-full font-bold transition-all cursor-pointer"
              :class="
                categoryForm.type === 'income'
                  ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              "
            >
              Pemasukan
            </button>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Warna Aksen Kategori
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in colorPresets"
              :key="color"
              type="button"
              @click="categoryForm.color = color"
              class="w-7 h-7 rounded-full border-2 transition-transform cursor-pointer"
              :class="
                categoryForm.color === color
                  ? 'border-slate-900 dark:border-white scale-110 shadow-xs'
                  : 'border-transparent'
              "
              :style="{ backgroundColor: color }"
            />
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            @click="showCategorySheet = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="financeStore.isSaving"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Menyimpan...' : 'Simpan Kategori' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Konfirmasi Hapus Kategori -->
    <BottomSheet
      :show="showDeleteCatSheet"
      title="Hapus Kategori?"
      @close="showDeleteCatSheet = false"
    >
      <div class="space-y-4 text-xs">
        <p class="text-slate-600 dark:text-zinc-400 leading-relaxed">
          Kategori <strong class="text-slate-900 dark:text-zinc-100">{{ selectedCategoryForDelete?.name }}</strong> akan dihapus. Transaksi lama yang menggunakan kategori ini akan otomatis dialihkan ke <strong class="text-slate-900 dark:text-zinc-100">Uncategorized</strong>.
        </p>

        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="showDeleteCatSheet = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="financeStore.isSaving"
            @click="handleConfirmDeleteCategory"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#ba1a1a] text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </BottomSheet>

    <!-- BottomSheet: Konfirmasi Akhiri Periode -->
    <BottomSheet
      :show="showEndPeriodSheet"
      title="Akhiri Periode Aktif?"
      @close="showEndPeriodSheet = false"
    >
      <div class="space-y-4 text-xs">
        <p class="text-slate-600 dark:text-zinc-400 leading-relaxed">
          Periode <strong class="text-slate-900 dark:text-zinc-100">{{ financeStore.activePeriod?.name }}</strong> akan ditutup per hari ini, dan periode baru akan otomatis dibuat hingga tanggal cut-off berikutnya (tanggal <strong class="text-slate-900 dark:text-zinc-100">{{ cutoffEndDay }}</strong>).
        </p>

        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="showEndPeriodSheet = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="financeStore.isLoading"
            @click="handleConfirmEndPeriod"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isLoading ? 'Memproses...' : 'Ya, Akhiri Periode' }}
          </button>
        </div>
      </div>
    </BottomSheet>

    <!-- Modal Picker Bunch of Icons -->
    <CategoryIconPickerModal
      v-model="categoryForm.icon"
      :show="showIconPicker"
      @close="showIconPicker = false"
    />
  </div>
</template>
