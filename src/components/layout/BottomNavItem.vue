<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  to: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: [Object, Function],
    required: true,
  },
  badge: {
    type: String,
    default: null,
  },
})

const route = useRoute()

const isActive = computed(() => {
  return route.path === props.to && !props.badge
})
</script>

<template>
  <router-link
    :to="to"
    class="flex-1 flex flex-col items-center justify-center py-1.5 px-1 relative transition-all duration-150 active:scale-95 cursor-pointer"
    :class="[
      isActive
        ? 'text-primary dark:text-primary-fixed-dim font-bold'
        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200',
    ]"
  >
    <div
      class="relative flex items-center justify-center w-8 h-8 rounded-full transition-all"
      :class="isActive ? 'bg-primary text-white dark:bg-primary-container dark:text-on-primary-container shadow-xs' : ''"
    >
      <component :is="icon" class="w-4 h-4 transition-transform" />
      <span
        v-if="badge"
        class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"
      />
    </div>
    <span class="text-[11px] mt-0.5 tracking-tight truncate max-w-[64px]">
      {{ name }}
    </span>
  </router-link>
</template>
