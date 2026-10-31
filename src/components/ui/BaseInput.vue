<script setup>
import { ref, computed } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  error: {
    type: [String, Array],
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  autocomplete: {
    type: String,
    default: 'off',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const showPassword = ref(false)

const computedType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

const errorText = computed(() => {
  if (Array.isArray(props.error)) {
    return props.error[0] || ''
  }
  return props.error
})
</script>

<template>
  <div class="space-y-1.5">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-slate-700 dark:text-zinc-300"
    >
      {{ label }}
      <span v-if="required" class="text-rose-500">*</span>
    </label>

    <div class="relative">
      <input
        :id="id"
        :type="computedType"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :autocomplete="autocomplete"
        :disabled="disabled"
        @input="emit('update:modelValue', $event.target.value)"
        class="w-full rounded-md px-4 py-3 text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 border transition-all focus:outline-none focus:ring-4 disabled:opacity-60"
        :class="[
          type === 'password' ? 'pr-10' : '',
          errorText
            ? 'border-rose-500 dark:border-rose-500/80 focus:ring-rose-500/15 focus:border-rose-500'
            : 'border-pod-sage/15 dark:border-zinc-800 focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-400',
        ]"
      />

      <button
        v-if="type === 'password'"
        type="button"
        tabindex="-1"
        @click="showPassword = !showPassword"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
        :title="showPassword ? 'Sembunyikan password' : 'Lihat password'"
      >
        <EyeOff v-if="showPassword" class="w-4 h-4" />
        <Eye v-else class="w-4 h-4" />
      </button>
    </div>

    <p v-if="errorText" class="text-xs text-rose-600 dark:text-rose-400">
      {{ errorText }}
    </p>
    <p v-else-if="hint" class="text-xs text-slate-500 dark:text-zinc-400">
      {{ hint }}
    </p>
  </div>
</template>
