<script setup>
import { Xmark } from '@iconoir/vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
        @click="emit('close')"
      />
    </Transition>

    <!-- Sheet Panel -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
      enter-to-class="translate-y-0 md:opacity-100 md:scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 md:opacity-100 md:scale-100"
      leave-to-class="translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
    >
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center p-0 md:p-4 pointer-events-none"
      >
        <div
          class="pointer-events-auto w-full md:max-w-lg bg-white dark:bg-zinc-900 border-t md:border border-pod-sage/10 dark:border-zinc-800 rounded-t-pod-lg md:rounded-pod-lg shadow-floating overflow-hidden pb-safe max-h-[90vh] flex flex-col"
        >
          <!-- Drag Handle Indicator on Mobile -->
          <div class="md:hidden flex justify-center pt-3 pb-1">
            <div class="w-12 h-1.5 rounded-md bg-outline-variant dark:bg-zinc-700" />
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-zinc-800">
            <BaseHeading as="h3" size="md" weight="semibold">
              {{ title }}
            </BaseHeading>

            <button
              type="button"
              @click="emit('close')"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Xmark class="w-4 h-4" />
            </button>
          </div>

          <!-- Body Content -->
          <div class="p-5 overflow-y-auto">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
