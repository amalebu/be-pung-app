<script setup>
import { computed } from 'vue'
import { WifiOff, Wifi, Refresh, CheckCircle } from '@iconoir/vue'
import { useNetworkStore } from '@/stores/networkStore'

const networkStore = useNetworkStore()

const isVisible = computed(() => {
  return !networkStore.isOnline || networkStore.showBackOnlineToast || networkStore.isSyncing
})

const isOfflineMode = computed(() => !networkStore.isOnline)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-250 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-x-0 bottom-14 md:bottom-0 z-[90] pointer-events-none"
      >
        <!-- YouTube-Style Full-Width Slim Status Bar -->
        <div
          class="pointer-events-auto w-full px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 shadow-lg transition-colors duration-300"
          :class="
            isOfflineMode
              ? 'bg-zinc-900 dark:bg-zinc-800 text-zinc-100 border-t border-zinc-700'
              : 'bg-emerald-600 text-white'
          "
        >
          <!-- Offline State -->
          <template v-if="isOfflineMode">
            <WifiOff class="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Tidak ada koneksi internet • Mode Offline aktif</span>
            <span
              v-if="networkStore.pendingCount > 0"
              class="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold tabular-nums"
            >
              {{ networkStore.pendingCount }} perubahan tersimpan lokal
            </span>
          </template>

          <!-- Back Online & Syncing State (YouTube Green Bar) -->
          <template v-else>
            <Refresh
              v-if="networkStore.isSyncing"
              class="w-3.5 h-3.5 animate-spin shrink-0"
            />
            <CheckCircle
              v-else
              class="w-3.5 h-3.5 shrink-0"
            />
            <span class="font-semibold">You are back online</span>
            <span class="opacity-90 hidden sm:inline">•</span>
            <span class="opacity-95 truncate">{{ networkStore.backOnlineSubtext }}</span>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
