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
    class="flex-1 flex flex-col items-center justify-center py-2 px-1 relative transition-colors duration-150 active:scale-95 cursor-pointer"
    :class="[
      isActive
        ? 'text-pod-sage-deep dark:text-pod-lime font-semibold'
        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200',
    ]"
  >
    <div class="relative">
      <component :is="icon" class="w-5 h-5 transition-transform" :class="isActive ? 'scale-110' : ''" />
      <span
        v-if="badge"
        class="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-zinc-900"
      />
    </div>
    <span class="text-[11px] mt-1 tracking-tight truncate max-w-[64px]">
      {{ name }}
    </span>
  </router-link>
</template>
