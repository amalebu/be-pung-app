<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Wallet,
  Sparkles,
  CheckSquare,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ShieldCheck,
} from 'lucide-vue-next'
import NavLink from './NavLink.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import { useAuthStore } from '@/stores/authStore'

const collapsed = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Finance Tracker',
    path: '/dashboard',
    icon: Wallet,
    badge: 'Segera',
  },
  {
    name: 'Habit Tracker',
    path: '/habits',
    icon: Sparkles,
    badge: null,
  },
  {
    name: 'To-Do List',
    path: '/todos',
    icon: CheckSquare,
    badge: null,
  },
]

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="hidden md:flex flex-col border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200 shrink-0"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <!-- Brand Header -->
    <div class="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <div class="w-8 h-8 rounded-md bg-pod-sage flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-floating">
          P
        </div>
        <div v-if="!collapsed" class="truncate">
          <BaseHeading as="p" size="sm" weight="semibold" class="leading-none">
            PersonalApp
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-0.5 flex items-center gap-1">
            <ShieldCheck class="w-3 h-3 text-emerald-500" />
            Modular SQLite
          </BaseText>
        </div>
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="flex-1 p-3 space-y-1">
      <BaseText
        v-if="!collapsed"
        size="xs"
        variant="muted"
        class="px-2.5 pb-1.5 uppercase tracking-wider font-medium"
      >
        Menu Utama
      </BaseText>

      <NavLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        :name="item.name"
        :icon="item.icon"
        :badge="item.badge"
        :collapsed="collapsed"
      />
    </nav>

    <!-- Bottom Controls -->
    <div class="p-3 border-t border-slate-200 dark:border-zinc-800 space-y-1">
      <button
        type="button"
        @click="collapsed = !collapsed"
        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        :title="collapsed ? 'Perluas Sidebar' : 'Lipat Sidebar'"
      >
        <PanelLeftOpen v-if="collapsed" class="w-4 h-4 shrink-0" />
        <PanelLeftClose v-else class="w-4 h-4 shrink-0" />
        <span v-if="!collapsed">Lipat Sidebar</span>
      </button>

      <button
        type="button"
        @click="handleLogout"
        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
        :title="collapsed ? 'Keluar Akun' : ''"
      >
        <LogOut class="w-4 h-4 shrink-0" />
        <span v-if="!collapsed">Keluar Akun</span>
      </button>
    </div>
  </aside>
</template>
