<script setup>
import { ref, watch } from 'vue'
import { ShieldCheck } from 'lucide-vue-next'
import PinBoxes from '@/components/ui/PinBoxes.vue'
import PinNumpad from '@/components/ui/PinNumpad.vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Masukkan PIN Anda',
  },
  subtitle: {
    type: String,
    default: 'Masukkan 6 digit PIN keamanan akun Anda',
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
  <div class="flex-1 flex flex-col justify-between w-full py-2">
    <!-- Top Info & PIN Boxes -->
    <div class="text-center space-y-5 pt-4">
      <div
        class="w-12 h-12 rounded-md bg-pod-sage text-white flex items-center justify-center mx-auto shadow-floating"
      >
        <ShieldCheck class="w-6 h-6" />
      </div>

      <div class="space-y-2 px-2">
        <h1
          class="text-[28px] leading-9 font-normal tracking-[-0.02em] text-slate-900 dark:text-zinc-100"
        >
          {{ title }}
        </h1>
        <p class="text-sm leading-relaxed text-slate-500 dark:text-zinc-400 italic">
          {{ subtitle }}
        </p>
      </div>

      <PinBoxes
        :value="pin"
        :length="6"
        :error="Boolean(errorMessage)"
        :loading="loading"
      />

      <div class="min-h-[24px] px-4">
        <p
          v-if="errorMessage"
          class="text-xs font-medium text-error dark:text-rose-300"
        >
          {{ errorMessage }}
        </p>
        <p v-else-if="loading" class="text-xs text-slate-500 dark:text-zinc-400">
          Memverifikasi PIN...
        </p>
      </div>
    </div>

    <!-- Bottom On-Screen Numpad (keyboard virtual) -->
    <div class="pb-2 space-y-4">
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
