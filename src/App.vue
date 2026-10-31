<script setup>
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAppLock } from '@/composables/useAppLock'
import { useNetworkStore } from '@/stores/networkStore'
import PwaInstallPrompt from '@/components/ui/PwaInstallPrompt.vue'
import NetworkStatusToast from '@/components/ui/NetworkStatusToast.vue'
import AppPinLockOverlay from '@/components/layout/AppPinLockOverlay.vue'

const { initTheme } = useTheme()
const networkStore = useNetworkStore()
useAppLock()

onMounted(() => {
  initTheme()
  networkStore.initNetworkWatcher()
})
</script>

<template>
  <PwaInstallPrompt />
  <NetworkStatusToast />
  <AppPinLockOverlay />
  <router-view />
</template>
