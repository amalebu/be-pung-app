<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut } from '@iconoir/vue'
import NavLink from './NavLink.vue'
import DefaultAvatar from '@/components/ui/DefaultAvatar.vue'
import SidebarTooltip from '@/components/ui/SidebarTooltip.vue'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/composables/useSidebar'
import { mainNavItems } from '@/config/navigation'

const { collapsed } = useSidebar()
const router = useRouter()
const authStore = useAuthStore()

const profileTooltip = ref(null)
const logoutTooltip = ref(null)

async function handleLogout() {
  logoutTooltip.value?.hide()
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="hidden md:flex flex-col h-full overflow-hidden border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200 shrink-0 z-30 select-none"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <!-- Navigation Links (Scrollable area) -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-2.5 space-y-1 custom-scrollbar">
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
    <div class="shrink-0 mt-auto p-2.5 border-t border-slate-200 dark:border-zinc-800 space-y-1 bg-white dark:bg-zinc-900">
      <!-- Profil Saya Link -->
      <router-link
        to="/profile"
        class="relative flex items-center rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer group"
        :class="collapsed ? 'w-11 h-11 mx-auto justify-center' : 'w-full gap-2.5 px-2.5 py-2'"
        @mouseenter="profileTooltip?.show($event.currentTarget)"
        @mouseleave="profileTooltip?.hide()"
        @focus="profileTooltip?.show($event.currentTarget)"
        @blur="profileTooltip?.hide()"
        @click="profileTooltip?.hide()"
      >
        <DefaultAvatar
          :avatar-url="authStore.user?.avatar"
          :name="authStore.user?.name || 'Pengguna'"
          size="xs"
        />
        <span v-if="!collapsed" class="truncate font-semibold">Profil Saya</span>

        <SidebarTooltip ref="profileTooltip" :enabled="collapsed">
          Profil Saya
        </SidebarTooltip>
      </router-link>

      <!-- Logout Button -->
      <button
        type="button"
        @click="handleLogout"
        class="relative flex items-center rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        :class="collapsed ? 'w-11 h-11 mx-auto justify-center' : 'w-full gap-2.5 px-2.5 py-2'"
        @mouseenter="logoutTooltip?.show($event.currentTarget)"
        @mouseleave="logoutTooltip?.hide()"
        @focus="logoutTooltip?.show($event.currentTarget)"
        @blur="logoutTooltip?.hide()"
      >
        <LogOut class="w-5 h-5 shrink-0" />
        <span v-if="!collapsed">Keluar Akun</span>

        <SidebarTooltip ref="logoutTooltip" :enabled="collapsed">
          Keluar Akun
        </SidebarTooltip>
      </button>
    </div>
  </aside>
</template>
