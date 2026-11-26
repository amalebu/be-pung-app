<script setup>
import { ref, computed } from 'vue'
import { Calendar, NavArrowDown, Check, Clock } from '@iconoir/vue'
import { useFinanceStore } from '@/stores/financeStore'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const financeStore = useFinanceStore()
const isDropdownOpen = ref(false)
const isConfirmEndOpen = ref(false)
const endError = ref('')

function formatReadableDate(dateStr, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!dateStr) return '-'
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', options)
}

const cycleMetrics = computed(() => {
  const period = financeStore.activePeriod
  if (!period?.start_date || !period?.end_date) {
    return {
      rangeText: '',
      elapsedDays: 0,
      totalDays: 30,
      remainingDays: 0,
      progressPercent: 0,
    }
  }

  const start = new Date(`${String(period.start_date).slice(0, 10)}T00:00:00`)
  const end = new Date(`${String(period.end_date).slice(0, 10)}T00:00:00`)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const msPerDay = 1000 * 60 * 60 * 24
  const totalDays = Math.max(1, Math.round((end - start) / msPerDay) + 1)
  const rawElapsed = Math.round((today - start) / msPerDay) + 1
  const elapsedDays = Math.min(totalDays, Math.max(1, rawElapsed))
  const remainingDays = Math.max(0, Math.round((end - today) / msPerDay))
  const progressPercent = Math.min(100, Math.max(4, Math.round((elapsedDays / totalDays) * 100)))

  const rangeText = `${formatReadableDate(period.start_date, { day: 'numeric', month: 'short' })} – ${formatReadableDate(period.end_date, { day: 'numeric', month: 'short', year: 'numeric' })}`

  return {
    rangeText,
    elapsedDays,
    totalDays,
    remainingDays,
    progressPercent,
  }
})

function choosePeriod(period) {
  financeStore.selectPeriod(period)
  isDropdownOpen.value = false
}

function openEndConfirm() {
  endError.value = ''
  isConfirmEndOpen.value = true
}

async function handleEndPeriod() {
  endError.value = ''
  try {
    await financeStore.endCurrentPeriod()
    isConfirmEndOpen.value = false
  } catch (err) {
    endError.value = err.response?.data?.message || 'Gagal mengakhiri periode saat ini.'
  }
}
</script>

<template>
  <div class="relative w-full">
    <div
      class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface"
    >
      <!-- Kiri: Pemilih Siklus Periode -->
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="w-9 h-9 rounded-xl bg-[#d3e4d8]/55 dark:bg-[#144229]/50 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center shrink-0"
        >
          <Calendar class="w-4 h-4 stroke-[2.2]" />
        </div>

        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="isDropdownOpen = !isDropdownOpen"
              class="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-zinc-100 hover:text-[#144229] dark:hover:text-[#a1d2af] transition-colors cursor-pointer select-none truncate"
            >
              <span class="truncate">{{ financeStore.activePeriod?.name || 'Memuat periode...' }}</span>
              <NavArrowDown
                class="w-3.5 h-3.5 text-slate-400 transition-transform shrink-0"
                :class="{ 'rotate-180': isDropdownOpen }"
              />
            </button>

            <BaseBadge v-if="financeStore.activePeriod?.is_active" variant="emerald" size="xs" class="shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block" />
              Aktif
            </BaseBadge>
            <BaseBadge v-else-if="financeStore.activePeriod" variant="neutral" size="xs" class="shrink-0">
              Arsip
            </BaseBadge>
          </div>

          <p class="text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums truncate">
            {{ cycleMetrics.rangeText }} · Cut-off tgl {{ financeStore.cutoffDay }}
          </p>
        </div>
      </div>

      <!-- Kanan: Progress Hari Siklus & Tombol Tutup Siklus -->
      <div class="flex items-center gap-3 ml-auto">
        <div
          v-if="financeStore.activePeriod"
          class="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#f3f3f6] dark:bg-zinc-800/80 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 tabular-nums"
        >
          <Clock class="w-3.5 h-3.5 text-[#144229] dark:text-[#a1d2af]" />
          <span>Hari {{ cycleMetrics.elapsedDays }}/{{ cycleMetrics.totalDays }}</span>
          <div class="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
            <div
              class="h-full rounded-full bg-[#144229] dark:bg-[#a1d2af]"
              :style="{ width: `${cycleMetrics.progressPercent}%` }"
            />
          </div>
        </div>

        <button
          v-if="financeStore.activePeriod?.is_active"
          type="button"
          @click="openEndConfirm"
          class="h-8 px-3.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 hover:bg-[#d3e4d8]/55 hover:text-[#144229] dark:hover:bg-zinc-700 dark:hover:text-[#a1d2af] text-slate-700 dark:text-zinc-300 transition-all cursor-pointer shrink-0"
        >
          Akhiri Periode
        </button>
      </div>
    </div>

    <!-- Backdrop transparan -->
    <div
      v-if="isDropdownOpen"
      class="fixed inset-0 z-20"
      @click="isDropdownOpen = false"
    />

    <!-- Dropdown Popover Daftar Periode -->
    <div
      v-if="isDropdownOpen"
      class="absolute left-0 top-full mt-2 w-80 max-w-[92vw] bg-white dark:bg-zinc-900 rounded-3xl border border-[#e2e2e5] dark:border-zinc-800 shadow-floating z-30 p-2.5 space-y-1"
    >
      <div class="px-3 py-1.5 flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Pilih Siklus Periode
        </span>
        <span class="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 tabular-nums">
          {{ financeStore.periods.length }} Siklus
        </span>
      </div>
      <div class="max-h-60 overflow-y-auto space-y-1">
        <button
          v-for="p in financeStore.periods"
          :key="p.id"
          type="button"
          @click="choosePeriod(p)"
          class="w-full text-left px-3 py-2 rounded-2xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          :class="
            financeStore.activePeriod?.id === p.id
              ? 'bg-[#d3e4d8]/50 dark:bg-[#144229]/45 text-[#144229] dark:text-[#a1d2af] font-bold'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-[#f3f3f6] dark:hover:bg-zinc-800/60'
          "
        >
          <div class="min-w-0 pr-2">
            <span class="block text-slate-900 dark:text-zinc-100 truncate">{{ p.name }}</span>
            <span class="text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums">
              {{ formatReadableDate(p.start_date) }} – {{ formatReadableDate(p.end_date) }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <BaseBadge v-if="p.is_active" variant="emerald" size="xs">Aktif</BaseBadge>
            <Check
              v-if="financeStore.activePeriod?.id === p.id"
              class="w-4 h-4 text-[#144229] dark:text-[#a1d2af] stroke-[2.5]"
            />
          </div>
        </button>
      </div>
    </div>

    <!-- BottomSheet Konfirmasi Akhiri Periode -->
    <BottomSheet
      :show="isConfirmEndOpen"
      title="Akhiri Periode Sekarang?"
      @close="isConfirmEndOpen = false"
    >
      <div class="space-y-4">
        <p class="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
          Periode <strong class="text-slate-900 dark:text-zinc-100">{{ financeStore.activePeriod?.name }}</strong> akan ditutup per hari ini, dan siklus periode baru akan otomatis dimulai dengan batas cut-off tanggal <strong class="text-slate-900 dark:text-zinc-100">{{ financeStore.cutoffDay }}</strong>. Seluruh riwayat transaksi tetap tersimpan aman.
        </p>

        <div
          v-if="endError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ endError }}
        </div>

        <div class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="isConfirmEndOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="financeStore.isLoading"
            @click="handleEndPeriod"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {{ financeStore.isLoading ? 'Memproses...' : 'Ya, Akhiri Periode' }}
          </button>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
