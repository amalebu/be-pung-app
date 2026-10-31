<script setup>
import { onMounted, onUnmounted } from 'vue'
import { Delete } from 'lucide-vue-next'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['digit', 'backspace'])

const rows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
]

const keyClass =
  'h-16 w-16 mx-auto rounded-md flex items-center justify-center text-2xl font-medium tabular-nums text-pod-carbon dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-pod-sage/10 dark:border-zinc-700/60 shadow-surface hover:shadow-floating active:scale-95 active:shadow-well active:bg-pod-lime active:text-pod-carbon dark:active:bg-pod-lime dark:active:text-pod-carbon transition-all duration-100 cursor-pointer disabled:opacity-40 disabled:pointer-events-none'

function pressDigit(num) {
  if (props.disabled) return
  emit('digit', num)
}

function pressBackspace() {
  if (props.disabled) return
  emit('backspace')
}

function handleKeydown(event) {
  if (props.disabled) return
  if (/^[0-9]$/.test(event.key)) {
    event.preventDefault()
    emit('digit', event.key)
  } else if (event.key === 'Backspace') {
    event.preventDefault()
    emit('backspace')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="w-full max-w-[300px] mx-auto select-none">
    <div class="grid grid-cols-3 gap-y-3 gap-x-5">
      <template v-for="(row, rIdx) in rows" :key="rIdx">
        <button
          v-for="num in row"
          :key="num"
          type="button"
          :disabled="disabled"
          @click="pressDigit(num)"
          :class="keyClass"
        >
          {{ num }}
        </button>
      </template>

      <!-- Bottom Left Slot (e.g. Cancel / Logout / Empty) -->
      <div class="h-16 w-16 mx-auto flex items-center justify-center">
        <slot name="bottom-left" />
      </div>

      <!-- Digit 0 -->
      <button
        type="button"
        :disabled="disabled"
        @click="pressDigit('0')"
        :class="keyClass"
      >
        0
      </button>

      <!-- Backspace Button -->
      <button
        type="button"
        :disabled="disabled"
        @click="pressBackspace"
        aria-label="Hapus angka"
        class="h-16 w-16 mx-auto rounded-md flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-pod-well dark:hover:bg-zinc-800 active:scale-90 active:bg-pod-well transition-all duration-100 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
      >
        <Delete class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>
