<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useFinanceStore } from '@/stores/financeStore'
import FinanceDesktopTabs from '@/components/modules/finance/FinanceDesktopTabs.vue'
import FinancePeriodBar from '@/components/modules/finance/FinancePeriodBar.vue'
import FinanceTransactionSheet from '@/components/modules/finance/FinanceTransactionSheet.vue'

const financeStore = useFinanceStore()
const route = useRoute()

const showPeriodBar = computed(() => {
  const periodRoutes = ['finance-summary', 'finance-statistics', 'finance-budgeting']
  return periodRoutes.includes(route.name)
})

onMounted(async () => {
  await Promise.all([
    financeStore.fetchPeriods(),
    financeStore.fetchSummary(),
    financeStore.fetchWallets(),
    financeStore.fetchCategories(),
    financeStore.fetchBudgets(),
    financeStore.fetchPlannedPayments(),
    financeStore.fetchStatistics(),
    financeStore.fetchTransactions({ per_page: 200 }),
  ])
})
</script>

<template>
  <div class="space-y-4 sm:space-y-5 pb-24 md:pb-12">
    <!-- Desktop Persistent Tabs -->
    <FinanceDesktopTabs />

    <!-- Period Bar Navigation -->
    <FinancePeriodBar v-if="showPeriodBar" />

    <!-- Sub-Menu View -->
    <router-view v-slot="{ Component }">
      <transition name="fade-subnav" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- Global Transaction Bottom Sheet Modal -->
    <FinanceTransactionSheet />
  </div>
</template>

<style scoped>
.fade-subnav-enter-active,
.fade-subnav-leave-active {
  transition: opacity 150ms ease;
}
.fade-subnav-enter-from,
.fade-subnav-leave-to {
  opacity: 0;
}
</style>
