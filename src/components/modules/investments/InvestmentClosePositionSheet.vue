<script setup>
import { ref, computed, watch } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import { formatRupiah, formatSharePrice, formatPercent, calculateDefaultSellFee } from '@/utils/currencyUtils'
import { getJakartaTodayStr } from '@/utils/dateUtils'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  target: {
    type: Object,
    default: null, // { stock, lot (opsional) }
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

const soldAt = ref(getJakartaTodayStr(0))
const soldLots = ref(1)
const sellPrice = ref(0)
const sellFee = ref(0)
const addToCash = ref(true)
const notes = ref('')
const isFeeManuallyEdited = ref(false)

const stock = computed(() => props.target?.stock || null)
const specificLot = computed(() => props.target?.lot || null)

const maxAvailableLots = computed(() => {
  if (specificLot.value) return Number(specificLot.value.remaining_lots || 1)
  return Number(stock.value?.total_lots || 1)
})

const referenceBuyPrice = computed(() => {
  if (specificLot.value) return Number(specificLot.value.buy_price || 0)
  return Number(stock.value?.avg_buy_price || 0)
})

const soldShares = computed(() => Math.max(0, Number(soldLots.value || 0)) * 100)
const costBasisEstimate = computed(() => soldShares.value * referenceBuyPrice.value)
const grossProceeds = computed(() => soldShares.value * Math.max(0, Number(sellPrice.value || 0)))
const netProceeds = computed(() => grossProceeds.value - Math.max(0, Number(sellFee.value || 0)))
const estimatedPl = computed(() => netProceeds.value - costBasisEstimate.value)
const estimatedPlPercent = computed(() =>
  costBasisEstimate.value > 0 ? (estimatedPl.value / costBasisEstimate.value) * 100 : 0
)

function onFeeInput() {
  isFeeManuallyEdited.value = true
}

function resetSellFeeToDefault() {
  isFeeManuallyEdited.value = false
  sellFee.value = calculateDefaultSellFee(grossProceeds.value)
}

watch(grossProceeds, (newGross) => {
  if (!isFeeManuallyEdited.value) {
    sellFee.value = calculateDefaultSellFee(newGross)
  }
})

watch(
  () => props.target,
  (val) => {
    if (!val?.stock) return
    soldAt.value = getJakartaTodayStr(0)
    soldLots.value = val.lot ? Number(val.lot.remaining_lots) : Number(val.stock.total_lots)
    sellPrice.value = Number(val.stock.last_price || val.lot?.buy_price || val.stock.avg_buy_price || 0)
    isFeeManuallyEdited.value = false
    addToCash.value = true
    notes.value = ''
    sellFee.value = calculateDefaultSellFee(grossProceeds.value)
  },
  { immediate: true }
)

function handleSubmit() {
  if (!stock.value) return
  emit('submit', {
    stock_id: stock.value.id,
    lot_id: specificLot.value?.id || null,
    sold_at: soldAt.value,
    sold_lots: Math.max(1, Math.min(maxAvailableLots.value, parseInt(soldLots.value, 10) || 1)),
    sell_price: Math.max(1, Number(sellPrice.value || 0)),
    sell_fee: Math.max(0, Number(sellFee.value || 0)),
    add_to_cash: addToCash.value,
    notes: notes.value.trim() || null,
  })
}
</script>

<template>
  <BottomSheet
    :show="show"
    :title="
      specificLot
        ? `Tutup Posisi ${stock?.ticker} (${specificLot.remaining_lots} Lot @ ${formatSharePrice(specificLot.buy_price)})`
        : `Tutup Posisi Gabungan ${stock?.ticker || ''}`
    "
    @close="emit('close')"
  >
    <form v-if="stock" @submit.prevent="handleSubmit" class="space-y-4">
      <BaseAlert v-if="errorMessage" variant="danger">
        {{ errorMessage }}
      </BaseAlert>

      <!-- Ringkasan Singkat Emiten & Logo -->
      <div class="flex items-center gap-3 p-3 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/60 border border-[#e2e2e5] dark:border-zinc-700">
        <StockAvatar :ticker="stock.ticker" :alt="stock.company_name" size="md" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-extrabold text-[#144229] dark:text-[#a1d2af]">{{ stock.ticker }}</span>
            <span class="text-xs text-slate-600 dark:text-zinc-300 truncate">{{ stock.company_name }}</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums mt-0.5">
            Posisi tersedia: <strong>{{ maxAvailableLots }} Lot</strong> ({{ (maxAvailableLots * 100).toLocaleString('id-ID') }} lembar)
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Tanggal Penutupan / Jual
          </label>
          <input
            v-model="soldAt"
            type="date"
            required
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Jumlah Lot Dijual <span class="font-normal text-slate-400">(Maks: {{ maxAvailableLots }} Lot)</span>
          </label>
          <input
            v-model.number="soldLots"
            type="number"
            min="1"
            :max="maxAvailableLots"
            step="1"
            required
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-bold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Harga Jual (Rp / Lembar)
          </label>
          <input
            v-model.number="sellPrice"
            type="number"
            min="1"
            step="any"
            required
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-bold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Komisi Jual Broker (Rp)
            </label>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#144229]/10 text-[#144229] dark:bg-[#a1d2af]/20 dark:text-[#a1d2af]">
                Default 0.2513%
              </span>
              <button
                v-if="isFeeManuallyEdited"
                type="button"
                @click="resetSellFeeToDefault"
                class="text-[10px] font-bold text-[#144229] dark:text-[#a1d2af] underline hover:opacity-80 cursor-pointer"
                title="Kembalikan ke hitungan default 0.2513%"
              >
                Reset
              </button>
            </div>
          </div>
          <input
            v-model.number="sellFee"
            @input="onFeeInput"
            type="number"
            min="0"
            step="any"
            placeholder="Default: 0.2513%"
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <!-- Preview Hasil Penjualan & Realized P/L -->
      <div class="p-3.5 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/60 border border-[#e2e2e5] dark:border-zinc-700 space-y-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-slate-500">Harga Beli Acuan:</span>
          <span class="font-bold tabular-nums">Rp {{ formatSharePrice(referenceBuyPrice) }} / lembar</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-slate-500">Komisi Penjualan:</span>
          <span class="font-bold tabular-nums text-slate-800 dark:text-zinc-200">
            {{ formatRupiah(sellFee) }}
            <span class="text-[10px] font-normal text-slate-400">
              {{ isFeeManuallyEdited ? '(manual)' : '(0.2513%)' }}
            </span>
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-slate-500">Hasil Bersih Penjualan:</span>
          <span class="font-extrabold tabular-nums text-slate-900 dark:text-zinc-100">
            {{ formatRupiah(netProceeds) }}
          </span>
        </div>

        <div class="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-zinc-700">
          <span class="font-semibold text-slate-700 dark:text-zinc-300">Estimasi Realized P/L:</span>
          <span
            class="text-sm font-extrabold tabular-nums"
            :class="
              estimatedPl > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : estimatedPl < 0
                  ? 'text-[#ba1a1a] dark:text-rose-400'
                  : 'text-slate-700'
            "
          >
            {{ formatRupiah(estimatedPl, { withSign: true }) }} ({{ formatPercent(estimatedPlPercent) }})
          </span>
        </div>

        <label class="flex items-center gap-2.5 pt-2 border-t border-slate-200 dark:border-zinc-700 cursor-pointer select-none">
          <input
            v-model="addToCash"
            type="checkbox"
            class="w-4 h-4 rounded accent-[#144229]"
          />
          <span class="font-bold text-slate-800 dark:text-zinc-200">
            Masukkan hasil penjualan bersih ke Saldo Cash RDN
          </span>
        </label>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-2">
        <SecondaryButton type="button" size="md" @click="emit('close')">
          Batal
        </SecondaryButton>
        <PrimaryButton type="submit" size="md" :loading="saving" :disabled="saving">
          <span>Konfirmasi Tutup Posisi</span>
        </PrimaryButton>
      </div>
    </form>
  </BottomSheet>
</template>
