<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, SidebarCollapse, SidebarExpand, Bell } from '@iconoir/vue'
import ThemeToggle from './ThemeToggle.vue'
import DefaultAvatar from '@/components/ui/DefaultAvatar.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import { useAuthStore } from '@/stores/authStore'
import { useNetworkStore } from '@/stores/networkStore'
import { useSidebar } from '@/composables/useSidebar'
import { formatPhoneDisplay } from '@/utils/phoneUtils'
import { getJakartaHour } from '@/utils/dateUtils'

const props = defineProps({
  isScrolled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['openMobileDrawer'])

const authStore = useAuthStore()
const networkStore = useNetworkStore()
const { collapsed, toggle: toggleSidebar } = useSidebar()
const router = useRouter()

const showNotificationToast = ref(false)
let notifTimer = null

function handleNotificationClick() {
  if (notifTimer) clearTimeout(notifTimer)
  showNotificationToast.value = true
  notifTimer = setTimeout(() => {
    showNotificationToast.value = false
  }, 2200)
}

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

// Status Dot Styling (Bawah Kanan Foto Profil): Merah (offline), Kuning/Orange (pending sync), Hijau (online)
const statusDotClass = computed(() => {
  switch (networkStore.connectionStatus) {
    case 'offline':
      return 'bg-rose-500'
    case 'pending':
      return 'bg-amber-500'
    case 'online':
    default:
      return 'bg-emerald-500'
  }
})

const statusDotTitle = computed(() => {
  switch (networkStore.connectionStatus) {
    case 'offline':
      return 'Mode Offline (Tidak ada koneksi)'
    case 'pending':
      return `Sinkronisasi tertunda (${networkStore.pendingCount} data tersimpan lokal)`
    case 'online':
    default:
      return 'Online (Terhubung)'
  }
})

function handleLockNow() {
  authStore.lockApp()
}
</script>

<template>
  <header
    class="fixed left-0 right-0 z-50 select-none transition-all duration-300 ease-out px-3.5 sm:px-5 flex items-center justify-between"
    :class="[
      networkStore.topToast.show
        ? 'top-7'
        : (isScrolled ? 'top-0' : 'top-4 md:top-0'),
      isScrolled
        ? 'h-14 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200/90 dark:border-zinc-800 shadow-2xs'
        : 'h-16 md:h-14 bg-slate-50/80 dark:bg-zinc-950/80 md:bg-white/85 md:dark:bg-zinc-900/85 backdrop-blur-xs md:backdrop-blur-md border-b border-transparent md:border-slate-200/90 md:dark:border-zinc-800',
    ]"
  >
    <!-- LEFT SECTION -->
    <div class="flex items-center gap-3 min-w-0">
      <!-- Desktop Sidenav Toggle Button (Reference: PortalInasek SideNav) -->
      <button
        type="button"
        @click="toggleSidebar"
        class="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 cursor-pointer transition-all active:scale-95 shrink-0"
        :title="collapsed ? 'Perluas Sidebar' : 'Lipat Sidebar'"
      >
        <SidebarExpand v-if="collapsed" class="w-4 h-4 stroke-[2]" />
        <SidebarCollapse v-else class="w-4 h-4 stroke-[2]" />
      </button>

      <!-- Vertical divider on desktop -->
      <div class="hidden md:block h-5 w-px bg-slate-200 dark:bg-zinc-800 shrink-0" />

      <!-- Mobile Avatar Button (Tap to Open Left Mobile Drawer) dengan Status Dot Bawah-Kanan -->
      <button
        type="button"
        @click="emit('openMobileDrawer')"
        class="md:hidden relative flex items-center justify-center p-0.5 rounded-full border border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:ring-2 hover:ring-emerald-700 dark:hover:ring-lime-400 cursor-pointer transition-all shrink-0 active:scale-95"
        title="Buka Menu Samping"
      >
        <DefaultAvatar
          :avatar-url="authStore.user?.avatar"
          :name="authStore.user?.name || 'Pengguna'"
          :size="isScrolled ? 'sm' : 'md'"
        />
        <!-- Connection Status Dot (Bawah Kanan) -->
        <span
          class="absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-zinc-900 transition-colors duration-200 pointer-events-none"
          :class="[
            isScrolled ? 'w-2 h-2' : 'w-2.5 h-2.5',
            statusDotClass,
          ]"
          :title="statusDotTitle"
        />
      </button>

      <!-- MOBILE TITLE (BERSUSUN: GREETING KECIL + NAMA BESAR, RINGKAS SAAT SCROLLED) -->
      <div class="md:hidden min-w-0 flex flex-col justify-center">
        <!-- Saat tidak discroll (posisi di paling atas): Bersusun -->
        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div v-if="!isScrolled" key="unscrolled" class="flex flex-col">
            <span class="text-xs font-medium text-slate-500 dark:text-zinc-400 leading-tight truncate">
              {{ greeting }},
            </span>
            <span class="text-base font-bold text-slate-900 dark:text-zinc-100 leading-tight truncate mt-0.5">
              {{ authStore.user?.name || 'Pengguna' }}
            </span>
          </div>

          <!-- Saat discroll ke atas: Cukup tampilkan nama saja -->
          <div v-else key="scrolled" class="flex items-center">
            <span class="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-tight truncate">
              {{ authStore.user?.name || 'Pengguna' }}
            </span>
          </div>
        </Transition>
      </div>

      <!-- DESKTOP TITLE -->
      <div class="hidden md:flex flex-col justify-center truncate">
        <span class="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider leading-none mb-1">
          {{ greeting }}
        </span>
        <BaseHeading as="h1" size="md" weight="bold" class="truncate leading-none text-slate-800 dark:text-zinc-100 text-sm sm:text-base">
          {{ authStore.user?.name || 'Pengguna' }}!
        </BaseHeading>
      </div>
    </div>

    <!-- RIGHT SECTION -->
    <div class="flex items-center gap-2 shrink-0">
      <!-- Notification Icon Button (Fitur Segera Hadir / Coming Soon) -->
      <div class="relative">
        <button
          type="button"
          @click="handleNotificationClick"
          class="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 cursor-pointer transition-all active:scale-95 shrink-0 shadow-2xs relative"
          title="Notifikasi (Segera Hadir)"
          aria-label="Notifikasi"
        >
          <Bell class="w-4 h-4" />
          <!-- Subtle Coming Soon dot indicator -->
          <span class="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </button>

        <!-- Notification Coming Soon Floating Popover -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-1 scale-95"
        >
          <div
            v-if="showNotificationToast"
            class="absolute right-0 top-11 z-50 whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-zinc-800/95 text-white text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-1.5 border border-slate-700/50 pointer-events-none"
          >
            <Bell class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Notifikasi segera hadir!</span>
          </div>
        </Transition>
      </div>

      <!-- Desktop Profile Pill (Navigates to /profile) dengan Status Dot Bawah-Kanan -->
      <router-link
        to="/profile"
        class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 transition-colors cursor-pointer"
        title="Kelola Profil Akun"
      >
        <div class="relative shrink-0 flex items-center justify-center">
          <DefaultAvatar
            :avatar-url="authStore.user?.avatar"
            :name="authStore.user?.name || 'Pengguna'"
            size="xs"
          />
          <!-- Connection Status Dot (Bawah Kanan) -->
          <span
            class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1.5 ring-slate-100 dark:ring-zinc-800 transition-colors duration-200 pointer-events-none"
            :class="statusDotClass"
            :title="statusDotTitle"
          />
        </div>
        <BaseText as="span" size="xs" variant="secondary" weight="medium" tabular>
          {{ userIdentifier }}
        </BaseText>
      </router-link>

      <!-- Tombol Kunci PIN Instan (Desktop / Tablet) -->
      <button
        v-if="authStore.user?.has_pin"
        type="button"
        @click="handleLockNow"
        class="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-all active:scale-95"
        title="Kunci Layar PIN"
      >
        <Lock class="w-4 h-4" />
      </button>

      <!-- Theme Toggle: Desktop only -->
      <div class="hidden md:inline-flex">
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>
