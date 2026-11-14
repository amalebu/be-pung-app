<script setup>
import { ref, computed, watch } from 'vue'
import { Trash } from '@iconoir/vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import { formatRupiah, formatSharePrice, calculateDefaultBuyFee } from '@/utils/currencyUtils'
import { useInvestmentStore } from '@/stores/investmentStore'

const investmentStore = useInvestmentStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  lot: {
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

const emit = defineEmits(['close', 'submit', 'delete'])

const openedAt = ref('')
const lots = ref(1)
const buyPrice = ref(0)
const buyFee = ref(0)
const notes = ref('')

watch(
  () => props.lot,
  (val) => {
    if (!val) return
    openedAt.value = val.opened_at || ''
    lots.value = Number(val.remaining_lots || 1)
    buyPrice.value = Number(val.buy_price || 0)
    buyFee.value = Number(val.buy_fee || 0)
    notes.value = val.notes || ''
  },
  { immediate: true }
)

const totalShares = computed(() => Math.max(0, Number(lots.value || 0)) * 100)
const grossCost = computed(() => totalShares.value * Math.max(0, Number(buyPrice.value || 0)))
const totalCost = computed(() => grossCost.value + Math.max(0, Number(buyFee.value || 0)))
const isFeeMateraiApplied = computed(() => {
  return investmentStore.willTriggerDailyStampDuty(openedAt.value, grossCost.value, props.lot?.id)
})

function handleSubmit() {
  if (!props.lot) return
  emit('submit', {
    lotId: props.lot.id,
    payload: {
      opened_at: openedAt.value,
      lots: Math.max(1, parseInt(lots.value, 10) || 1),
      buy_price: Math.max(1, Number(buyPrice.value || 0)),
      buy_fee: Math.max(0, Number(buyFee.value || 0)),
      notes: notes.value.trim() || null,
    },
  })
}

function applyDefaultFee() {
  const gross = totalShares.value * Math.max(0, Number(buyPrice.value || 0))
  buyFee.value = calculateDefaultBuyFee(gross)
}

function handleDelete() {
  if (!props.lot) return
  emit('delete', props.lot.id)
}
</script>

<template>
  <BottomSheet
    :show="show"
    :title="`Edit Posisi ${lot?.ticker || ''}`"
    @close="emit('close')"
  >
    <form v-if="lot" @submit.prevent="handleSubmit" class="space-y-4">
      <BaseAlert v-if="errorMessage" variant="danger">
        {{ errorMessage }}
      </BaseAlert>

      <!-- Ringkasan Singkat Emiten & Logo -->
      <div class="flex items-center gap-3 p-3 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/60 border border-[#e2e2e5] dark:border-zinc-700">
        <StockAvatar :ticker="lot.ticker" size="md" />
        <div class="min-w-0 flex-1">
          <span class="text-sm font-extrabold text-[#144229] dark:text-[#a1d2af]">{{ lot.ticker }}</span>
          <p class="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
            Sisa posisi: <strong>{{ lot.remaining_lots }} Lot</strong> ({{ (lot.remaining_lots * 100).toLocaleString('id-ID') }} lembar)
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Tanggal Pembukaan
          </label>
          <input
            v-model="openedAt"
            type="date"
            required
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Jumlah Lot (1 Lot = 100 lbr)
          </label>
          <input
            v-model.number="lots"
            type="number"
            min="1"
            step="1"
            required
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-bold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>
      </div>

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
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-bold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Total Komisi (Rp)
            </label>
            <button
              type="button"
              @click="applyDefaultFee"
              class="text-[10px] font-bold text-[#144229] dark:text-[#a1d2af] underline hover:opacity-80 cursor-pointer"
              title="Hitung komisi default 0.1513%"
            >
              Hitung 0.1513%
            </button>
          </div>
          <input
            v-model.number="buyFee"
            type="number"
            min="0"
            step="any"
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <div class="p-3.5 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/60 border border-[#e2e2e5] dark:border-zinc-700 space-y-1.5 text-xs">
        <div class="flex items-center justify-between text-slate-600 dark:text-zinc-400">
          <span>Nilai Pokok ({{ lots }} Lot × Rp {{ formatSharePrice(buyPrice) }}):</span>
          <span class="font-bold tabular-nums text-slate-800 dark:text-zinc-200">
            {{ formatRupiah(grossCost) }}
          </span>
        </div>
        <div class="flex items-center justify-between text-slate-600 dark:text-zinc-400">
          <span>Komisi Broker:</span>
          <span class="font-bold tabular-nums text-slate-800 dark:text-zinc-200">
            {{ formatRupiah(buyFee) }}
          </span>
        </div>
        <div
          v-if="isFeeMateraiApplied"
          class="flex items-center justify-between text-slate-600 dark:text-zinc-400"
        >
          <span>Fee Materai:</span>
          <span class="font-bold tabular-nums text-slate-800 dark:text-zinc-200">
            Rp 10.000
          </span>
        </div>
        <div class="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-zinc-700">
          <span class="font-bold text-slate-700 dark:text-zinc-300">Total Modal Baris Ini:</span>
          <span class="text-sm font-extrabold tabular-nums text-slate-900 dark:text-zinc-100">
            {{ formatRupiah(totalCost) }}
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          @click="handleDelete"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <Trash class="w-4 h-4" />
          <span>Hapus Baris Ini</span>
        </button>

        <div class="flex items-center gap-2">
          <SecondaryButton type="button" size="md" @click="emit('close')">
            Batal
          </SecondaryButton>
          <PrimaryButton type="submit" size="md" :loading="saving" :disabled="saving">
            <span>Simpan Perubahan</span>
          </PrimaryButton>
        </div>
      </div>
    </form>
  </BottomSheet>
</template>
