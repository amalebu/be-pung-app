<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { SidebarCollapse, SidebarExpand, LogOut } from '@iconoir/vue'
import NavLink from './NavLink.vue'
import ThemeToggle from './ThemeToggle.vue'
import DefaultAvatar from '@/components/ui/DefaultAvatar.vue'
import BaseText from '@/components/ui/BaseText.vue'
import { useAuthStore } from '@/stores/authStore'
import { mainNavItems } from '@/config/navigation'

const collapsed = ref(false)
const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="hidden md:flex flex-col sticky top-0 h-screen overflow-hidden pt-14 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200 shrink-0 z-30"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <!-- Navigation Links (Scrollable area) -->
    <nav class="flex-1 overflow-y-auto min-h-0 p-3 space-y-1">
      <BaseText
        v-if="!collapsed"
        size="xs"
        variant="muted"
        class="px-2.5 pb-1.5 uppercase tracking-wider font-medium"
      >
        Menu Utama
      </BaseText>

      <NavLink
        v-for="item in mainNavItems"
        :key="item.name"
        :to="item.path"
        :name="item.name"
        :icon="item.icon"
        :badge="item.badge"
        :collapsed="collapsed"
      />
    </nav>

    <!-- Bottom Controls (Fixed at bottom) -->
    <div class="shrink-0 mt-auto p-3 border-t border-slate-200 dark:border-zinc-800 space-y-1 bg-white dark:bg-zinc-900">
      <router-link
        to="/profile"
        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        :class="{ 'justify-center': collapsed }"
        :title="collapsed ? 'Profil Saya' : ''"
      >
        <DefaultAvatar
          :avatar-url="authStore.user?.avatar"
          :name="authStore.user?.name || 'Pengguna'"
          size="xs"
        />
        <span v-if="!collapsed" class="truncate font-semibold">Profil Saya</span>
      </router-link>

      <ThemeToggle :show-side-nav="!collapsed" />

      <button
        type="button"
        @click="collapsed = !collapsed"
        class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        :title="collapsed ? 'Perluas Sidebar' : 'Lipat Sidebar'"
      >
        <SidebarExpand v-if="collapsed" class="w-4 h-4 shrink-0" />
        <SidebarCollapse v-else class="w-4 h-4 shrink-0" />
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
