<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut } from 'lucide-vue-next'
import AuthMobileHeader from '@/components/layout/AuthMobileHeader.vue'
import AuthShell from '@/components/layout/AuthShell.vue'
import PinPadView from '@/components/ui/PinPadView.vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const pinPadRef = ref(null)
const setupStep = ref('create') // 'create' | 'confirm'
const firstPin = ref('')
const localError = ref('')

const isVisible = computed(() => {
  return authStore.isAuthenticated && (authStore.isPinLocked || authStore.needsPinSetup)
})

const headerTitle = computed(() => {
  if (authStore.needsPinSetup) {
    return setupStep.value === 'create' ? 'Buat PIN Baru' : 'Konfirmasi PIN'
  }
  return 'Kunci Keamanan'
})

const pinTitle = computed(() => {
  if (authStore.needsPinSetup) {
    return setupStep.value === 'create'
      ? 'Buat 6 Digit PIN Anda'
      : 'Ulangi 6 Digit PIN Anda'
  }
  return `Halo, ${authStore.user?.name || 'Pengguna'}!`
})

const pinSubtitle = computed(() => {
  if (authStore.needsPinSetup) {
    return setupStep.value === 'create'
      ? 'PIN ini digunakan setiap kali Anda masuk atau kembali ke aplikasi.'
      : 'Masukkan kembali 6 digit PIN yang baru saja Anda buat.'
  }
  const identifier = authStore.user?.phone || authStore.user?.email || ''
  return `Masukkan 6 digit PIN keamanan untuk membuka kembali sesi (${identifier})`
})

const activeError = computed(() => localError.value || authStore.errorMessage)

watch(isVisible, (val) => {
  if (val) {
    localError.value = ''
    authStore.clearErrors()
    setupStep.value = 'create'
    firstPin.value = ''
  }
})

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

  // Mode 1: Pertama kali setup PIN (setelah login Google pertama kali)
  if (authStore.needsPinSetup) {
    if (setupStep.value === 'create') {
      firstPin.value = enteredPin
      setupStep.value = 'confirm'
      pinPadRef.value?.resetPin()
      return
    }

    if (enteredPin !== firstPin.value) {
      localError.value = 'Konfirmasi PIN tidak sama. Silakan ulangi kembali.'
      pinPadRef.value?.resetPin()
      return
    }

    const res = await authStore.setupPin({
      pin: firstPin.value,
      pin_confirmation: enteredPin,
    })

    if (!res.success) {
      pinPadRef.value?.resetPin()
    }
    return
  }

  // Mode 2: Buka kunci aplikasi (App Lock / Returning Session)
  const res = await authStore.verifyPin(enteredPin)
  if (!res.success) {
    pinPadRef.value?.resetPin()
  }
}

async function handleSwitchAccount() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" class="fixed inset-0 z-[100] overflow-y-auto">
      <AuthShell>
        <template #header>
          <AuthMobileHeader
            :title="headerTitle"
            :show-back="authStore.needsPinSetup && setupStep === 'confirm'"
            @back="handleBackInSetup"
          />
        </template>

        <PinPadView
          ref="pinPadRef"
          :title="pinTitle"
          :subtitle="pinSubtitle"
          :error-message="activeError"
          :loading="authStore.loading"
          @complete="handlePinComplete"
          @clear-error="clearAllErrors"
        >
          <template #footer>
            <div class="text-center">
              <button
                type="button"
                @click="handleSwitchAccount"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-error dark:text-rose-300 hover:bg-error-container/60 dark:hover:bg-rose-950/40 py-2 px-4 rounded-md transition-colors cursor-pointer"
              >
                <LogOut class="w-3.5 h-3.5" />
                Ganti Akun / Keluar
              </button>
            </div>
          </template>
        </PinPadView>
      </AuthShell>
    </div>

  </Teleport>
</template>
