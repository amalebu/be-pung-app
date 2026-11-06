<script setup>
import { onMounted } from 'vue'
import { IconoirProvider } from '@iconoir/vue'
import { useTheme } from '@/composables/useTheme'
import { useAppLock } from '@/composables/useAppLock'
import { useNetworkStore } from '@/stores/networkStore'
import PwaInstallPrompt from '@/components/ui/PwaInstallPrompt.vue'
import NetworkStatusToast from '@/components/ui/NetworkStatusToast.vue'

const { initTheme } = useTheme()
const networkStore = useNetworkStore()
useAppLock()

onMounted(() => {
  initTheme()
  networkStore.initNetworkWatcher()
})
</script>

<template>
  <IconoirProvider>
    <PwaInstallPrompt />
    <NetworkStatusToast />
    <router-view />
  </IconoirProvider>
</template>
