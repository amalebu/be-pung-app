<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Plus, Minus, Wallet } from '@iconoir/vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseText from '@/components/ui/BaseText.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import { investmentService } from '@/services/investmentService'
import { formatRupiah, formatSharePrice, calculateDefaultBuyFee } from '@/utils/currencyUtils'
import { getJakartaTodayStr } from '@/utils/dateUtils'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  prefilledTicker: {
    type: String,
    default: '',
  },
  cashBalance: {
    type: Number,
    default: 0,
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

const tickerInput = ref('')
const companyName = ref('')
const openedAt = ref(getJakartaTodayStr(0))
const lots = ref(1)
const buyPrice = ref(5000)
const buyFee = ref(0)
const deductFromCash = ref(true)
const notes = ref('')
const isFeeManuallyEdited = ref(false)

const tickerSuggestions = ref([])
const showSuggestions = ref(false)
const fetchingQuote = ref(false)
const liveMarketPrice = ref(0)

let searchTimer = null

const totalShares = computed(() => Math.max(0, Number(lots.value || 0)) * 100)
const grossCost = computed(() => totalShares.value * Math.max(0, Number(buyPrice.value || 0)))
const totalCost = computed(() => grossCost.value + Math.max(0, Number(buyFee.value || 0)))
const isCashSufficient = computed(
  () => !deductFromCash.value || Number(props.cashBalance) >= totalCost.value
)

function onFeeInput() {
  isFeeManuallyEdited.value = true
}

function resetBuyFeeToDefault() {
  isFeeManuallyEdited.value = false
  buyFee.value = calculateDefaultBuyFee(grossCost.value)
}

watch(grossCost, (newGross) => {
  if (!isFeeManuallyEdited.value) {
    buyFee.value = calculateDefaultBuyFee(newGross)
  }
})

watch(
  () => props.show,
  async (isOpen) => {
    if (!isOpen) return
    openedAt.value = getJakartaTodayStr(0)
    lots.value = 5
    isFeeManuallyEdited.value = false
    deductFromCash.value = Number(props.cashBalance) > 0
    notes.value = ''

    if (props.prefilledTicker) {
      tickerInput.value = props.prefilledTicker.toUpperCase()
      await loadQuoteForTicker(tickerInput.value)
    } else {
      tickerInput.value = ''
      companyName.value = ''
      buyPrice.value = 5000
      liveMarketPrice.value = 0
      await loadTickerSuggestions('')
    }

    if (!isFeeManuallyEdited.value) {
      buyFee.value = calculateDefaultBuyFee(grossCost.value)
    }
  }
)

async function loadTickerSuggestions(q) {
  try {
    const res = await investmentService.searchTickers(q)
    tickerSuggestions.value = res.data || []
  } catch {
    tickerSuggestions.value = []
  }
}

function handleTickerInput(val) {
  const clean = String(val || '').toUpperCase().replace(/[^A-Z0-9.]/g, '')
  tickerInput.value = clean
  showSuggestions.value = true

  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadTickerSuggestions(clean)
  }, 220)
}

async function selectSuggestion(item) {
  tickerInput.value = item.ticker
  companyName.value = item.company_name || ''
  showSuggestions.value = false
  await loadQuoteForTicker(item.ticker)
}

async function loadQuoteForTicker(ticker) {
  const clean = String(ticker || '').trim()
  if (!clean) return
  fetchingQuote.value = true
  try {
    const res = await investmentService.getTickerQuote(clean)
    const q = res.data
    if (q) {
      if (q.company_name) companyName.value = q.company_name
      if (Number(q.last_price) > 0) {
        liveMarketPrice.value = Number(q.last_price)
        buyPrice.value = Number(q.last_price)
      }
    }
  } catch {
    // Biarkan user input manual bila gagal ambil quote
  } finally {
    fetchingQuote.value = false
  }
}

function adjustLots(delta) {
  lots.value = Math.max(1, Number(lots.value || 1) + delta)
}

function handleSubmit() {
  if (!tickerInput.value.trim()) return
  emit('submit', {
    ticker: tickerInput.value.trim().toUpperCase(),
    company_name: companyName.value.trim() || null,
    opened_at: openedAt.value,
    lots: Math.max(1, parseInt(lots.value, 10) || 1),
    buy_price: Math.max(1, Number(buyPrice.value || 0)),
    buy_fee: Math.max(0, Number(buyFee.value || 0)),
    deduct_from_cash: deductFromCash.value,
    notes: notes.value.trim() || null,
  })
}
</script>

<template>
  <BottomSheet
    :show="show"
    :title="prefilledTicker ? `Tambah Lot ${prefilledTicker}` : 'Beli Saham Baru (BEI / IDX)'"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <BaseAlert v-if="errorMessage" variant="danger">
        {{ errorMessage }}
      </BaseAlert>

      <!-- Kode Saham (Ticker) dengan Auto-Search Yahoo Finance -->
      <div class="relative">
        <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
          Kode Saham (Ticker BEI)
        </label>
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            :value="tickerInput"
            type="text"
            required
            placeholder="Ketik kode saham, misal: BBCA, PSAT, BBRI..."
            @input="handleTickerInput($event.target.value)"
            @focus="showSuggestions = true"
            @blur="setTimeout(() => (showSuggestions = false), 180)"
            class="w-full pl-9 pr-24 py-2.5 rounded-2xl text-sm font-bold uppercase bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#144229]"
          />
          <button
            type="button"
            @click="loadQuoteForTicker(tickerInput)"
            class="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#d3e4d8] text-[#144229] hover:opacity-90 cursor-pointer"
          >
            {{ fetchingQuote ? 'Memuat...' : 'Cek Harga' }}
          </button>
        </div>

        <div v-if="companyName" class="mt-1.5 flex items-center gap-2">
          <StockAvatar :ticker="tickerInput" :alt="companyName" size="xs" />
          <p class="text-xs font-medium text-[#144229] dark:text-[#a1d2af]">
            {{ companyName }}
            <span v-if="liveMarketPrice > 0" class="tabular-nums font-bold">
              · Harga Yahoo: Rp {{ formatSharePrice(liveMarketPrice) }}
            </span>
          </p>
        </div>

        <!-- Dropdown Saran Emiten -->
        <div
          v-if="showSuggestions && tickerSuggestions.length > 0"
          class="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-floating divide-y divide-slate-100 dark:divide-zinc-800"
        >
          <button
            v-for="item in tickerSuggestions"
            :key="item.ticker"
            type="button"
            @mousedown.prevent="selectSuggestion(item)"
            class="w-full px-3.5 py-2.5 text-left hover:bg-[#f3f3f6] dark:hover:bg-zinc-800 flex items-center justify-between gap-2.5 cursor-pointer"
          >
            <div class="flex items-center gap-2 min-w-0">
              <StockAvatar :ticker="item.ticker" :alt="item.company_name" size="xs" />
              <div class="min-w-0">
                <span class="text-xs font-extrabold text-[#144229] dark:text-[#a1d2af]">{{ item.ticker }}</span>
                <span class="text-xs text-slate-600 dark:text-zinc-300 ml-2 truncate">{{ item.company_name }}</span>
              </div>
            </div>
            <span class="text-[10px] font-semibold text-slate-400 shrink-0">{{ item.yahoo_symbol }}</span>
          </button>
        </div>
      </div>

      <!-- Tanggal Pembukaan & Jumlah Lot -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Tanggal Pembukaan
          </label>
          <input
            v-model="openedAt"
            type="date"
            required
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#144229]"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Jumlah Lot <span class="font-normal text-slate-400">(1 Lot = 100 Lembar)</span>
          </label>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              @click="adjustLots(-1)"
              class="w-10 h-10 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-200 cursor-pointer shrink-0"
            >
              <Minus class="w-4 h-4" />
            </button>
            <input
              v-model.number="lots"
              type="number"
              min="1"
              step="1"
              required
              class="w-full px-3 py-2 rounded-2xl text-center text-sm font-extrabold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#144229]"
            />
            <button
              type="button"
              @click="adjustLots(1)"
              class="w-10 h-10 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-200 cursor-pointer shrink-0"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>
          <p class="mt-1 text-[11px] text-slate-500 tabular-nums">
            Setara <strong>{{ totalShares.toLocaleString('id-ID') }} lembar</strong> saham
          </p>
        </div>
      </div>

      <!-- Harga Pembukaan per Lembar & Total Komisi -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Harga Pembukaan (Rp / Lembar)
          </label>
          <input
            v-model.number="buyPrice"
            type="number"
            min="1"
            step="any"
            required
            placeholder="Contoh: 5000"
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-bold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#144229]"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Total Komisi Broker (Rp)
            </label>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#144229]/10 text-[#144229] dark:bg-[#a1d2af]/20 dark:text-[#a1d2af]">
                Default 0.1513%
              </span>
              <button
                v-if="isFeeManuallyEdited"
                type="button"
                @click="resetBuyFeeToDefault"
                class="text-[10px] font-bold text-[#144229] dark:text-[#a1d2af] underline hover:opacity-80 cursor-pointer"
                title="Kembalikan ke hitungan default 0.1513%"
              >
                Reset
              </button>
            </div>
          </div>
          <input
            v-model.number="buyFee"
            @input="onFeeInput"
            type="number"
            min="0"
            step="any"
            placeholder="Default: 0.1513%"
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#144229]"
          />
        </div>
      </div>

      <!-- Ringkasan Kalkulasi Pembelian -->
      <div class="p-3.5 rounded-2xl bg-[#f3f3f6]/90 dark:bg-zinc-800/60 border border-[#e2e2e5] dark:border-zinc-700 space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
          <span>Rumus Lot × Harga:</span>
          <span class="font-bold tabular-nums text-slate-800 dark:text-zinc-200">
            {{ lots }} Lot ({{ totalShares.toLocaleString('id-ID') }} lbr) × Rp {{ formatSharePrice(buyPrice) }}
          </span>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
          <span>Komisi Broker:</span>
          <span class="font-bold tabular-nums text-slate-800 dark:text-zinc-200">
            {{ formatRupiah(buyFee) }}
            <span class="text-[10px] font-normal text-slate-400">
              {{ isFeeManuallyEdited ? '(manual)' : '(0.1513%)' }}
            </span>
          </span>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
          <span>Total Nilai Pembelian (+ Komisi):</span>
          <span class="text-sm font-extrabold tabular-nums text-[#144229] dark:text-[#a1d2af]">
            {{ formatRupiah(totalCost) }}
          </span>
        </div>

        <!-- Opsi Potong Saldo Cash RDN -->
        <label class="flex items-start gap-2.5 pt-2 border-t border-slate-200/80 dark:border-zinc-700 cursor-pointer select-none">
          <input
            v-model="deductFromCash"
            type="checkbox"
            class="mt-0.5 w-4 h-4 rounded accent-[#144229]"
          />
          <div class="text-xs">
            <span class="font-bold text-slate-800 dark:text-zinc-200 block">
              Potong otomatis dari Saldo Cash RDN (
              <span :class="Number(cashBalance) < 0 ? 'text-[#ba1a1a] dark:text-rose-400 font-extrabold' : ''">
                {{ formatRupiah(cashBalance) }}
              </span>
              )
            </span>
            <span class="text-[11px] text-slate-500 dark:text-zinc-400">
              Matikan centang ini jika Anda hanya ingin mencatat riwayat saham lama tanpa mengurangi Cash saat ini.
            </span>
            <span v-if="deductFromCash && (Number(cashBalance) - totalCost < 0)" class="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mt-0.5">
              Perhatian: Saldo Cash RDN akan menjadi minus ({{ formatRupiah(Number(cashBalance) - totalCost) }}).
            </span>
          </div>
        </label>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-2">
        <SecondaryButton type="button" size="md" @click="emit('close')">
          Batal
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          size="md"
          :loading="saving"
          :disabled="saving || !tickerInput.trim()"
        >
          <span>Simpan Pembelian</span>
        </PrimaryButton>
      </div>
    </form>
  </BottomSheet>
</template>
