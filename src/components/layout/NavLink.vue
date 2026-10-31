<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'

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
    default: null,
  },
  badge: {
    type: String,
    default: null,
  },
  collapsed: {
    type: Boolean,
    default: false,
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
    class="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer"
    :class="[
      isActive
        ? 'bg-pod-carbon text-white dark:bg-pod-lime dark:text-pod-carbon shadow-floating'
        : 'text-slate-600 dark:text-zinc-400 hover:bg-pod-well dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100',
    ]"
    :title="collapsed ? name : ''"
  >
    <div class="flex items-center gap-2.5 truncate">
      <component :is="icon" v-if="icon" class="w-4 h-4 shrink-0" />
      <span v-if="!collapsed" class="truncate">{{ name }}</span>
    </div>

    <BaseBadge
      v-if="!collapsed && badge"
      variant="neutral"
      size="xs"
    >
      {{ badge }}
    </BaseBadge>
  </router-link>
</template>
