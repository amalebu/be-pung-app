<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LogOut, ArrowLeft } from '@iconoir/vue'
import AuthShell from '@/components/layout/AuthShell.vue'
import PinPadView from '@/components/ui/PinPadView.vue'
import { useAuthStore } from '@/stores/authStore'
import { formatPhoneDisplay } from '@/utils/phoneUtils'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const pinPadRef = ref(null)
const setupStep = ref('create') // 'create' | 'confirm'
const firstPin = ref('')
const localError = ref('')
const failedAttempts = ref(0)

const redirectTarget = computed(() => {
  const target = route.query.redirect
  if (target && typeof target === 'string' && target.startsWith('/') && target !== '/verify-pin') {
    return target
  }
  return '/dashboard'
})

const pinTitle = computed(() => {
  if (authStore.needsPinSetup) {
    return setupStep.value === 'create'
      ? 'Buat 6 Digit PIN'
      : 'Konfirmasi PIN'
  }
  return 'Masukan PIN'
})

const pinSubtitle = computed(() => {
  if (authStore.needsPinSetup) {
    return setupStep.value === 'create'
      ? 'Buat 6 digit PIN keamanan akun Anda.'
      : 'Masukkan kembali 6 digit PIN yang baru saja Anda buat.'
  }
  return ''
})

const activeError = computed(() => localError.value || authStore.errorMessage)

function clearAllErrors() {
  localError.value = ''
  authStore.clearErrors()
}

function handleBackInSetup() {
  if (authStore.needsPinSetup && setupStep.value === 'confirm') {
    setupStep.value = 'create'
    firstPin.value = ''
    clearAllErrors()
    pinPadRef.value?.resetPin()
  }
}

async function handlePinComplete(enteredPin) {
  clearAllErrors()

  // Mode 1: Pertama kali setup PIN (misal setelah login Google pertama kali)
  if (authStore.needsPinSetup) {
    if (setupStep.value === 'create') {
      firstPin.value = enteredPin
      setupStep.value = 'confirm'
      pinPadRef.value?.resetPin()
      return
    }

    if (enteredPin !== firstPin.value) {
      localError.value = 'Konfirmasi PIN tidak cocok. Silakan coba lagi.'
      pinPadRef.value?.resetPin()
      return
    }

    const res = await authStore.setupPin({
      pin: firstPin.value,
      pin_confirmation: enteredPin,
    })

    if (res.success) {
      router.replace(redirectTarget.value)
    } else {
      pinPadRef.value?.resetPin()
    }
    return
  }

  // Mode 2: Buka kunci aplikasi (Verifikasi PIN)
  const res = await authStore.verifyPin(enteredPin)
  if (res.success) {
    failedAttempts.value = 0
    router.replace(redirectTarget.value)
  } else {
    failedAttempts.value++
    pinPadRef.value?.resetPin()
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  clearAllErrors()
  failedAttempts.value = 0

  // Jika belum login, redirect ke login
  if (!authStore.isAuthenticated) {
    router.replace('/login')
    return
  }

  // Jika tidak terkunci dan tidak butuh setup PIN, langsung ke target
  if (!authStore.isPinLocked && !authStore.needsPinSetup) {
    router.replace(redirectTarget.value)
  }
})
</script>

<template>
  <AuthShell>
    <!-- Header: Tombol Logout di sebelah kiri atas (tanpa nama user & tanpa logo) -->
    <template #header>
      <div class="w-full flex items-center justify-end pt-1 gap-2">
        <!-- Kiri Atas: Tombol Logout (atau tombol Kembali jika sedang konfirmasi PIN baru) -->
         <span>Keluar</span>
        <button
          v-if="authStore.needsPinSetup && setupStep === 'confirm'"
          type="button"
          @click="handleBackInSetup"
          class="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer shadow-xs"
          aria-label="Kembali ke langkah sebelumnya"
          title="Kembali"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>

        <button
          v-else
          type="button"
          @click="handleLogout"
          class="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 active:scale-95 transition-all cursor-pointer shadow-xs"
          aria-label="Keluar dari akun"
          title="Keluar"
        >
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </template>

    <!-- Konten Utama PIN Pad -->
    <PinPadView
      ref="pinPadRef"
      :title="pinTitle"
      :subtitle="pinSubtitle"
      :error-message="activeError"
      :loading="authStore.loading"
      @complete="handlePinComplete"
      @clear-error="clearAllErrors"
      class="pt-6"
    >
      <!-- Slot Bawah Input PIN: Tombol Lupa PIN (Muncul setelah 3x salah PIN) -->
      <template #below-pin>
        <div v-if="failedAttempts >= 3" class="pt-2">
          <button
            type="button"
            @click="handleLogout"
            class="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer transition-colors"
          >
            Lupa PIN? Masuk Ulang
          </button>
        </div>
      </template>
    </PinPadView>
  </AuthShell>
</template>
