<script setup>
import { computed } from 'vue'
import { Wifi, WifiOff } from '@iconoir/vue'
import { useNetworkStore } from '@/stores/networkStore'

const networkStore = useNetworkStore()

const isVisible = computed(() => networkStore.topToast.show)
const isOffline = computed(() => networkStore.topToast.type === 'offline')
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed top-0 inset-x-0 h-7 z-[60] flex items-center justify-center px-4 text-xs font-semibold shadow-xs select-none pointer-events-none"
        :class="
          isOffline
            ? 'bg-rose-600 text-white dark:bg-rose-700'
            : 'bg-emerald-600 text-white dark:bg-emerald-700'
        "
      >
        <div class="flex items-center gap-1.5 text-[11px] tracking-wide">
          <WifiOff v-if="isOffline" class="w-3.5 h-3.5 shrink-0" />
          <Wifi v-else class="w-3.5 h-3.5 shrink-0" />
          <span>{{ networkStore.topToast.message }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
