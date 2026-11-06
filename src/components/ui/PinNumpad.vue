<script setup>
import { onMounted, onUnmounted } from 'vue'
import { Erase } from '@iconoir/vue'

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
  'h-14 w-full rounded-2xl bg-white dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-slate-50 dark:hover:bg-zinc-700/70 active:scale-95 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none'

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
  <div class="w-full max-w-[320px] mx-auto select-none">
    <div class="grid grid-cols-3 gap-3">
      <template v-for="(row, rIdx) in rows" :key="rIdx">
        <button
          v-for="num in row"
          :key="num"
          type="button"
          :disabled="disabled"
          @click="pressDigit(num)"
          :class="keyClass"
        >
          <span class="text-[24px] font-semibold text-slate-900 dark:text-zinc-100 leading-none tabular-nums">
            {{ num }}
          </span>
        </button>
      </template>

      <!-- Bottom Row Left: Slot (e.g. Biometric / Empty Spacer) -->
      <div class="h-14 flex items-center justify-center">
        <slot name="bottom-left" />
      </div>

      <!-- Bottom Row Center: Digit 0 -->
      <button
        type="button"
        :disabled="disabled"
        @click="pressDigit('0')"
        :class="keyClass"
      >
        <span class="text-[24px] font-semibold text-slate-900 dark:text-zinc-100 leading-none tabular-nums">
          0
        </span>
      </button>

      <!-- Bottom Row Right: Backspace / Delete -->
      <button
        type="button"
        :disabled="disabled"
        @click="pressBackspace"
        aria-label="Hapus angka"
        class="h-14 w-full rounded-2xl bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 flex items-center justify-center text-slate-600 dark:text-zinc-400 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none"
      >
        <Erase class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>
