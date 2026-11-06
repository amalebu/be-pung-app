<script setup>
import { ref, watch } from 'vue'
import PinBoxes from '@/components/ui/PinBoxes.vue'
import PinNumpad from '@/components/ui/PinNumpad.vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Masukan PIN',
  },
  subtitle: {
    type: String,
    default: '',
  },
  errorMessage: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['complete', 'clear-error'])

const pin = ref('')

function handleDigit(num) {
  if (props.loading || pin.value.length >= 6) return
  if (props.errorMessage) {
    emit('clear-error')
  }
  pin.value += num
  if (pin.value.length === 6) {
    const completedPin = pin.value
    setTimeout(() => {
      emit('complete', completedPin)
    }, 120)
  }
}

function handleBackspace() {
  if (props.loading || pin.value.length === 0) return
  if (props.errorMessage) {
    emit('clear-error')
  }
  pin.value = pin.value.slice(0, -1)
}

function resetPin() {
  pin.value = ''
}

watch(
  () => props.errorMessage,
  (newErr) => {
    if (newErr) {
      setTimeout(() => {
        pin.value = ''
      }, 350)
    }
  }
)

defineExpose({ resetPin })
</script>

<template>
  <div class="flex-1 flex flex-col justify-between w-full max-w-sm mx-auto select-none items-center py-2">
    <!-- Top: Title, Subtitle, & PIN Boxes (Tanpa Logo / Icon) -->
    <div class="w-full flex flex-col items-center text-center pt-2">
      <div class="flex flex-col items-center text-center gap-1">
        <h1 class="text-[28px] leading-tight text-slate-900 dark:text-zinc-100 tracking-tight font-medium">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mt-1 max-w-xs">
          {{ subtitle }}
        </p>
      </div>

      <!-- 6-Digit Pod Tactile Cells -->
      <PinBoxes
        :value="pin"
        :length="6"
        :error="Boolean(errorMessage)"
        :loading="loading"
      />

      <!-- Helper / Error Message Container -->
      <div class="min-h-[24px] px-4 text-center">
        <p
          v-if="errorMessage"
          class="text-xs font-semibold text-rose-600 dark:text-rose-400"
        >
          {{ errorMessage }}
        </p>
        <p v-else-if="loading" class="text-xs text-slate-500 dark:text-zinc-400">
          Memvalidasi PIN...
        </p>
        <slot name="below-pin" />
      </div>
    </div>

    <!-- Bottom: Virtual Tactile Numpad Grid -->
    <div class="w-full pb-[calc(env(safe-area-inset-bottom,0px)+3rem)] flex flex-col items-center gap-4 mt-auto pt-2">
      <PinNumpad
        :disabled="loading"
        @digit="handleDigit"
        @backspace="handleBackspace"
      >
        <template #bottom-left>
          <slot name="bottom-left" />
        </template>
      </PinNumpad>

      <slot name="footer" />
    </div>
  </div>
</template>
