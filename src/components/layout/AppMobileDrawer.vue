<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Settings, Lock, LogOut, Xmark, NavArrowRight, ShieldCheck } from '@iconoir/vue'
import DefaultAvatar from '@/components/ui/DefaultAvatar.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
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
          class="drawer-panel fixed inset-y-0 left-0 w-72 max-w-[82vw] bg-white dark:bg-zinc-900 border-r border-slate-200/90 dark:border-zinc-800 shadow-2xl flex flex-col z-10 will-change-transform"
          @click.stop
        >
          <!-- Drawer Header / User Banner -->
          <div class="p-5 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40">
            <div class="flex items-center justify-between mb-4">
              <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
                <ShieldCheck class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Akun Terverifikasi</span>
              </div>

              <!-- Close Button (X) -->
              <button
                type="button"
                @click.stop="close"
                class="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
                title="Tutup Menu"
              >
                <Xmark class="w-5 h-5" />
              </button>
            </div>

            <!-- User Profile Card in Drawer (Clickable to /profile) -->
            <div
              @click="navigateTo('/profile')"
              class="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-200/40 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
            >
              <DefaultAvatar
                :avatar-url="authStore.user?.avatar"
                :name="authStore.user?.name || 'Pengguna'"
                size="lg"
              />

              <div class="min-w-0 flex-1">
                <BaseHeading as="h2" size="sm" weight="semibold" class="truncate group-hover:text-emerald-700 dark:group-hover:text-lime-400 transition-colors">
                  {{ authStore.user?.name || 'Pengguna' }}
                </BaseHeading>
                <BaseText size="xs" variant="muted" class="truncate font-mono">
                  {{ authStore.user?.phone ? formatPhoneDisplay(authStore.user.phone) : (authStore.user?.email || 'Belum ada kontak') }}
                </BaseText>
                <span class="inline-block text-[11px] text-emerald-600 dark:text-lime-400 font-medium mt-0.5">
                  Lihat Profil &rarr;
                </span>
              </div>
            </div>
          </div>

          <!-- Drawer Navigation List -->
          <nav class="flex-1 overflow-y-auto p-4 space-y-2">
            <!-- Main Apps Navigation (Sama seperti Desktop) -->
            <BaseText size="xs" variant="muted" class="px-2 uppercase tracking-wider font-semibold">
              Menu Utama
            </BaseText>

            <div class="space-y-1 mb-4">
              <button
                v-for="item in mainNavItems"
                :key="item.name"
                type="button"
                @click="navigateTo(item.path)"
                class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                :class="route.path === item.path
                  ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-[0px_4px_16px_rgba(20,66,41,0.18)]'
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60'"
              >
                <div class="flex items-center gap-3">
                  <component :is="item.icon" class="w-5 h-5 shrink-0" />
                  <span>{{ item.name }}</span>
                </div>

                <span
                  v-if="item.badge"
                  class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                  :class="route.path === item.path
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'"
                >
                  {{ item.badge }}
                </span>
              </button>
            </div>

            <div class="my-3 border-t border-slate-200/80 dark:border-zinc-800" />

            <BaseText size="xs" variant="muted" class="px-2 uppercase tracking-wider font-semibold">
              Navigasi Akun
            </BaseText>

            <!-- Menu Profile -->
            <button
              type="button"
              @click="navigateTo('/profile')"
              class="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <User class="w-5 h-5" />
                </div>
                <div class="text-left">
                  <p class="text-sm font-semibold">Profil Saya</p>
                  <p class="text-xs text-slate-500 dark:text-zinc-400">Nama, foto & tautkan akun</p>
                </div>
              </div>
              <NavArrowRight class="w-4 h-4 text-slate-400" />
            </button>

            <!-- Menu Settings -->
            <button
              type="button"
              @click="navigateTo('/settings')"
              class="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                  <Settings class="w-5 h-5" />
                </div>
                <div class="text-left">
                  <p class="text-sm font-semibold">Pengaturan</p>
                  <p class="text-xs text-slate-500 dark:text-zinc-400">Preferensi & keamanan</p>
                </div>
              </div>
              <NavArrowRight class="w-4 h-4 text-slate-400" />
            </button>

            <div class="my-3 border-t border-slate-200/80 dark:border-zinc-800" />

            <BaseText size="xs" variant="muted" class="px-2 uppercase tracking-wider font-semibold">
              Preferensi Tampilan
            </BaseText>

            <!-- Relocated Theme Toggle for Mobile -->
            <ThemeToggle show-side-nav />

            <!-- Lock Screen with PIN -->
            <button
              v-if="authStore.user?.has_pin"
              type="button"
              @click="handleLockNow"
              class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer mt-2"
            >
              <div class="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Lock class="w-5 h-5" />
              </div>
              <div class="text-left">
                <p class="text-sm font-semibold">Kunci Layar Sekarang</p>
                <p class="text-xs text-slate-500 dark:text-zinc-400">Kunci instan dengan PIN</p>
              </div>
            </button>
          </nav>

          <!-- Drawer Footer / Logout -->
          <div class="p-4 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/20">
            <button
              type="button"
              @click="handleLogout"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border border-rose-200/60 dark:border-rose-900/40"
            >
              <LogOut class="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>

            <p class="text-center text-[10px] text-slate-400 dark:text-zinc-600 mt-3 font-mono">
              PersonalApp v1.0 &bull; Modular SQLite
            </p>
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
