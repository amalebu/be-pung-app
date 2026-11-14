<script setup>
import { ref } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import { formatRupiah, formatSharePrice, formatPercent } from '@/utils/currencyUtils'
import { Trash, WarningTriangle } from '@iconoir/vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  sale: {
    type: Object,
    default: null,
  },
  deleting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'confirm'])

function handleConfirm() {
  if (!props.sale) return
  emit('confirm', props.sale.id)
}
</script>

<template>
  <BottomSheet :show="show" title="Batalkan Penjualan" @close="emit('close')">
    <div v-if="sale" class="p-5 space-y-4">
      <!-- Error Alert -->
      <BaseAlert v-if="errorMessage" variant="danger">
        {{ errorMessage }}
      </BaseAlert>

      <!-- Emiten Header Card -->
      <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60">
        <StockAvatar :ticker="sale.ticker" :alt="sale.company_name" size="lg" class="shrink-0" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-black text-base text-[#144229] dark:text-[#a1d2af]">{{ sale.ticker }}</span>
            <span class="text-xs text-slate-500 dark:text-zinc-400 tabular-nums">Jual: {{ sale.sold_at }}</span>
          </div>
          <p class="text-xs text-slate-600 dark:text-zinc-300 truncate font-medium">
            {{ sale.company_name || 'Saham Bursa Efek Indonesia' }}
          </p>
        </div>
      </div>

      <!-- Warning Banner -->
      <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
        <WarningTriangle class="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <span class="font-bold">Konfirmasi Pembatalan:</span>
          Apakah kamu yakin ingin membatalkan transaksi tutup posisi ini?
          Lot saham akan dipulihkan kembali ke portofolio aktif, dan dana hasil penjualan akan ditarik kembali dari Cash RDN.
        </div>
      </div>

      <!-- Ringkasan Dampak Pembatalan -->
      <div class="rounded-2xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
        <div class="flex items-center justify-between p-3">
          <span class="text-slate-500 dark:text-zinc-400">Lot yang Dipulihkan</span>
          <span class="font-extrabold text-[#144229] dark:text-[#a1d2af] tabular-nums">
            +{{ sale.sold_lots }} Lot ({{ sale.sold_shares }} lbr)
          </span>
        </div>
        <div class="flex items-center justify-between p-3">
          <span class="text-slate-500 dark:text-zinc-400">Harga Jual Sebelumnya</span>
          <span class="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
            Rp {{ formatSharePrice(sale.sell_price) }}
          </span>
        </div>
        <div class="flex items-center justify-between p-3">
          <span class="text-slate-500 dark:text-zinc-400">Hasil Bersih Ditarik dari Kas</span>
          <span class="font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
            -{{ formatRupiah(sale.net_proceeds) }}
          </span>
        </div>
        <div class="flex items-center justify-between p-3">
          <span class="text-slate-500 dark:text-zinc-400">Realized P/L Dibatalkan</span>
          <span class="font-extrabold tabular-nums" :class="Number(sale.realized_pl) >= 0 ? 'text-slate-700 dark:text-zinc-300' : 'text-slate-700 dark:text-zinc-300'">
            {{ formatRupiah(sale.realized_pl, { withSign: true }) }} ({{ formatPercent(sale.realized_pl_percent) }})
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-2.5 pt-2">
        <SecondaryButton type="button" size="md" @click="emit('close')" :disabled="deleting">
          Batal
        </SecondaryButton>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="deleting"
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-floating transition-colors cursor-pointer"
        >
          <Trash class="w-4 h-4" />
          <span>{{ deleting ? 'Membatalkan...' : 'Ya, Batalkan Penjualan' }}</span>
        </button>
      </div>
    </div>
  </BottomSheet>
</template>
