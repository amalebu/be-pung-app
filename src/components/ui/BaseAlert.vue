<script setup>
import { AlertCircle, CheckCircle2, Info } from 'lucide-vue-next'

defineProps({
  variant: {
    type: String,
    default: 'error', // error | success | info
  },
  message: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div
    v-if="message"
    class="flex items-start gap-2.5 rounded-2xl p-3.5 text-sm border"
    :class="[
      variant === 'error'
        ? 'bg-error-container/70 dark:bg-rose-950/30 border-error/15 dark:border-rose-900/60 text-on-error-container dark:text-rose-300'
        : '',
      variant === 'success'
        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
        : '',
      variant === 'info'
        ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300'
        : '',
    ]"
  >
    <AlertCircle v-if="variant === 'error'" class="w-4 h-4 mt-0.5 shrink-0" />
    <CheckCircle2 v-else-if="variant === 'success'" class="w-4 h-4 mt-0.5 shrink-0" />
    <Info v-else class="w-4 h-4 mt-0.5 shrink-0" />
    <span>{{ message }}</span>
  </div>
</template>
