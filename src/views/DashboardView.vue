<script setup>
import { onMounted, ref } from 'vue'
import {
  CheckCircle2,
  Database,
  Shield,
  Radio,
  Wallet,
  Sparkles,
  CheckSquare,
  RefreshCw,
} from 'lucide-vue-next'
import AppShell from '@/components/layout/AppShell.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const refreshing = ref(false)

async function refreshProfile() {
  refreshing.value = true
  await authStore.fetchMe()
  refreshing.value = false
}

onMounted(() => {
  authStore.fetchMe()
})
</script>

<template>
  <AppShell>
    <div class="space-y-6">
      <!-- Page Title & Action -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <BaseHeading as="h2" size="xl" weight="semibold">
            Dashboard Utama
          </BaseHeading>
          <BaseText size="sm" variant="muted" class="mt-0.5">
            Autentikasi Sanctum & isolasi database modul `PersonalApp` telah aktif.
          </BaseText>
        </div>

        <SecondaryButton
          size="sm"
          :loading="refreshing"
          @click="refreshProfile"
        >
          <RefreshCw v-if="!refreshing" class="w-3.5 h-3.5" />
          Sinkronkan Sesi (`/auth/me`)
        </SecondaryButton>
      </div>

      <!-- Status Cards (4 Metric Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BaseCard padding="p-5">
          <div class="flex items-center justify-between">
            <BaseText size="xs" variant="muted" weight="medium">
              Status Autentikasi
            </BaseText>
            <Shield class="w-4 h-4 text-emerald-500" />
          </div>
          <BaseHeading as="p" size="lg" weight="bold" class="text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 class="w-4 h-4" />
            Terautentikasi
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1">
            Sanctum Bearer Token Aktif
          </BaseText>
        </BaseCard>

        <BaseCard padding="p-5">
          <div class="flex items-center justify-between">
            <BaseText size="xs" variant="muted" weight="medium">
              Database Modul
            </BaseText>
            <Database class="w-4 h-4 text-indigo-500" />
          </div>
          <BaseHeading as="p" size="lg" weight="bold" class="mt-2" tabular>
            personal_app.sqlite
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1">
            Koneksi: `personal_app`
          </BaseText>
        </BaseCard>

        <BaseCard padding="p-5">
          <div class="flex items-center justify-between">
            <BaseText size="xs" variant="muted" weight="medium">
              WebSocket Engine
            </BaseText>
            <Radio class="w-4 h-4 text-indigo-500" />
          </div>
          <BaseHeading as="p" size="lg" weight="bold" class="mt-2">
            Laravel Reverb
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1">
            Channel: `personal-app.users.{{ authStore.user?.id || '-' }}`
          </BaseText>
        </BaseCard>

        <BaseCard padding="p-5">
          <div class="flex items-center justify-between">
            <BaseText size="xs" variant="muted" weight="medium">
              ID Pengguna Aktif
            </BaseText>
            <CheckCircle2 class="w-4 h-4 text-emerald-500" />
          </div>
          <BaseHeading as="p" size="lg" weight="bold" class="mt-2" tabular>
            #{{ authStore.user?.id || '-' }} — {{ authStore.user?.name }}
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-1 truncate" tabular>
            {{ authStore.user?.phone || authStore.user?.email || '-' }}
          </BaseText>
        </BaseCard>
      </div>

      <!-- Profile Details & Upcoming Modules -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BaseCard padding="p-6" class="lg:col-span-1">
          <BaseHeading as="h3" size="sm" weight="semibold" class="mb-4">
            Informasi Akun Sesi Aktif
          </BaseHeading>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <BaseText as="dt" size="sm" variant="muted">ID User</BaseText>
              <BaseText as="dd" size="sm" tabular weight="medium">{{ authStore.user?.id }}</BaseText>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <BaseText as="dt" size="sm" variant="muted">Nama</BaseText>
              <BaseText as="dd" size="sm" weight="medium">{{ authStore.user?.name }}</BaseText>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <BaseText as="dt" size="sm" variant="muted">Nomor Ponsel</BaseText>
              <BaseText as="dd" size="sm" tabular weight="medium">{{ authStore.user?.phone || '-' }}</BaseText>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100 dark:border-zinc-800/80">
              <BaseText as="dt" size="sm" variant="muted">Email</BaseText>
              <BaseText as="dd" size="sm" weight="medium">{{ authStore.user?.email || '-' }}</BaseText>
            </div>
            <div class="flex justify-between py-2">
              <BaseText as="dt" size="sm" variant="muted">Terdaftar Pada</BaseText>
              <BaseText as="dd" size="sm" tabular weight="medium">{{ authStore.user?.created_at || '-' }}</BaseText>
            </div>
          </dl>
        </BaseCard>

        <BaseCard padding="p-6" class="lg:col-span-2">
          <BaseHeading as="h3" size="sm" weight="semibold" class="mb-2">
            Modul Fitur Selanjutnya (Siap Dikembangkan)
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mb-4">
            Pondasi autentikasi Nomor Ponsel (OTP 6 Digit), Google OAuth, middleware `SetModuleContext`, dan koneksi SQLite `personal_app` sudah berjalan. Berikut modul yang siap dibangun pada tahap berikutnya:
          </BaseText>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div class="p-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40">
              <Wallet class="w-5 h-5 text-emerald-500 mb-2" />
              <BaseHeading as="p" size="sm" weight="medium">Finance Tracker</BaseHeading>
              <BaseText size="xs" variant="muted" class="mt-1">
                Dompet, kategori, transaksi pemasukan/pengeluaran, dan anggaran bulanan.
              </BaseText>
            </div>

            <router-link
              to="/habits"
              class="p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:border-emerald-400 transition-colors block"
            >
              <Sparkles class="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
              <BaseHeading as="p" size="sm" weight="medium">Habit Tracker & GitHub Heatmap</BaseHeading>
              <BaseText size="xs" variant="muted" class="mt-1">
                Good Habit (Hijau) & Remove Bad Habit (Putih/Merah) dengan kalender GitHub. Ketuk untuk membuka →
              </BaseText>
            </router-link>

            <router-link
              to="/todos"
              class="p-4 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-400 transition-colors block"
            >
              <CheckSquare class="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
              <BaseHeading as="p" size="sm" weight="medium">To-Do List & Sub-Checklist</BaseHeading>
              <BaseText size="xs" variant="muted" class="mt-1">
                Kelola tugas harian, sub-checklist, prioritas, dan deadline. Ketuk untuk membuka →
              </BaseText>
            </router-link>
          </div>
        </BaseCard>
      </div>
    </div>
  </AppShell>
</template>
