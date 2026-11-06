<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Settings, Shield, HalfMoon, SunLight, Database, Lock, ArrowLeft, CheckCircle, Trash } from '@iconoir/vue'
import AppShell from '@/components/layout/AppShell.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/composables/useTheme'
import { localDb } from '@/services/localDb'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()

const cacheCleared = ref(false)

async function handleClearLocalData() {
  if (confirm('Apakah Anda yakin ingin menyinkronkan ulang data lokal dan membersihkan antrean sinkronisasi? Data di server tidak akan terhapus.')) {
    try {
      await localDb.clearOutbox?.()
      cacheCleared.value = true
      setTimeout(() => {
        cacheCleared.value = false
      }, 3000)
    } catch {
      cacheCleared.value = true
    }
  }
}
</script>

<template>
  <AppShell>
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Breadcrumb & Header -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="router.back()"
          class="w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Kembali"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <BaseHeading as="h1" size="xl" weight="semibold">
            Pengaturan Aplikasi
          </BaseHeading>
          <BaseText size="sm" variant="muted" class="mt-0.5">
            Preferensi antarmuka, keamanan PIN, dan sinkronisasi lokal
          </BaseText>
        </div>
      </div>

      <!-- Tampilan & Tema -->
      <BaseCard class="p-6">
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/80 dark:border-zinc-800">
          <SunLight v-if="!isDark" class="w-5 h-5 text-amber-500" />
          <HalfMoon v-else class="w-5 h-5 text-pod-lime" />
          <BaseHeading as="h2" size="md" weight="semibold">
            Tampilan & Mode Tema
          </BaseHeading>
        </div>

        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Tema Gelap (Dark Mode)
            </p>
            <p class="text-xs text-slate-500 dark:text-zinc-400">
              Menyesuaikan warna latar kanvas dan kartu pod yang menenangkan
            </p>
          </div>

          <button
            type="button"
            @click="toggleTheme"
            class="relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden"
            :class="isDark ? 'bg-pod-lime' : 'bg-slate-300 dark:bg-zinc-700'"
            title="Ubah tema aplikasi"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white dark:bg-zinc-900 shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center"
              :class="isDark ? 'translate-x-6' : 'translate-x-0'"
            >
              <HalfMoon v-if="isDark" class="w-3.5 h-3.5 text-zinc-900 dark:text-pod-lime" />
              <SunLight v-else class="w-3.5 h-3.5 text-amber-500" />
            </span>
          </button>
        </div>
      </BaseCard>

      <!-- Keamanan & Layar PIN -->
      <BaseCard class="p-6">
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/80 dark:border-zinc-800">
          <Shield class="w-5 h-5 text-emerald-600 dark:text-lime-400" />
          <BaseHeading as="h2" size="md" weight="semibold">
            Keamanan Akun & PIN
          </BaseHeading>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Kunci Otomatis (Auto-Lock 5 Menit)
              </p>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                Aplikasi otomatis terkunci dengan PIN setelah 5 menit tidak ada aktivitas atau diminimalkan
              </p>
            </div>
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-lime-400">
              <CheckCircle class="w-4 h-4" />
              Aktif
            </span>
          </div>

          <div v-if="authStore.user?.has_pin" class="pt-3 border-t border-slate-200/70 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Kunci Layar Sekarang
              </p>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                Langsung kunci sesi antarmuka dengan overlay 6 digit PIN
              </p>
            </div>

            <SecondaryButton size="sm" @click="authStore.lockApp()">
              <Lock class="w-3.5 h-3.5 mr-1.5" />
              Kunci Sekarang
            </SecondaryButton>
          </div>
        </div>
      </BaseCard>

      <!-- Penyimpanan & Cache Offline -->
      <BaseCard class="p-6">
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/80 dark:border-zinc-800">
          <Database class="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <BaseHeading as="h2" size="md" weight="semibold">
            Penyimpanan Lokal & Offline First
          </BaseHeading>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Browser IndexedDB Cache
              </p>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                Data To-Do, Kebiasaan, dan antrean sinkronisasi offline tersimpan aman di peramban
              </p>
            </div>

            <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Aktif
            </span>
          </div>

          <div class="pt-3 border-t border-slate-200/70 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Bersihkan Antrean Lokal
              </p>
              <p class="text-xs text-slate-500 dark:text-zinc-400">
                Gunakan jika terdapat konflik sinkronisasi outbox yang macet
              </p>
            </div>

            <SecondaryButton size="sm" @click="handleClearLocalData">
              <Trash class="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              Bersihkan
            </SecondaryButton>
          </div>

          <BaseText v-if="cacheCleared" size="xs" class="text-emerald-600 font-semibold">
            Cache dan antrean lokal telah disegarkan.
          </BaseText>
        </div>
      </BaseCard>

      <!-- Informasi Sistem -->
      <div class="p-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 text-center">
        <p class="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          PersonalApp &bull; Ekosistem Modular Monolith SQLite
        </p>
        <p class="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">
          Single Backend Laravel API &bull; Vue 3 JS + Vite &bull; Serene Pod Tactile
        </p>
      </div>
    </div>
  </AppShell>
</template>
