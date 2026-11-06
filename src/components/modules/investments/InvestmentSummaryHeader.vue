<script setup>
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, StatsReport, CheckCircle, Eye, EyeClosed } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import { formatRupiah, formatCompactRupiah, formatPercent } from '@/utils/currencyUtils'

defineProps({
  summary: {
    type: Object,
    required: true,
  },
  isMasked: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open-cash', 'open-buy', 'toggle-privacy'])

function plColorClass(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (num < 0) return 'text-[#ba1a1a] dark:text-rose-400'
  return 'text-slate-600 dark:text-zinc-400'
}
</script>

<template>
  <div class="space-y-3.5">
    <!-- Top Banner: Total Portfolio + Cash RDN Card -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
      <!-- Total Nilai Portofolio (Saham + Cash) -->
      <BaseCard
        padding="p-5 sm:p-6"
        class="lg:col-span-7 relative overflow-hidden bg-gradient-to-br from-[#144229] to-[#0d2e1c] text-white border-none shadow-floating"
      >
        <div class="relative z-10 flex flex-col justify-between h-full space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-[#d3e4d8] tracking-wide uppercase">
                  <StatsReport class="w-3.5 h-3.5" />
                  Total Nilai Portofolio
                </span>

                <!-- Eye Privacy Toggle Button -->
                <button
                  type="button"
                  @click="emit('toggle-privacy')"
                  class="w-7 h-7 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 text-[#d3e4d8] hover:text-white transition-all cursor-pointer shadow-2xs"
                  :title="isMasked ? 'Tampilkan Nominal Saldo' : 'Sembunyikan Nominal Saldo'"
                >
                  <component :is="isMasked ? EyeClosed : Eye" class="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
              </div>

              <p class="mt-2.5 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-white">
                {{ isMasked ? 'Rp ****' : formatRupiah(summary.total_portfolio_value) }}
              </p>
              <p class="text-xs text-[#d3e4d8]/85 mt-1 tabular-nums">
                Modal Saham: {{ isMasked ? 'Rp ****' : formatRupiah(summary.stock_cost_basis) }} · {{ summary.active_tickers_count || 0 }} Emiten ({{ summary.total_open_lots || 0 }} Lot)
              </p>
            </div>

            <PrimaryButton
              size="sm"
              class="!bg-[#d3e4d8] !text-[#144229] hover:!bg-white font-bold shadow-xs shrink-0"
              @click="emit('open-buy')"
            >
              <Plus class="w-4 h-4 stroke-[2.5]" />
              <span>Beli Saham</span>
            </PrimaryButton>
          </div>

          <!-- P/L Summary Pills inside Hero -->
          <div class="grid grid-cols-3 gap-2 pt-3 border-t border-white/15">
            <div>
              <span class="text-[11px] text-[#d3e4d8]/80 block">Nilai Pasar Saham</span>
              <span class="text-xs sm:text-sm font-bold tabular-nums text-white">
                {{ isMasked ? '****' : formatCompactRupiah(summary.stock_market_value) }}
              </span>
            </div>
            <div>
              <span class="text-[11px] text-[#d3e4d8]/80 block">P/L Harian</span>
              <span
                class="text-xs sm:text-sm font-bold tabular-nums"
                :class="
                  isMasked
                    ? 'text-white'
                    : Number(summary.daily_pl) > 0
                      ? 'text-emerald-300'
                      : Number(summary.daily_pl) < 0
                        ? 'text-rose-300'
                        : 'text-white'
                "
              >
                {{ isMasked ? '****' : formatCompactRupiah(summary.daily_pl, { withSign: true }) }}
              </span>
            </div>
            <div>
              <span class="text-[11px] text-[#d3e4d8]/80 block">P/L Bersih (Unrealized)</span>
              <span
                class="text-xs sm:text-sm font-bold tabular-nums"
                :class="
                  isMasked
                    ? 'text-white'
                    : Number(summary.unrealized_pl) > 0
                      ? 'text-emerald-300'
                      : Number(summary.unrealized_pl) < 0
                        ? 'text-rose-300'
                        : 'text-white'
                "
              >
                {{ isMasked ? '****' : `${formatCompactRupiah(summary.unrealized_pl, { withSign: true })} (${formatPercent(summary.unrealized_pl_percent)})` }}
              </span>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Posisi Cash (RDN / Dana Investasi Mengendap) -->
      <BaseCard padding="p-5 sm:p-6" class="lg:col-span-5 flex flex-col justify-between space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
              :class="
                Number(summary.cash_balance) < 0
                  ? 'bg-rose-100 text-[#ba1a1a] dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-[#d3e4d8]/70 dark:bg-[#2d5a3f]/50 text-[#144229] dark:text-[#a1d2af]'
              "
            >
              <Wallet class="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <BaseText size="xs" variant="muted" weight="semibold" class="uppercase tracking-wider">
                  Cash Investasi (RDN)
                </BaseText>
                <button
                  type="button"
                  @click="emit('toggle-privacy')"
                  class="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  :title="isMasked ? 'Tampilkan Nominal Saldo' : 'Sembunyikan Nominal Saldo'"
                >
                  <component :is="isMasked ? EyeClosed : Eye" class="w-3.5 h-3.5 stroke-[2]" />
                </button>
              </div>
              <BaseHeading
                as="p"
                size="xl"
                weight="bold"
                tabular
                class="mt-0.5"
                :class="
                  isMasked
                    ? ''
                    : Number(summary.cash_balance) < 0
                      ? 'text-[#ba1a1a] dark:text-rose-400 font-extrabold'
                      : 'text-slate-900 dark:text-zinc-100'
                "
              >
                {{ isMasked ? 'Rp ****' : formatRupiah(summary.cash_balance) }}
              </BaseHeading>
            </div>
          </div>

          <span
            class="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight transition-colors"
            :class="
              Number(summary.cash_balance) < 0
                ? 'bg-rose-100 text-[#ba1a1a] dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60'
                : 'bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
            "
          >
            {{ Number(summary.cash_balance) < 0 ? 'Minus / Defisit' : 'Siap Beli' }}
          </span>
        </div>

        <BaseText size="xs" variant="muted">
          <template v-if="Number(summary.cash_balance) < 0">
            <span class="text-[#ba1a1a] dark:text-rose-400 font-medium">
              Saldo kas saat ini sedang minus/defisit. Anda dapat melakukan Top-Up Cash untuk memulihkan saldo kas.
            </span>
          </template>
          <template v-else>
            Dana kas portofolio yang belum menjadi saham. Otomatis terpotong saat beli saham & bertambah saat tutup posisi.
          </template>
        </BaseText>

        <div class="flex items-center gap-2 pt-1">
          <PrimaryButton
            size="sm"
            class="flex-1 justify-center"
            @click="emit('open-cash', 'topup')"
          >
            <ArrowDownRight class="w-4 h-4" />
            <span>Top-Up Cash</span>
          </PrimaryButton>

          <SecondaryButton
            size="sm"
            class="flex-1 justify-center"
            @click="emit('open-cash', 'withdraw')"
          >
            <ArrowUpRight class="w-4 h-4" />
            <span>Tarik / Atur</span>
          </SecondaryButton>
        </div>
      </BaseCard>
    </div>

    <!-- 4 Mini Metric Cards Row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
      <BaseCard padding="p-3.5 sm:p-4">
        <BaseText size="xs" variant="muted" weight="medium">Nilai Pasar Saham</BaseText>
        <p class="mt-1 text-base sm:text-lg font-bold tabular-nums text-slate-900 dark:text-zinc-100">
          {{ isMasked ? 'Rp ****' : formatRupiah(summary.stock_market_value) }}
        </p>
      </BaseCard>

      <BaseCard padding="p-3.5 sm:p-4">
        <BaseText size="xs" variant="muted" weight="medium">P/L Harian</BaseText>
        <p
          class="mt-1 text-base sm:text-lg font-bold tabular-nums"
          :class="isMasked ? 'text-slate-600 dark:text-zinc-400' : plColorClass(summary.daily_pl)"
        >
          {{ isMasked ? '****' : formatRupiah(summary.daily_pl, { withSign: true }) }}
        </p>
      </BaseCard>

      <BaseCard padding="p-3.5 sm:p-4">
        <BaseText size="xs" variant="muted" weight="medium">P/L Bersih Aktif</BaseText>
        <p
          class="mt-1 text-base sm:text-lg font-bold tabular-nums"
          :class="isMasked ? 'text-slate-600 dark:text-zinc-400' : plColorClass(summary.unrealized_pl)"
        >
          <template v-if="isMasked">****</template>
          <template v-else>
            {{ formatRupiah(summary.unrealized_pl, { withSign: true }) }}
            <span class="text-xs font-semibold ml-0.5">({{ formatPercent(summary.unrealized_pl_percent) }})</span>
          </template>
        </p>
      </BaseCard>

      <BaseCard padding="p-3.5 sm:p-4">
        <div class="flex items-center justify-between">
          <BaseText size="xs" variant="muted" weight="medium">Realized P/L (Jual)</BaseText>
          <CheckCircle class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p
          class="mt-1 text-base sm:text-lg font-bold tabular-nums"
          :class="isMasked ? 'text-slate-600 dark:text-zinc-400' : plColorClass(summary.realized_pl)"
        >
          {{ isMasked ? '****' : formatRupiah(summary.realized_pl, { withSign: true }) }}
        </p>
      </BaseCard>
    </div>
  </div>
</template>
