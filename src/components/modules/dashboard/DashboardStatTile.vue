<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  hint: { type: String, default: '' },
  icon: { type: [Object, Function], required: true },
  // tone: forest | amber | rose | slate
  tone: { type: String, default: 'forest' },
  to: { type: [String, Object], default: null },
})

const toneClasses = {
  forest: 'bg-[#d3e4d8] text-[#144229] dark:bg-[#2d5a3f] dark:text-[#bceecb]',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200',
}
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to || undefined"
    class="group relative flex flex-col justify-between gap-4 rounded-2xl p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800 shadow-surface transition-all duration-200"
    :class="to ? 'hover:-translate-y-0.5 hover:shadow-floating cursor-pointer' : ''"
  >
    <div class="flex items-center justify-between">
      <span class="w-9 h-9 rounded-xl flex items-center justify-center" :class="toneClasses[tone] || toneClasses.forest">
        <component :is="icon" class="w-[18px] h-[18px]" />
      </span>
      <slot name="corner" />
    </div>
    <div>
      <p class="text-2xl sm:text-[28px] font-bold leading-none tabular-nums text-slate-900 dark:text-zinc-100">
        {{ value }}
      </p>
      <p class="mt-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300">{{ label }}</p>
      <p v-if="hint" class="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500 truncate">{{ hint }}</p>
    </div>
  </component>
</template>
