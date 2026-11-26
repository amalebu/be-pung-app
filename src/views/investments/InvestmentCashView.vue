<script setup>
import { onMounted } from 'vue'
import {
  Wallet,
  Plus,
  RefreshDouble,
  ArrowUpRight,
  ArrowDownRight,
} from '@iconoir/vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import InvestmentCashSheet from '@/components/modules/investments/InvestmentCashSheet.vue'
import { useInvestmentStore } from '@/stores/investmentStore'
import { formatRupiah } from '@/utils/currencyUtils'

const investmentStore = useInvestmentStore()

function plColor(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (num < 0) return 'text-[#ba1a1a] dark:text-rose-400'
  return 'text-slate-600 dark:text-zinc-400'
}

function formatMutationType(type) {
  switch (type) {
    case 'fee': return 'Fee Materai'
    case 'buy_stock': return 'Beli Saham'
    case 'sell_stock': return 'Jual Saham'
    case 'topup': return 'Top-Up'
    case 'withdraw': return 'Tarik Saldo'
    case 'adjustment': return 'Koreksi'
    default: return type
  }
}

function mutationBadgeVariant(m) {
  if (m.type === 'fee') return 'amber'
  return m.amount >= 0 ? 'emerald' : 'rose'
}

async function handleConfirmCashAdjustment(payload) {
  await investmentStore.submitCashAdjustment(payload)
}

onMounted(() => {
  if (!investmentStore.summary?.cash_balance) {
    investmentStore.fetchPortfolio(false)
  }
})
</script>

<template>
  <div class="space-y-4 md:space-y-5">
    <!-- Header Halaman Desktop & Mobile -->
    <div class="flex items-center justify-between">
      <div>
        <BaseHeading as="h2" size="xl" weight="semibold">Cash RDN</BaseHeading>
        <BaseText size="sm" variant="muted" class="mt-0.5">
          Kelola saldo kas untuk transaksi saham, pantau mutasi deposit, penarikan, dan perolehan jual beli.
        </BaseText>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="investmentStore.openCashSheet('topup')"
          class="h-9 px-4 rounded-full flex items-center gap-1.5 bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold hover:bg-[#1f5637] transition-colors cursor-pointer shadow-2xs"
        >
          <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Kelola Kas RDN</span>
        </button>
      </div>
    </div>

    <!-- 3 Kartu Metrik Ringkas Kas RDN -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <BaseCard padding="p-4" class="flex flex-col justify-between shadow-xs">
        <span class="text-xs font-semibold text-slate-500 dark:text-zinc-400">Saldo Kas Tersedia</span>
        <div class="mt-2 text-xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-zinc-100">
          <span v-if="investmentStore.isBalanceMasked">••••••••</span>
          <span v-else>{{ formatRupiah(investmentStore.summary?.cash_balance || 0) }}</span>
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="flex flex-col justify-between shadow-xs">
        <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Top-Up / Deposit</span>
        <div class="mt-2 text-xl font-extrabold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
          <span v-if="investmentStore.isBalanceMasked">••••••••</span>
          <span v-else>{{ formatRupiah(investmentStore.cash?.total_topup || 0) }}</span>
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="flex flex-col justify-between shadow-xs">
        <span class="text-xs font-semibold text-[#ba1a1a] dark:text-rose-400">Total Penarikan Kas</span>
        <div class="mt-2 text-xl font-extrabold tracking-tight tabular-nums text-[#ba1a1a] dark:text-rose-400">
          <span v-if="investmentStore.isBalanceMasked">••••••••</span>
          <span v-else>{{ formatRupiah(investmentStore.cash?.total_withdrawn || 0) }}</span>
        </div>
      </BaseCard>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="investmentStore.loading && (!investmentStore.cash?.mutations || investmentStore.cash.mutations.length === 0)"
      class="space-y-3"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="h-16 rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
      />
    </div>

    <!-- State Kosong Mutasi Kas -->
    <BaseCard
      v-else-if="!investmentStore.cash?.mutations || investmentStore.cash.mutations.length === 0"
      padding="p-8"
      class="text-center"
    >
      <Wallet class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
      <BaseHeading as="h3" size="md" weight="semibold">Belum ada mutasi Cash RDN</BaseHeading>
      <BaseText size="xs" variant="muted" class="mt-1 max-w-sm mx-auto">
        Top-up saldo awal atau mutasi pembelian/penjualan saham akan otomatis tercatat dan muncul di sini.
      </BaseText>
      <div class="mt-4">
        <button
          type="button"
          @click="investmentStore.openCashSheet('topup')"
          class="h-8 px-4 rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          + Top-Up Saldo RDN Pertama
        </button>
      </div>
    </BaseCard>

    <template v-else>
      <!-- MOBILE VIEW: MUTASI KAS RDN -->
      <BaseCard padding="p-0" class="md:hidden overflow-hidden shadow-xs">
        <TransitionGroup
          tag="div"
          name="fade"
          class="divide-y divide-slate-200/70 dark:divide-zinc-800"
        >
          <div
            v-for="m in investmentStore.cash.mutations"
            :key="m.id"
            class="flex items-center gap-3 px-3.5 py-3"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <BaseBadge :variant="mutationBadgeVariant(m)" size="xs">
                  {{ formatMutationType(m.type) }}
                </BaseBadge>
                <span class="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
                  {{ m.transacted_at }}
                </span>
              </div>
              <p
                v-if="m.description"
                class="mt-1 text-xs text-slate-700 dark:text-zinc-300 truncate"
              >
                {{ m.description }}
              </p>
            </div>
            <div class="text-right text-xs tabular-nums shrink-0">
              <div class="font-extrabold" :class="plColor(m.amount)">
                {{ formatRupiah(m.amount, { withSign: true }) }}
              </div>
              <div
                class="text-[11px]"
                :class="Number(m.balance_after) < 0 ? 'text-[#ba1a1a] dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-zinc-400'"
              >
                Saldo {{ formatRupiah(m.balance_after) }}
              </div>
            </div>
          </div>
        </TransitionGroup>
      </BaseCard>

      <!-- DESKTOP VIEW: TABEL MUTASI KAS RDN -->
      <BaseCard padding="p-0" class="hidden md:block overflow-hidden shadow-2xs">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-zinc-800 bg-[#f3f3f6]/60 dark:bg-zinc-800/50 text-[11px] font-bold text-slate-600 dark:text-zinc-400">
              <th class="py-3 px-4">Tanggal Transaksi</th>
              <th class="py-3 px-4">Jenis Mutasi</th>
              <th class="py-3 px-4">Keterangan</th>
              <th class="py-3 px-4 text-right">Nominal Arus Kas</th>
              <th class="py-3 px-4 text-right">Saldo Kas Akhir</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200/70 dark:divide-zinc-800 text-xs tabular-nums">
            <tr
              v-for="m in investmentStore.cash.mutations"
              :key="m.id"
              class="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <td class="py-3 px-4 text-slate-600 dark:text-zinc-300">{{ m.transacted_at }}</td>
              <td class="py-3 px-4">
                <BaseBadge :variant="mutationBadgeVariant(m)" size="xs">
                  {{ formatMutationType(m.type) }}
                </BaseBadge>
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-zinc-300">
                {{ m.description || '-' }}
              </td>
              <td class="py-3 px-4 text-right font-extrabold" :class="plColor(m.amount)">
                {{ formatRupiah(m.amount, { withSign: true }) }}
              </td>
              <td
                class="py-3 px-4 text-right font-semibold"
                :class="Number(m.balance_after) < 0 ? 'text-[#ba1a1a] dark:text-rose-400 font-bold' : 'text-slate-800 dark:text-zinc-200'"
              >
                {{ formatRupiah(m.balance_after) }}
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </template>

    <!-- Modal Bottom Sheet: Kelola Kas RDN -->
    <InvestmentCashSheet
      :show="investmentStore.isCashSheetOpen"
      :initial-mode="investmentStore.initialCashMode"
      :current-balance="investmentStore.summary?.cash_balance || 0"
      @close="investmentStore.closeCashSheet()"
      @confirm="handleConfirmCashAdjustment"
    />
  </div>
</template>