<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Xmark,
  ArrowDownRight,
  ArrowUpRight,
  Shuffle,
  Calendar,
  Check,
} from '@iconoir/vue'
import { useFinanceStore } from '@/stores/financeStore'
import { getCategoryIcon } from '@/utils/categoryIcons'

const financeStore = useFinanceStore()

function getLocalDatetimeString(dateInput = null) {
  const d = dateInput ? new Date(String(dateInput).replace(' ', 'T')) : new Date()
  const valid = isNaN(d.getTime()) ? new Date() : d
  const offsetMs = valid.getTimezoneOffset() * 60000
  return new Date(valid.getTime() - offsetMs).toISOString().slice(0, 16)
}

const type = ref('expense') // 'expense' | 'income' | 'transfer'
const rawAmount = ref('0')
const selectedCategoryId = ref(null)
const selectedTags = ref([])
const title = ref('')
const description = ref('')
const walletId = ref(null)
const destinationWalletId = ref(null)
const feeTransfer = ref(0)
const transactionDate = ref(getLocalDatetimeString())
const showDatePicker = ref(false)
const showCalcBar = ref(false)
const localError = ref('')
const isSubmitting = ref(false)

const isEditing = computed(() => Boolean(financeStore.editingTransaction?.id))

onMounted(async () => {
  if (financeStore.categories.length === 0) {
    await financeStore.fetchCategories()
  }
  if (financeStore.wallets.length === 0) {
    await financeStore.fetchWallets()
  }
  resetForm()
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

watch(
  () => financeStore.isTransactionSheetOpen,
  (isOpen) => {
    if (isOpen) {
      localError.value = ''
      showDatePicker.value = false
      if (financeStore.editingTransaction) {
        populateFromEditing(financeStore.editingTransaction)
      } else {
        type.value = financeStore.transactionSheetInitialType || 'expense'
        resetForm()
      }
    }
  }
)

function populateFromEditing(tx) {
  type.value = tx.type || 'expense'
  rawAmount.value = String(Math.round(Number(tx.amount || 0)))
  title.value = tx.title || ''
  description.value = tx.description || ''
  selectedTags.value = Array.isArray(tx.tags) ? [...tx.tags] : []
  feeTransfer.value = 0
  transactionDate.value = getLocalDatetimeString(tx.transaction_date)
  walletId.value = tx.wallet_id || financeStore.wallets[0]?.id || null
  destinationWalletId.value =
    tx.destination_wallet_id || financeStore.wallets[1]?.id || financeStore.wallets[0]?.id || null
  selectedCategoryId.value = tx.finance_category_id || filteredCategories.value[0]?.id || null
}

function resetForm() {
  rawAmount.value = '0'
  title.value = ''
  description.value = ''
  selectedTags.value = []
  feeTransfer.value = 0
  transactionDate.value = getLocalDatetimeString()

  const firstWallet = financeStore.wallets[0]
  walletId.value = firstWallet ? firstWallet.id : null

  const secondWallet = financeStore.wallets[1] || firstWallet
  destinationWalletId.value = secondWallet ? secondWallet.id : null

  const matchingCats = filteredCategories.value
  selectedCategoryId.value = matchingCats[0]?.id || null
}

const filteredCategories = computed(() => {
  if (type.value === 'income') {
    return financeStore.categories.filter((c) => c.type === 'income')
  }
  return financeStore.categories.filter((c) => c.type === 'expense')
})

const selectedCategory = computed(() => {
  return financeStore.categories.find((c) => c.id === selectedCategoryId.value)
})

const availableTags = computed(() => {
  const catTags = selectedCategory.value?.subcategories || []
  const standardTags = ['Reimburse', 'Split Bill', 'CC/Paylater']
  return [...new Set([...catTags, ...standardTags])]
})

function selectType(newType) {
  type.value = newType
  localError.value = ''
  const matching = filteredCategories.value
  if (matching.length > 0 && !matching.some((c) => c.id === selectedCategoryId.value)) {
    selectedCategoryId.value = matching[0].id
  }
}

function selectCategory(cat) {
  selectedCategoryId.value = cat.id
  selectedTags.value = []
}

function toggleTag(tag) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  } else {
    selectedTags.value.push(tag)
  }
}

// ==========================================
// NUMPAD & IN-PLACE CALCULATOR
// ==========================================

function pressDigit(val) {
  localError.value = ''
  if (val === '.') {
    const parts = rawAmount.value.split(/[+\-*/]/)
    const lastPart = parts[parts.length - 1] || ''
    if (lastPart.includes('.')) return
  }
  if (rawAmount.value === '0' && val !== '.') {
    rawAmount.value = val === '000' ? '0' : val
  } else {
    rawAmount.value += val
  }
}

function pressBackspace() {
  const trimmed = rawAmount.value.trimEnd()
  if (trimmed.length <= 1) {
    rawAmount.value = '0'
  } else {
    rawAmount.value = trimmed.slice(0, -1).trimEnd() || '0'
  }
}

function pressOperator(op) {
  const current = rawAmount.value.trim()
  if (!current) return
  if (['+', '-', '*', '/'].includes(current.slice(-1))) {
    rawAmount.value = current.slice(0, -1).trim() + ' ' + op + ' '
  } else {
    rawAmount.value = current + ' ' + op + ' '
  }
}

function evaluateCalculation() {
  try {
    const expr = rawAmount.value.replace(/×/g, '*').replace(/÷/g, '/')
    const sanitized = expr.replace(/[^0-9+\-*/. ]/g, '').trim()
    const cleanExpr = sanitized.replace(/[+\-*/ ]+$/, '')
    if (cleanExpr) {
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${cleanExpr})`)()
      if (Number.isFinite(result)) {
        rawAmount.value = String(Math.max(0, Math.round(result)))
      }
    }
  } catch {
    // ignore invalid expression
  }
}

const hasExpression = computed(() => /[+\-*/]/.test(rawAmount.value))

const displayFormattedAmount = computed(() => {
  if (hasExpression.value) {
    return rawAmount.value.replace(/\*/g, '×').replace(/\//g, '÷')
  }
  const num = parseFloat(rawAmount.value) || 0
  return new Intl.NumberFormat('id-ID').format(num)
})

const finalAmountNumber = computed(() => {
  try {
    const expr = rawAmount.value.replace(/×/g, '*').replace(/÷/g, '/')
    const sanitized = expr.replace(/[^0-9+\-*/. ]/g, '').replace(/[+\-*/ ]+$/, '')
    // eslint-disable-next-line no-new-func
    const result = Function(`'use strict'; return (${sanitized})`)()
    return Number.isFinite(result) ? Math.max(0, Math.round(result)) : 0
  } catch {
    return parseFloat(rawAmount.value) || 0
  }
})

function handleGlobalKeydown(e) {
  if (!financeStore.isTransactionSheetOpen) return
  const tag = e.target?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    if (e.key === 'Escape') financeStore.closeTransactionSheet()
    return
  }

  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault()
    pressDigit(e.key)
  } else if (e.key === 'Backspace') {
    e.preventDefault()
    pressBackspace()
  } else if (['+', '-', '*', '/'].includes(e.key)) {
    e.preventDefault()
    pressOperator(e.key)
  } else if (e.key === '=' || e.key === 'Enter') {
    e.preventDefault()
    if (hasExpression.value && e.key === '=') {
      evaluateCalculation()
    } else {
      submitTransaction()
    }
  } else if (e.key === 'Escape') {
    financeStore.closeTransactionSheet()
  }
}

async function submitTransaction() {
  evaluateCalculation()
  localError.value = ''
  const amount = finalAmountNumber.value

  if (amount <= 0) {
    localError.value = 'Masukkan jumlah nominal transaksi lebih dari Rp 0.'
    return
  }

  if (!walletId.value) {
    localError.value = 'Pilih dompet terlebih dahulu.'
    return
  }

  if (type.value === 'transfer' && walletId.value === destinationWalletId.value) {
    localError.value = 'Dompet sumber dan dompet tujuan tidak boleh sama.'
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      type: type.value,
      amount: amount,
      wallet_id: walletId.value,
      destination_wallet_id: type.value === 'transfer' ? destinationWalletId.value : null,
      finance_category_id: type.value === 'transfer' ? null : selectedCategoryId.value,
      title:
        title.value.trim() ||
        (type.value === 'transfer'
          ? 'Transfer Antar Dompet'
          : selectedCategory.value
            ? selectedCategory.value.name
            : 'Transaksi'),
      description: description.value.trim() || null,
      tags: selectedTags.value,
      fee_transfer: type.value === 'transfer' ? parseFloat(feeTransfer.value) || 0 : 0,
      transaction_date: transactionDate.value.replace('T', ' ') + ':00',
    }

    if (isEditing.value) {
      await financeStore.updateTransaction(financeStore.editingTransaction.id, payload)
    } else {
      await financeStore.addTransaction(payload)
    }

    financeStore.closeTransactionSheet()
  } catch (err) {
    localError.value = err.response?.data?.message || 'Gagal menyimpan transaksi.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="financeStore.isTransactionSheetOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center transition-opacity select-none p-0 sm:p-4"
      @click.self="financeStore.closeTransactionSheet()"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 shadow-floating overflow-hidden flex flex-col max-h-[92vh]"
      >
        <!-- Drag Handle -->
        <div class="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div class="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
        </div>

        <!-- Header: Type Switcher & Close -->
        <div class="px-4 py-2.5 flex items-center justify-between gap-2 border-b border-[#e2e2e5] dark:border-zinc-800">
          <!-- Segmented Type Switcher -->
          <div class="flex items-center gap-1 bg-[#f3f3f6] dark:bg-zinc-800 p-1 rounded-full overflow-x-auto no-scrollbar">
            <button
              type="button"
              @click="selectType('expense')"
              class="px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              :class="
                type === 'expense'
                  ? 'bg-[#ba1a1a] text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              "
            >
              <ArrowDownRight class="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>
            <button
              type="button"
              @click="selectType('income')"
              class="px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              :class="
                type === 'income'
                  ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              "
            >
              <ArrowUpRight class="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
            <button
              type="button"
              @click="selectType('transfer')"
              class="px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              :class="
                type === 'transfer'
                  ? 'bg-[#373b3a] text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              "
            >
              <Shuffle class="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          <button
            type="button"
            aria-label="Tutup"
            @click="financeStore.closeTransactionSheet()"
            class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            <Xmark class="w-4 h-4" />
          </button>
        </div>

        <!-- Body Scrollable -->
        <div class="overflow-y-auto flex-1 space-y-3 pb-2 px-4 pt-2.5">
          <!-- Error Alert Inline -->
          <div
            v-if="localError"
            class="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-[#ba1a1a] dark:text-rose-400"
          >
            {{ localError }}
          </div>

          <!-- Category Selection Pills (Hanya jika bukan transfer) -->
          <div v-if="type !== 'transfer'" class="space-y-2 border-b border-[#e2e2e5] dark:border-zinc-800/80 pb-3">
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                v-for="cat in filteredCategories"
                :key="cat.id"
                type="button"
                @click="selectCategory(cat)"
                class="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer border flex items-center gap-1.5"
                :class="
                  selectedCategoryId === cat.id
                    ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] border-transparent shadow-xs font-bold'
                    : 'bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-[#e2e2e5] dark:border-zinc-700 hover:bg-slate-200'
                "
              >
                <div
                  class="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-white"
                  :style="{ backgroundColor: cat.color || '#144229' }"
                >
                  <component :is="getCategoryIcon(cat.icon)" class="w-2.5 h-2.5 stroke-[2.5]" />
                </div>
                <span>{{ cat.name }}</span>
              </button>
            </div>

            <!-- Sub-Category / Tags Chips -->
            <div v-if="availableTags.length > 0" class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <button
                v-for="tag in availableTags"
                :key="tag"
                type="button"
                @click="toggleTag(tag)"
                class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 transition-colors cursor-pointer border"
                :class="
                  selectedTags.includes(tag)
                    ? 'bg-[#d3e4d8] text-[#144229] dark:bg-[#2d5a3f] dark:text-[#a1d2af] border-transparent font-bold'
                    : 'bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-[#e2e2e5] dark:border-zinc-700'
                "
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <!-- Mode Transfer: Dompet Asal & Tujuan + Fee -->
          <div
            v-if="type === 'transfer'"
            class="p-3 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/40 border border-[#e2e2e5] dark:border-zinc-800 space-y-2.5"
          >
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">
                  Dari Dompet
                </label>
                <select
                  v-model="walletId"
                  class="w-full p-2 rounded-xl bg-white dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-bold text-xs"
                >
                  <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
                    {{ w.name }} ({{ financeStore.formatMoney(w.balance) }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-500 mb-1">
                  Ke Dompet
                </label>
                <select
                  v-model="destinationWalletId"
                  class="w-full p-2 rounded-xl bg-white dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-bold text-xs"
                >
                  <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
                    {{ w.name }}
                  </option>
                </select>
              </div>
            </div>
            <div
              v-if="!isEditing"
              class="flex items-center gap-2 pt-1 border-t border-[#e2e2e5] dark:border-zinc-800"
            >
              <span class="text-xs font-semibold text-slate-500 dark:text-zinc-400">Biaya Admin:</span>
              <input
                type="number"
                v-model="feeTransfer"
                placeholder="0"
                class="w-24 p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-xs font-bold tabular-nums"
              />
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="feeTransfer = 0"
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-zinc-700 cursor-pointer"
                >
                  Rp 0
                </button>
                <button
                  type="button"
                  @click="feeTransfer = 2500"
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-zinc-700 cursor-pointer"
                >
                  Rp 2.500
                </button>
              </div>
            </div>
          </div>

          <!-- Nominal Display with Cursor -->
          <div class="py-1.5 text-center space-y-1">
            <div class="flex items-center justify-center gap-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
              >
                IDR
              </span>
              <div
                class="text-3xl font-extrabold tracking-tight tabular-nums flex items-center text-slate-900 dark:text-zinc-100"
              >
                <span>Rp {{ displayFormattedAmount }}</span>
                <span class="w-0.5 h-7 bg-[#144229] dark:bg-[#a1d2af] animate-pulse ml-1"></span>
              </div>
            </div>
            <span class="text-[10px] text-slate-400 dark:text-zinc-500 block">
              {{ isEditing ? 'Perbarui nominal transaksi' : 'Masukkan jumlah transaksi' }}
              <template v-if="hasExpression"> · Hasil: Rp {{ new Intl.NumberFormat('id-ID').format(finalAmountNumber) }}</template>
            </span>
          </div>

          <!-- Detail Inputs: Title, Notes, Wallet Selector, & Editable Date -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800/60 border border-[#e2e2e5] dark:border-zinc-700 text-xs">
              <span class="text-slate-400 font-bold shrink-0">Judul:</span>
              <input
                type="text"
                v-model="title"
                placeholder="Contoh: Makan siang, bayar listrik..."
                class="bg-transparent border-none outline-none flex-1 text-xs text-slate-900 dark:text-zinc-100"
              />
            </div>

            <div class="flex items-center gap-2">
              <div class="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800/60 border border-[#e2e2e5] dark:border-zinc-700 text-xs">
                <span class="text-slate-400 shrink-0">Catatan:</span>
                <input
                  type="text"
                  v-model="description"
                  placeholder="Catatan (opsional)..."
                  class="bg-transparent border-none outline-none flex-1 text-xs text-slate-900 dark:text-zinc-100"
                />
              </div>
              <select
                v-if="type !== 'transfer'"
                v-model="walletId"
                class="px-3 py-1.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800/60 border border-[#e2e2e5] dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 outline-none max-w-[140px]"
              >
                <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
                  {{ w.name }}
                </option>
              </select>
            </div>

            <!-- Baris Tanggal & Waktu (Tampil bila diklik di numpad) -->
            <div
              v-if="showDatePicker"
              class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#d3e4d8]/30 dark:bg-[#144229]/30 border border-[#d3e4d8] dark:border-[#2d5a3f] text-xs"
            >
              <span class="font-bold text-[#144229] dark:text-[#a1d2af] flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5" />
                <span>Waktu Transaksi:</span>
              </span>
              <input
                type="datetime-local"
                v-model="transactionDate"
                class="bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-[#e2e2e5] dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none tabular-nums"
              />
            </div>
          </div>
        </div>

        <!-- Integrated Virtual Numpad & Calculator -->
        <div class="p-3 bg-[#f9f9fc] dark:bg-zinc-950 border-t border-[#e2e2e5] dark:border-zinc-800 space-y-1.5">
          <!-- Bar Operator Kalkulator Cepat -->
          <div v-if="showCalcBar" class="grid grid-cols-5 gap-1.5 text-xs font-extrabold tabular-nums">
            <button type="button" @click="pressOperator('+')" class="py-1.5 rounded-lg bg-[#d3e4d8]/50 dark:bg-zinc-800 text-[#144229] dark:text-[#a1d2af] cursor-pointer">+</button>
            <button type="button" @click="pressOperator('-')" class="py-1.5 rounded-lg bg-[#d3e4d8]/50 dark:bg-zinc-800 text-[#144229] dark:text-[#a1d2af] cursor-pointer">−</button>
            <button type="button" @click="pressOperator('*')" class="py-1.5 rounded-lg bg-[#d3e4d8]/50 dark:bg-zinc-800 text-[#144229] dark:text-[#a1d2af] cursor-pointer">×</button>
            <button type="button" @click="pressOperator('/')" class="py-1.5 rounded-lg bg-[#d3e4d8]/50 dark:bg-zinc-800 text-[#144229] dark:text-[#a1d2af] cursor-pointer">÷</button>
            <button type="button" @click="evaluateCalculation()" class="py-1.5 rounded-lg bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] cursor-pointer">=</button>
          </div>

          <div class="grid grid-cols-4 gap-1.5 text-base font-bold tabular-nums">
            <button type="button" @click="pressDigit('1')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">1</button>
            <button type="button" @click="pressDigit('2')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">2</button>
            <button type="button" @click="pressDigit('3')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">3</button>
            <button type="button" @click="pressBackspace()" class="py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-[#ba1a1a] dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 shadow-2xs active:bg-rose-100 cursor-pointer">⌫</button>

            <button type="button" @click="pressDigit('4')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">4</button>
            <button type="button" @click="pressDigit('5')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">5</button>
            <button type="button" @click="pressDigit('6')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">6</button>
            <button
              type="button"
              @click="showCalcBar = !showCalcBar"
              class="py-2.5 rounded-xl border shadow-2xs text-xs font-extrabold cursor-pointer transition-colors"
              :class="
                showCalcBar
                  ? 'bg-[#d3e4d8] dark:bg-[#2d5a3f] text-[#144229] dark:text-[#a1d2af] border-[#144229]/30'
                  : 'bg-[#f3f3f6] dark:bg-zinc-800 border-[#e2e2e5] dark:border-zinc-700 hover:bg-slate-200'
              "
            >
              + − × =
            </button>

            <button type="button" @click="pressDigit('7')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">7</button>
            <button type="button" @click="pressDigit('8')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">8</button>
            <button type="button" @click="pressDigit('9')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">9</button>
            <button
              type="button"
              @click="showDatePicker = !showDatePicker"
              title="Ubah Tanggal & Waktu"
              class="py-2 rounded-xl border shadow-2xs text-[10px] font-bold flex flex-col items-center justify-center leading-tight cursor-pointer transition-colors"
              :class="
                showDatePicker
                  ? 'bg-[#d3e4d8] dark:bg-[#2d5a3f] text-[#144229] dark:text-[#a1d2af] border-[#144229]/30'
                  : 'bg-white dark:bg-zinc-900 border-[#e2e2e5] dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:border-[#144229]/40'
              "
            >
              <span>{{ new Date(transactionDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) }}</span>
              <span>{{ new Date(transactionDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}</span>
            </button>

            <button type="button" @click="pressDigit('.')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">.</button>
            <button type="button" @click="pressDigit('0')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">0</button>
            <button type="button" @click="pressDigit('000')" class="py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-2xs text-xs font-extrabold active:bg-slate-100 dark:active:bg-zinc-800 cursor-pointer">000</button>
            <button
              type="button"
              @click="submitTransaction"
              :disabled="isSubmitting"
              class="py-2.5 rounded-xl bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] font-extrabold shadow-floating active:scale-95 transition-transform flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <Check v-if="!isSubmitting" class="w-5 h-5 stroke-[2.5]" />
              <span v-else class="text-xs">...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
