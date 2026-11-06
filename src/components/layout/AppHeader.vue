<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Lock } from '@iconoir/vue'
import ThemeToggle from './ThemeToggle.vue'
import SyncStatusBadge from '@/components/ui/SyncStatusBadge.vue'
import DefaultAvatar from '@/components/ui/DefaultAvatar.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import { useAuthStore } from '@/stores/authStore'
import { formatPhoneDisplay } from '@/utils/phoneUtils'
import { getJakartaHour } from '@/utils/dateUtils'

const emit = defineEmits(['openMobileDrawer'])

const authStore = useAuthStore()
const router = useRouter()

const greeting = computed(() => {
  const hour = getJakartaHour()
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 19) return 'Selamat Sore'
  return 'Selamat Malam'
})

const userIdentifier = computed(() => {
  if (authStore.user?.phone) {
    return formatPhoneDisplay(authStore.user.phone)
  }
  return authStore.user?.email || 'Pengguna'
})

function handleLockNow() {
  authStore.lockApp()
}
</script>

<template>
  <header class="h-14 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs px-3 sm:px-6 flex items-center justify-between shrink-0 fixed top-0 left-0 right-0 z-50">
    <div class="flex items-center gap-2.5 min-w-0">
      <!-- Mobile Avatar Button (Tap to Open Left Mobile Drawer) -->
      <button
        type="button"
        @click="emit('openMobileDrawer')"
        class="md:hidden flex items-center justify-center p-0.5 rounded-full border border-slate-200/80 dark:border-zinc-700 hover:ring-2 hover:ring-primary dark:hover:ring-primary-fixed-dim cursor-pointer transition-all shrink-0 active:scale-95"
        title="Buka Menu Samping"
      >
        <DefaultAvatar
          :avatar-url="authStore.user?.avatar"
          :name="authStore.user?.name || 'Pengguna'"
          size="sm"
        />
      </button>

      <div class="truncate">
        <BaseHeading as="h1" size="md" weight="semibold" class="truncate leading-tight">
          {{ greeting }}, {{ authStore.user?.name || 'Pengguna' }}!
        </BaseHeading>
      </div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <SyncStatusBadge />

      <!-- Desktop Profile Pill (Navigates to /profile) -->
      <router-link
        to="/profile"
        class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 transition-colors cursor-pointer"
        title="Kelola Profil Akun"
      >
        <DefaultAvatar
          :avatar-url="authStore.user?.avatar"
          :name="authStore.user?.name || 'Pengguna'"
          size="xs"
        />
        <BaseText as="span" size="xs" variant="secondary" weight="medium" tabular>
          {{ userIdentifier }}
        </BaseText>
      </router-link>

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

      <!-- Theme Toggle: Desktop only (md:inline-flex), moved to mobile drawer for mobile -->
      <div class="hidden md:inline-flex">
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>
