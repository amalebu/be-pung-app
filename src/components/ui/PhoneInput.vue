<script setup>
import BaseText from '@/components/ui/BaseText.vue'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Masukkan Nomor Ponsel Anda',
  },
  placeholder: {
    type: String,
    default: '81234567890',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: [String, Array],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

function handleInput(event) {
  let raw = event.target.value.replace(/[^0-9]/g, '')

  // Normalisasi otomatis jika pengguna mengetik 08... atau 628...
  if (raw.startsWith('62')) {
    raw = raw.slice(2)
  }
  while (raw.startsWith('0')) {
    raw = raw.slice(1)
  }

  raw = raw.slice(0, 13)
  event.target.value = raw
  emit('update:modelValue', raw)
}
</script>

<template>
  <div class="space-y-2.5">
    <label
      v-if="label"
      for="phone-input"
      class="block text-xs font-medium text-slate-500 dark:text-zinc-400 px-1"
    >
      {{ label }}
    </label>

    <div class="flex items-stretch gap-2.5">
      <!-- Country Code (recessed well pill) -->
      <div
        class="inline-flex items-center justify-center px-5 min-h-12 rounded-md bg-pod-well dark:bg-zinc-800 shadow-well text-slate-900 dark:text-zinc-100 font-semibold text-base tabular-nums shrink-0 select-none"
      >
        +62
      </div>

      <!-- Phone Digits Input -->
      <div class="relative flex-1">
        <input
          id="phone-input"
          type="tel"
          inputmode="numeric"
          autocomplete="tel-national"
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          @input="handleInput"
          class="w-full min-h-12 h-full px-5 rounded-md text-base sm:text-lg font-medium tabular-nums tracking-wide bg-white dark:bg-zinc-900 border text-slate-900 dark:text-zinc-100 placeholder-slate-300 dark:placeholder-zinc-600 transition-all focus:outline-none focus:ring-4 disabled:opacity-60"
          :class="
            error
              ? 'border-error focus:ring-error/10'
              : 'border-pod-sage/15 dark:border-zinc-700 focus:border-pod-sage focus:ring-pod-sage/10 dark:focus:border-pod-lime dark:focus:ring-pod-lime/15'
          "
        />
      </div>
    </div>

    <BaseText v-if="error" size="xs" variant="danger" class="px-1">
      {{ Array.isArray(error) ? error[0] : error }}
    </BaseText>
  </div>
</template>
