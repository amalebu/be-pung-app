<script setup>
import { onMounted } from 'vue'
import InvestmentDesktopTabs from '@/components/modules/investments/InvestmentDesktopTabs.vue'
import { useInvestmentStore } from '@/stores/investmentStore'

const investmentStore = useInvestmentStore()

onMounted(() => {
  investmentStore.fetchPortfolio(false)
})
</script>

<template>
  <div class="space-y-4 md:space-y-5">
    <!-- Desktop Top Underline Tabs: Dimuat persis 1 kali di level Menu, tidak pernah di-reload saat pindah sub-menu -->
    <InvestmentDesktopTabs />

    <!-- Area Konten Sub-Menu (Saham & Riwayat): Transisi fade halus 150ms tanpa swipe -->
    <router-view v-slot="{ Component }">
      <Transition name="submenu-fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
  </div>
</template>

<style scoped>
.submenu-fade-enter-active,
.submenu-fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.submenu-fade-enter-from,
.submenu-fade-leave-to {
  opacity: 0;
}
</style>
