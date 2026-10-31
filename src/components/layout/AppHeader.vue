<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, User, Lock } from 'lucide-vue-next'
import ThemeToggle from './ThemeToggle.vue'
import SyncStatusBadge from '@/components/ui/SyncStatusBadge.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 19) return 'Selamat Sore'
  return 'Selamat Malam'
})

const userIdentifier = computed(() => {
  return authStore.user?.phone || authStore.user?.email || 'Pengguna'
})

function handleLockNow() {
  authStore.lockApp()
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="h-14 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs px-4 md:px-6 flex items-center justify-between shrink-0">
    <div>
      <BaseHeading as="h1" size="md" weight="semibold">
        {{ greeting }}, {{ authStore.user?.name || 'Pengguna' }}!
      </BaseHeading>
    </div>

    <div class="flex items-center gap-2">
      <SyncStatusBadge />

      <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-800">
        <img
          v-if="authStore.user?.avatar"
          :src="authStore.user.avatar"
          alt="Avatar"
          class="w-4 h-4 rounded-full object-cover"
        />
        <User v-else class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <BaseText as="span" size="xs" variant="secondary" weight="medium" tabular>
          {{ userIdentifier }}
        </BaseText>
      </div>

      <!-- Tombol Kunci PIN Instan -->
      <button
        v-if="authStore.user?.has_pin"
        type="button"
        @click="handleLockNow"
        class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
        title="Kunci Layar PIN"
      >
        <Lock class="w-4 h-4" />
      </button>

      <ThemeToggle />

      <button
        type="button"
        @click="handleLogout"
        class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
        title="Keluar"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
