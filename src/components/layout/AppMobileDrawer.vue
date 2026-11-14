<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Settings, Lock, LogOut, Xmark, NavArrowRight } from '@iconoir/vue'
import DefaultAvatar from '@/components/ui/DefaultAvatar.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import { useAuthStore } from '@/stores/authStore'
import { mainNavItems } from '@/config/navigation'
import { formatPhoneDisplay } from '@/utils/phoneUtils'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwiping = ref(false)

// Hanya tampilkan menu yang benar-benar bisa dibuka (sembunyikan placeholder "Segera")
const drawerNavItems = mainNavItems.filter((item) => !item.badge)

const userContact = computed(() => {
  if (authStore.user?.phone) return formatPhoneDisplay(authStore.user.phone)
  return authStore.user?.email || ''
})

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

function close() {
  emit('close')
}

function navigateTo(path) {
  close()
  router.push(path)
}

function handleLockNow() {
  close()
  authStore.lockApp()
}

async function handleLogout() {
  close()
  await authStore.logout()
  router.push('/login')
}

// Gesture swipe to close (swipe left / swipe back)
function onTouchStart(e) {
  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  isSwiping.value = true
}

function onTouchMove(e) {
  if (!isSwiping.value) return
  const touch = e.touches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = Math.abs(touch.clientY - touchStartY.value)

  // Usapan ke kiri (swipe back) >= 40px dan dominan horizontal -> langsung tutup seketika
  if (deltaX <= -40 && Math.abs(deltaX) > deltaY) {
    close()
    isSwiping.value = false
  }
}

function onTouchEnd(e) {
  if (!isSwiping.value) return
  const touch = e.changedTouches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = Math.abs(touch.clientY - touchStartY.value)

  // Quick flick ke kiri >= 30px
  if (deltaX <= -30 && Math.abs(deltaX) > deltaY) {
    close()
  }
  isSwiping.value = false
}

// Global keydown escape listener
function handleKeyDown(e) {
  if (e.key === 'Escape' && props.show) {
    close()
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="show"
        class="md:hidden fixed inset-0 z-50 overflow-hidden"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- Semi-transparent Backdrop (Click to close) -->
        <div
          class="drawer-backdrop fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs cursor-pointer"
          @click="close"
        />

        <!-- Drawer Panel (Left-sliding panel) -->
        <aside
          class="drawer-panel fixed inset-y-0 left-0 w-72 max-w-[82vw] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col z-10 will-change-transform pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
          @click.stop
        >
          <!-- Header: Profil (tap untuk buka /profile) + tombol tutup -->
          <div class="flex items-center gap-3 px-4 pt-5 pb-4">
            <button
              type="button"
              @click="navigateTo('/profile')"
              class="flex-1 min-w-0 flex items-center gap-3 p-1.5 -m-1.5 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-zinc-800/70 active:scale-[0.98] transition-all cursor-pointer"
              :class="{ 'bg-slate-100 dark:bg-zinc-800/70': isActive('/profile') }"
            >
              <DefaultAvatar
                :avatar-url="authStore.user?.avatar"
                :name="authStore.user?.name || 'Pengguna'"
                size="md"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate leading-tight">
                  {{ authStore.user?.name || 'Pengguna' }}
                </p>
                <p v-if="userContact" class="text-xs text-slate-500 dark:text-zinc-400 truncate tabular-nums mt-0.5">
                  {{ userContact }}
                </p>
              </div>
              <NavArrowRight class="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
            </button>

            <button
              type="button"
              @click.stop="close"
              class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Tutup menu"
            >
              <Xmark class="w-5 h-5" />
            </button>
          </div>

          <div class="mx-4 h-px bg-slate-200/80 dark:bg-zinc-800" />

          <!-- Navigasi Utama -->
          <nav class="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
            <button
              v-for="item in drawerNavItems"
              :key="item.name"
              type="button"
              @click="navigateTo(item.path)"
              class="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer active:scale-[0.98]"
              :class="isActive(item.path)
                ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-[0px_4px_16px_rgba(20,66,41,0.18)]'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60'"
              :aria-current="isActive(item.path) ? 'page' : undefined"
            >
              <component
                :is="item.icon"
                class="w-5 h-5 shrink-0"
                :class="isActive(item.path) ? 'stroke-[2.2]' : 'stroke-[1.8]'"
              />
              <span class="truncate">{{ item.name }}</span>
            </button>

            <div class="!my-3 mx-1 h-px bg-slate-200/80 dark:bg-zinc-800" />

            <button
              type="button"
              @click="navigateTo('/settings')"
              class="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer active:scale-[0.98]"
              :class="isActive('/settings')
                ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-[0px_4px_16px_rgba(20,66,41,0.18)]'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60'"
            >
              <Settings class="w-5 h-5 shrink-0 stroke-[1.8]" />
              <span>Pengaturan</span>
            </button>
          </nav>

          <!-- Footer: Aksi cepat (Tema, Kunci PIN, Keluar) -->
          <div class="px-4 py-4 border-t border-slate-200/80 dark:border-zinc-800 flex items-center gap-2">
            <ThemeToggle />

            <button
              v-if="authStore.user?.has_pin"
              type="button"
              @click="handleLockNow"
              class="w-10 h-10 shrink-0 rounded-full border border-[#e2e2e5] dark:border-zinc-800 bg-white/90 dark:bg-zinc-900 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              aria-label="Kunci layar dengan PIN"
              title="Kunci Layar"
            >
              <Lock class="w-5 h-5" />
            </button>

            <button
              type="button"
              @click="handleLogout"
              class="ml-auto h-10 inline-flex items-center gap-2 px-4 rounded-full text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut class="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .drawer-panel {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-leave-active .drawer-panel {
  transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1);
}

.drawer-enter-from .drawer-backdrop,
.drawer-leave-to .drawer-backdrop {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(-100%);
}

.drawer-enter-to .drawer-backdrop,
.drawer-leave-from .drawer-backdrop {
  opacity: 1;
}

.drawer-enter-to .drawer-panel,
.drawer-leave-from .drawer-panel {
  transform: translateX(0);
}
</style>
