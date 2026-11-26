<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { StatsReport } from '@iconoir/vue'
import { useFinanceStore } from '@/stores/financeStore'
import { useHabitStore, getTodayDateStr } from '@/stores/habitStore'
import { formatDateJakarta } from '@/utils/dateUtils'
import { formatCompactRupiah } from '@/utils/currencyUtils'
import BottomSheet from '@/components/ui/BottomSheet.vue'

const financeStore = useFinanceStore()
const habitStore = useHabitStore()

const STORAGE_LIMIT_KEY = 'finance_daily_budget_limit'
const STORAGE_HABIT_ID_KEY = 'finance_daily_budget_habit_id'

// Default budget harian: Rp 100.000
const dailyLimit = ref(Number(localStorage.getItem(STORAGE_LIMIT_KEY) || 100000))
const syncedHabitId = ref(Number(localStorage.getItem(STORAGE_HABIT_ID_KEY) || 0) || null)

const isSettingsOpen = ref(false)
const draftLimit = ref(dailyLimit.value)
const isSyncing = ref(false)

/**
 * Cek apakah transaksi pengeluaran termasuk kategori Makan, Jajan, atau Transportasi
 */
function isDailyTrackedExpense(tx) {
  if (!tx || tx.type !== 'expense' || tx.is_transfer_fee) return false

  const catName = String(tx.category?.name || '').toLowerCase()
  const catIcon = String(tx.category?.icon || '').toLowerCase()
  const title = String(tx.title || '').toLowerCase()
  const desc = String(tx.description || '').toLowerCase()
  const combined = `${catName} ${title} ${desc}`

  const trackedIcons = [
    'food',
    'cutlery',
    'pizza',
    'fish',
    'apple',
    'coffee',
    'transport',
    'car',
    'motorcycle',
    'bus',
    'train',
  ]
  if (trackedIcons.includes(catIcon)) return true

  const trackedRegex =
    /makan|minum|sarapan|lunch|dinner|kuliner|resto|warung|warteg|padang|nasi|ayam|mie|bakso|soto|sate|geprek|gofood|grabfood|shopeefood|food|jajan|camilan|cemilan|snack|kopi|coffee|teh|boba|cafe|kafe|ngopi|dessert|eskrim|roti|kue|martabak|seblak|gorengan|transport|bensin|bbm|pertamina|ojek|taksi|gojek|goride|gocar|grab|maxim|parkir|tol|kereta|krl|mrt|lrt|bus/i

  return trackedRegex.test(combined)
}

const allAvailableTransactions = computed(() => {
  const map = new Map()
  for (const tx of financeStore.recentTransactions || []) {
    if (tx?.id) map.set(tx.id, tx)
  }
  for (const tx of financeStore.transactions || []) {
    if (tx?.id) map.set(tx.id, tx)
  }
  return Array.from(map.values())
})

const days = computed(() => {
  const limit = Math.max(1000, Number(dailyLimit.value || 100000))
  const spendByDate = new Map()
  const countByDate = new Map()

  for (const tx of allAvailableTransactions.value) {
    if (!isDailyTrackedExpense(tx)) continue
    const dateKey = String(tx.transaction_date || '').slice(0, 10)
    if (!dateKey) continue
    spendByDate.set(dateKey, (spendByDate.get(dateKey) || 0) + Math.abs(Number(tx.amount || 0)))
    countByDate.set(dateKey, (countByDate.get(dateKey) || 0) + 1)
  }

  const result = []
  for (let offset = -6; offset <= 0; offset++) {
    const dateStr = getTodayDateStr(offset)
    const dateObj = new Date()
    dateObj.setDate(dateObj.getDate() + offset)

    const spent = Math.round(spendByDate.get(dateStr) || 0)
    const txCount = countByDate.get(dateStr) || 0
    const hasTx = txCount > 0 && spent > 0
    const isOver = hasTx && spent > limit
    const isSafe = hasTx && spent <= limit

    // Tinggi & warna kapsul bar:
    // 1. Tidak ada transaksi tercatat (!hasTx) -> Putih bersih (height 0%)
    // 2. Pengeluaran di bawah / maksimal 100rb (isSafe) -> Naik warna Hijau (28%..88%)
    // 3. Pengeluaran di atas 100rb (isOver) -> Warna Merah (92%..100%)
    let heightPercent = 0
    if (isSafe) {
      heightPercent = Math.max(28, Math.min(88, Math.round(22 + (spent / limit) * 66)))
    } else if (isOver) {
      const overRatio = Math.min(1, (spent - limit) / limit)
      heightPercent = Math.round(90 + overRatio * 10)
    }

    result.push({
      dateStr,
      label: formatDateJakarta(dateObj, { weekday: 'short' }).replace('.', ''),
      spent,
      hasTx,
      isSafe,
      isOver,
      heightPercent,
      isToday: offset === 0,
    })
  }
  return result
})

const safeDaysCount = computed(() => days.value.filter((d) => d.isSafe).length)

const weeklyAverage = computed(() => {
  if (!days.value.length) return 0
  return Math.round((safeDaysCount.value / days.value.length) * 100)
})

// Sinkronisasi otomatis ke Habit Tracker
async function syncHabitSilent() {
  if (isSyncing.value) return
  isSyncing.value = true
  try {
    if (!habitStore.allHabits.length) {
      await habitStore.fetchHabits()
    }
    const all = habitStore.allHabits || []
    let targetHabit =
      (syncedHabitId.value && all.find((h) => Number(h.id) === Number(syncedHabitId.value))) ||
      all.find((h) => String(h.name || '').toLowerCase().includes('budget harian')) ||
      null

    if (!targetHabit) {
      const res = await habitStore.createHabit({
        name: `Budget Harian ≤ ${formatCompactRupiah(dailyLimit.value)}`,
        description: 'Makan, Jajan & Transportasi di bawah batas budget harian',
        type: 'good',
        icon: 'flame',
        unit: 'hari',
        target_value: 1,
        step_value: 1,
      })
      targetHabit = res?.data?.id ? res.data : null
    }

    if (!targetHabit) return
    syncedHabitId.value = targetHabit.id
    localStorage.setItem(STORAGE_HABIT_ID_KEY, String(targetHabit.id))

    const existingMap = new Map()
    for (const l of targetHabit.logs || []) {
      if (l.logged_date) existingMap.set(l.logged_date, Number(l.value || 0))
    }

    for (const day of days.value) {
      // Tercapai (1) hanya jika ada transaksi tercatat dan pengeluaran <= 100rb
      const expected = day.isSafe ? 1 : 0
      if (existingMap.get(day.dateStr) !== expected) {
        const note = !day.hasTx
          ? 'Belum ada transaksi tercatat'
          : `${day.isOver ? 'Di atas' : 'Di bawah'} ${formatCompactRupiah(dailyLimit.value)}: ${formatCompactRupiah(day.spent)}`

        await habitStore.logProgress(targetHabit.id, {
          logged_date: day.dateStr,
          mode: 'set',
          value: expected,
          note,
          immediate: true,
        })
      }
    }
  } finally {
    isSyncing.value = false
  }
}

function openLimitModal() {
  draftLimit.value = dailyLimit.value
  isSettingsOpen.value = true
}

async function saveLimit() {
  const next = Math.max(10000, Number(draftLimit.value || 100000))
  dailyLimit.value = next
  localStorage.setItem(STORAGE_LIMIT_KEY, String(next))
  isSettingsOpen.value = false
  await syncHabitSilent()
}

watch(
  () => days.value.map((d) => `${d.dateStr}:${d.spent}:${d.hasTx}`).join('|'),
  () => {
    syncHabitSilent()
  }
)

onMounted(() => {
  syncHabitSilent()
})
</script>

<template>
  <section
    class="flex flex-col rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900 dark:text-zinc-100">Konsistensi 7 Hari</h3>
        <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Budget &le; {{ formatCompactRupiah(dailyLimit) }} (Makan, Jajan, Transport)
        </p>
      </div>
      <button
        type="button"
        @click="openLimitModal"
        class="w-9 h-9 rounded-full flex items-center justify-center bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-[#d3e4d8]/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
        title="Atur batas budget harian"
      >
        <StatsReport class="w-[18px] h-[18px]" />
      </button>
    </div>

    <div class="mt-4 flex items-baseline justify-between gap-2">
      <p class="text-3xl font-bold tabular-nums text-slate-900 dark:text-zinc-100 leading-none">
        {{ weeklyAverage }}<span class="text-base font-semibold text-slate-400 dark:text-zinc-500">%</span>
      </p>
      <span class="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 tabular-nums">
        {{ safeDaysCount }}/7 hari &le; {{ formatCompactRupiah(dailyLimit) }}
      </span>
    </div>

    <!-- 7 Capsule Bars: Putih (Kosong), Hijau (<= 100rb), Merah (> 100rb) -->
    <div class="mt-5 flex-1 flex items-end justify-between gap-2 sm:gap-2.5 min-h-[124px]">
      <div
        v-for="day in days"
        :key="day.dateStr"
        class="flex-1 flex flex-col items-center gap-2 h-full"
        :title="
          !day.hasTx
            ? `${day.label}: Tidak ada transaksi tercatat`
            : `${day.label}: ${financeStore.formatMoney(day.spent)} (${day.isOver ? 'Di atas ' : 'Di bawah '}${formatCompactRupiah(dailyLimit)})`
        "
      >
        <div
          class="relative w-full flex-1 flex items-end rounded-full overflow-hidden transition-colors"
          :class="
            !day.hasTx
              ? 'bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-700'
              : 'bg-[#f3f3f6] dark:bg-zinc-800/70'
          "
        >
          <div
            v-if="day.hasTx"
            class="w-full rounded-full transition-all duration-700 ease-out"
            :class="
              day.isOver
                ? day.isToday
                  ? 'bg-[#ba1a1a] dark:bg-rose-500'
                  : 'bg-rose-400 dark:bg-rose-500/80'
                : day.isToday
                  ? 'bg-[#144229] dark:bg-[#a1d2af]'
                  : 'bg-[#9fcfad] dark:bg-[#2d5a3f]'
            "
            :style="{ height: `${day.heightPercent}%` }"
          />
        </div>
        <span
          class="text-[11px] font-semibold capitalize"
          :class="
            day.isOver
              ? 'text-[#ba1a1a] dark:text-rose-400 font-bold'
              : day.isToday
                ? 'text-slate-900 dark:text-zinc-100 font-bold'
                : 'text-slate-400 dark:text-zinc-500'
          "
        >
          {{ day.label }}
        </span>
      </div>
    </div>

    <!-- Modal Ringkas Ubah Batas Budget Harian -->
    <BottomSheet
      :show="isSettingsOpen"
      title="Batas Budget Harian (Makan, Jajan, Transport)"
      @close="isSettingsOpen = false"
    >
      <form @submit.prevent="saveLimit" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Nominal Batas Harian (IDR)
          </label>
          <input
            v-model.number="draftLimit"
            type="number"
            min="10000"
            step="5000"
            required
            class="w-full p-3 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-base font-extrabold tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
          />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="preset in [50000, 75000, 100000, 150000, 200000]"
              :key="preset"
              type="button"
              @click="draftLimit = preset"
              class="px-3 py-1 rounded-full text-xs font-bold tabular-nums cursor-pointer"
              :class="
                Number(draftLimit) === preset
                  ? 'bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110]'
                  : 'bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
              "
            >
              {{ formatCompactRupiah(preset) }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="isSettingsOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] cursor-pointer"
          >
            Simpan
          </button>
        </div>
      </form>
    </BottomSheet>
  </section>
</template>
