<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IconoirProvider } from '@iconoir/vue'
import { useTheme } from '@/composables/useTheme'
import { useAppLock } from '@/composables/useAppLock'
import { useNetworkStore } from '@/stores/networkStore'
import PwaInstallPrompt from '@/components/ui/PwaInstallPrompt.vue'
import NetworkStatusToast from '@/components/ui/NetworkStatusToast.vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppPinModal from '@/components/layout/AppPinModal.vue'

const { initTheme } = useTheme()
const networkStore = useNetworkStore()
const route = useRoute()
useAppLock()

const isAppRoute = computed(() => {
  return !route.meta?.guestOnly
})

onMounted(() => {
  initTheme()
  networkStore.initNetworkWatcher()
})
</script>

<template>
  <IconoirProvider>
    <PwaInstallPrompt />
    <NetworkStatusToast />

    <!-- 1. Master Shell Layout (Header & Sidenav Fixed, Mount Sekali) -->
    <AppShell v-if="isAppRoute">
      <router-view v-slot="{ Component, route: currentRoute }">
        <Transition name="page-left" mode="out-in">
          <component :is="Component" :key="currentRoute.name" />
        </Transition>
      </router-view>
    </AppShell>

    <!-- 2. Auth / Non-Shell Layout (Login & Verify PIN via AuthShell) -->
    <div
      v-else
      class="min-h-screen bg-surface dark:bg-zinc-950 text-on-surface dark:text-zinc-100 antialiased overflow-x-hidden"
    >
      <router-view v-slot="{ Component, route: currentRoute }">
        <Transition name="page-left" mode="out-in">
          <component :is="Component" :key="currentRoute.name" />
        </Transition>
      </router-view>
    </div>

    <!-- 3. Global PIN Lock Modal (Pop-up Overlay with Backdrop Blur) -->
    <AppPinModal />
  </IconoirProvider>
</template>
