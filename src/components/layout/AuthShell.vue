<script setup>
import { useKeyboardAwareBottom } from '@/composables/useKeyboardAwareBottom'

defineProps({
  keyboardAware: {
    type: Boolean,
    default: false,
  },
})

const { keyboardOffset } = useKeyboardAwareBottom()
</script>

<template>
  <!-- Mobile: layar penuh putih murni agar menyatu dengan status bar. Desktop: kanvas netral dengan kartu pod di tengah. -->
  <div
    class="min-h-dvh md:h-dvh w-full flex md:items-center md:justify-center bg-white md:bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 md:p-6 select-none"
  >
    <div
      class="relative w-full md:max-w-md h-dvh md:h-[90vh] md:min-h-[600px] md:max-h-[720px] flex flex-col overflow-hidden px-4 md:bg-white md:dark:bg-zinc-900 md:rounded-pod-lg md:shadow-surface md:border md:border-pod-sage md:dark:border-zinc-800"
    >
      <div v-if="$slots.header" class="pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] shrink-0">
        <slot name="header" />
      </div>

      <div
        class="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar"
        :class="{ 'pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]': !$slots.header }"
      >
        <slot />
      </div>

      <div
        v-if="$slots.footer"
        class="shrink-0 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] transition-transform duration-200 ease-out"
        :style="
          keyboardAware && keyboardOffset
            ? { transform: `translateY(-${keyboardOffset}px)` }
            : null
        "
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
