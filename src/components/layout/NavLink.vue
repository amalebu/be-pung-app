<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import SidebarTooltip from '@/components/ui/SidebarTooltip.vue'

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
const tooltip = ref(null)

const isActive = computed(() => {
  if (props.badge) return false
  if (props.to === '/dashboard') return route.path === '/dashboard'
  return route.path === props.to || route.path.startsWith(props.to + '/')
})
</script>

<template>
  <router-link
    :to="to"
    class="relative select-none transition-all cursor-pointer group"
    :class="[
      collapsed
        ? 'w-11 h-11 mx-auto flex items-center justify-center rounded-xl mb-1'
        : 'w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold mb-0.5',
      isActive
        ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-[0px_4px_16px_rgba(20,66,41,0.18)] font-bold'
        : 'text-slate-600 dark:text-zinc-400 hover:bg-[#f3f3f6] dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100',
    ]"
    :aria-current="isActive ? 'page' : undefined"
    @mouseenter="tooltip?.show($event.currentTarget)"
    @mouseleave="tooltip?.hide()"
    @focus="tooltip?.show($event.currentTarget)"
    @blur="tooltip?.hide()"
    @click="tooltip?.hide()"
    @keydown.esc="tooltip?.hide()"
  >
    <div
      class="flex items-center gap-2.5 min-w-0"
      :class="{ 'w-full justify-center': collapsed }"
    >
      <component
        :is="icon"
        v-if="icon"
        class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105"
        :class="isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'"
      />
      <span v-if="!collapsed" class="truncate">{{ name }}</span>
    </div>

    <!-- Badge saat expanded -->
    <BaseBadge
      v-if="!collapsed && badge"
      variant="neutral"
      size="xs"
    >
      {{ badge }}
    </BaseBadge>

    <!-- Dot indicator saat collapsed -->
    <span
      v-if="collapsed && badge"
      class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"
    />

    <!-- Tooltip saat collapsed (Portal ke Body) -->
    <SidebarTooltip ref="tooltip" :enabled="collapsed">
      {{ name }}
    </SidebarTooltip>
  </router-link>
</template>
