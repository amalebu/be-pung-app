<script setup>
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-vue-next'
import { useNetworkStore } from '@/stores/networkStore'

const networkStore = useNetworkStore()

function handleManualSync() {
  if (networkStore.isOnline && networkStore.pendingCount > 0) {
    networkStore.syncPendingQueue()
  }
}
</script>

<template>
  <!-- State 1: Offline -->
  <div
    v-if="!networkStore.isOnline"
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 tabular-nums"
    title="Mode Offline Aktif — Data disimpan di IndexedDB browser"
  >
    <WifiOff class="w-3.5 h-3.5 text-amber-500 shrink-0" />
    <span>Offline</span>
    <span
      v-if="networkStore.pendingCount > 0"
      class="px-1.5 py-0.2 rounded-md bg-amber-500 text-white text-[10px] font-bold"
    >
      {{ networkStore.pendingCount }}
    </span>
  </div>

  <!-- State 2: Syncing -->
  <div
    v-else-if="networkStore.isSyncing"
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 tabular-nums"
  >
    <RefreshCw class="w-3.5 h-3.5 animate-spin shrink-0" />
    <span class="hidden sm:inline">Menyinkronkan...</span>
  </div>

  <!-- State 3: Online with Pending Queue -->
  <button
    v-else-if="networkStore.pendingCount > 0"
    type="button"
    @click="handleManualSync"
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100 cursor-pointer tabular-nums"
    title="Klik untuk sinkronkan sekarang"
  >
    <CloudUpload class="w-3.5 h-3.5 shrink-0" />
    <span>Sync ({{ networkStore.pendingCount }})</span>
  </button>

  <!-- State 4: Online & Fully Synced -->
  <div
    v-else
    class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40"
    title="Data tersimpan di perangkat & tersinkronisasi dengan server"
  >
    <CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
    <span class="hidden md:inline text-[11px]">Tersinkron</span>
  </div>
</template>
