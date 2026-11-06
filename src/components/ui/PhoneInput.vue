<script setup>
import { ref, watch } from 'vue'
import { NavArrowDown, XmarkCircle } from '@iconoir/vue'
import BaseText from '@/components/ui/BaseText.vue'
import { usePhoneFormatter } from '@/composables/usePhoneFormatter'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Nomor Ponsel Aktif',
  },
  placeholder: {
    type: String,
    default: '812-3456-7890',
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

const emit = defineEmits(['update:modelValue', 'input'])

const inputRef = ref(null)
const { phone, formatPhone, onInput: formatInput } = usePhoneFormatter(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== phone.value) {
      formatPhone(val || '')
    }
  },
  { immediate: true }
)

function handleInput(event) {
  formatInput(event)
  emit('update:modelValue', phone.value)
  emit('input', event)
}

function handleClear() {
  formatPhone('')
  emit('update:modelValue', '')
  emit('input', { target: { value: '' } })
  inputRef.value?.focus()
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      v-if="label"
      for="phone-input"
      class="text-xs font-semibold text-slate-600 dark:text-zinc-400 flex items-center justify-between px-1 select-none"
    >
      <span>{{ label }}</span>
    </label>

    <!-- Outer Tactile Inset Track -->
    <div
      class="relative flex items-center rounded-full bg-[#f3f3f6] dark:bg-zinc-800/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),inset_0_-1px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] p-1.5 border border-[#e2e2e5] dark:border-zinc-700/60 focus-within:ring-2 focus-within:ring-[#144229]/25 dark:focus-within:ring-[#a1d2af]/40 transition-all"
      :class="{ '!border-rose-500 focus-within:!ring-rose-500/30': error }"
    >
      <!-- Country Code Pill Button -->
      <button
        type="button"
        class="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-[0_2px_6px_rgba(0,0,0,0.06)] active:scale-95 transition-all select-none shrink-0 cursor-default"
        tabindex="-1"
      >
        <!-- Flag Indonesia -->
        <div class="w-4 h-3 rounded-[2px] overflow-hidden flex flex-col shadow-xs border border-black/10 shrink-0">
          <span class="w-full h-1/2 bg-red-600"></span>
          <span class="w-full h-1/2 bg-white"></span>
        </div>
        <span class="text-[15px] font-semibold text-[#144229] dark:text-[#a1d2af] tabular-nums">+62</span>
        <NavArrowDown class="w-4 h-4 text-slate-400 dark:text-zinc-400" />
      </button>

      <!-- Vertical Divider -->
      <span class="w-px h-6 bg-slate-200 dark:bg-zinc-700 mx-1 shrink-0"></span>

      <!-- Phone Digits Input with Auto-Formatter -->
      <input
        ref="inputRef"
        id="phone-input"
        type="tel"
        inputmode="numeric"
        autocomplete="tel-national"
        pattern="[0-9\-]*"
        maxlength="17"
        :value="phone"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="handleInput"
        class="flex-1 min-w-0 bg-transparent py-2.5 px-2 text-[16px] sm:text-[17px] font-medium text-slate-900 dark:text-zinc-100 tabular-nums tracking-wide placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
      />

      <!-- Clear Button (appears when input has text) -->
      <button
        v-if="phone"
        type="button"
        aria-label="Hapus nomor"
        @click="handleClear"
        class="p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors shrink-0"
      >
        <XmarkCircle class="w-5 h-5" />
      </button>
    </div>

    <BaseText v-if="error" size="xs" variant="danger" class="px-1 mt-0.5">
      {{ Array.isArray(error) ? error[0] : error }}
    </BaseText>
  </div>
</template>
