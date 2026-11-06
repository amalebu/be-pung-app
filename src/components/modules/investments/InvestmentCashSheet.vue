<script setup>
import { ref, watch } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { formatRupiah } from '@/utils/currencyUtils'
import { getJakartaTodayStr } from '@/utils/dateUtils'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  initialMode: {
    type: String,
    default: 'topup', // topup | withdraw | adjustment
  },
  currentBalance: {
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

const mode = ref('topup')
const amount = ref(1000000)
const transactedAt = ref(getJakartaTodayStr(0))
const description = ref('')

const quickNominals = [500000, 1000000, 2500000, 5000000, 10000000]

watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) return
    mode.value = props.initialMode || 'topup'
    amount.value = mode.value === 'adjustment' ? Number(props.currentBalance || 0) : 1000000
    transactedAt.value = getJakartaTodayStr(0)
    description.value = ''
  }
)

function handleSubmit() {
  emit('submit', {
    type: mode.value,
    amount: Math.max(0, Number(amount.value || 0)),
    transacted_at: transactedAt.value,
    description: description.value.trim() || null,
  })
}
</script>

<template>
  <BottomSheet
    :show="show"
    title="Kelola Saldo Cash Investasi (RDN)"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <BaseAlert v-if="errorMessage" variant="danger">
        {{ errorMessage }}
      </BaseAlert>

      <!-- Mode Selector Tabs -->
      <div class="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800">
        <button
          type="button"
          @click="mode = 'topup'"
          class="py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="
            mode === 'topup'
              ? 'bg-[#144229] text-white shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400'
          "
        >
          + Top-Up Cash
        </button>
        <button
          type="button"
          @click="mode = 'withdraw'"
          class="py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="
            mode === 'withdraw'
              ? 'bg-[#144229] text-white shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400'
          "
        >
          - Tarik Dana
        </button>
        <button
          type="button"
          @click="mode = 'adjustment'; amount = currentBalance"
          class="py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          :class="
            mode === 'adjustment'
              ? 'bg-[#144229] text-white shadow-2xs'
              : 'text-slate-600 dark:text-zinc-400'
          "
        >
          Atur Saldo Akhir
        </button>
      </div>

      <div class="p-3 rounded-2xl bg-[#d3e4d8]/45 dark:bg-[#2d5a3f]/30 flex items-center justify-between text-xs">
        <span class="font-medium text-slate-600 dark:text-zinc-300">Saldo Cash RDN Saat Ini:</span>
        <span
          class="font-extrabold tabular-nums"
          :class="Number(currentBalance) < 0 ? 'text-[#ba1a1a] dark:text-rose-400' : 'text-[#144229] dark:text-[#a1d2af]'"
        >
          {{ formatRupiah(currentBalance) }}
        </span>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
          {{
            mode === 'topup'
              ? 'Nominal Top-Up (Rp)'
              : mode === 'withdraw'
                ? 'Nominal Penarikan (Rp)'
                : 'Tetapkan Saldo Cash RDN Baru (Rp)'
          }}
        </label>
        <input
          v-model.number="amount"
          type="number"
          :min="mode === 'adjustment' ? undefined : 0"
          step="any"
          required
          class="w-full px-3.5 py-2.5 rounded-2xl text-base font-extrabold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
        />

        <!-- Quick Nominal Chips -->
        <div class="flex flex-wrap gap-1.5 mt-2">
          <button
            v-for="nom in quickNominals"
            :key="nom"
            type="button"
            @click="amount = nom"
            class="px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 hover:bg-[#d3e4d8] hover:text-[#144229] transition-colors cursor-pointer"
          >
            {{ formatRupiah(nom) }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Tanggal Transaksi
          </label>
          <input
            v-model="transactedAt"
            type="date"
            required
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold tabular-nums bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
            Catatan (Opsional)
          </label>
          <input
            v-model="description"
            type="text"
            placeholder="Misal: Setor RDN BCA Sekuritas"
            class="w-full px-3.5 py-2.5 rounded-2xl text-sm bg-[#f3f3f6] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-2">
        <SecondaryButton type="button" size="md" @click="emit('close')">
          Batal
        </SecondaryButton>
        <PrimaryButton type="submit" size="md" :loading="saving" :disabled="saving">
          <span>Simpan Saldo Cash</span>
        </PrimaryButton>
      </div>
    </form>
  </BottomSheet>
</template>
