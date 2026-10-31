<script setup>
import {
  LayoutDashboard,
  Wallet,
  Sparkles,
  CheckSquare,
} from 'lucide-vue-next'
import BottomNavItem from './BottomNavItem.vue'

const navItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Finance',
    path: '/dashboard',
    icon: Wallet,
    badge: 'Segera',
  },
  {
    name: 'Habits',
    path: '/habits',
    icon: Sparkles,
    badge: null,
  },
  {
    name: 'To-Do',
    path: '/todos',
    icon: CheckSquare,
    badge: null,
  },
]
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 pb-safe shadow-lg"
  >
    <div class="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
      <BottomNavItem
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        :name="item.name"
        :icon="item.icon"
        :badge="item.badge"
      />
    </div>
  </nav>
</template>
