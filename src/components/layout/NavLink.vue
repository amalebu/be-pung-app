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
    class="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer"
    :class="[
      isActive
        ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-[0px_4px_16px_rgba(20,66,41,0.18)]'
        : 'text-slate-600 dark:text-zinc-400 hover:bg-[#f3f3f6] dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100',
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
