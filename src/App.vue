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
    <div class="min-h-screen bg-surface dark:bg-zinc-950 text-on-surface dark:text-zinc-100 antialiased">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </div>
  </IconoirProvider>
</template>
