<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, ArrowLeft } from '@iconoir/vue'
import PinPadView from '@/components/ui/PinPadView.vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const pinPadRef = ref(null)
const setupStep = ref('create') // 'create' | 'confirm'
const firstPin = ref('')
const localError = ref('')
const failedAttempts = ref(0)

const isVisible = computed(() => {
  return authStore.isAuthenticated && (authStore.isPinLocked || authStore.needsPinSetup)
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
  return 'Masukkan PIN untuk membuka sesi akun Anda.'
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

    if (!res.success) {
      pinPadRef.value?.resetPin()
    }
    return
  }

  // Mode 2: Buka kunci aplikasi (Verifikasi PIN)
  const res = await authStore.verifyPin(enteredPin)
  if (res.success) {
    failedAttempts.value = 0
  } else {
    failedAttempts.value++
    pinPadRef.value?.resetPin()
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

// Watch visible state untuk kunci scroll body dan reset form saat modal aktif
watch(
  isVisible,
  (val) => {
    if (typeof document !== 'undefined') {
      if (val) {
        document.body.style.overflow = 'hidden'
        clearAllErrors()
        failedAttempts.value = 0
        setupStep.value = 'create'
        firstPin.value = ''
        pinPadRef.value?.resetPin()
      } else {
        document.body.style.overflow = ''
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <Teleport to="body">
    <div v-if="isVisible" class="fixed inset-0 z-[9999] select-none">
      <!-- 1. Backdrop Overlay with Blur (Mengaburkan data di belakangnya) -->
      <Transition
        appear
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          class="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md"
          aria-hidden="true"
        />
      </Transition>

      <!-- 2. Responsive PIN Modal Panel:
           - Mobile (< md): Docked bottom, fills the screen, slide-up from bottom (translate-y-full -> translate-y-0)
           - Desktop (>= md): Centered in viewport, scale transition (opacity-0 scale-95 -> opacity-100 scale-100)
      -->
      <div
        class="fixed inset-0 flex flex-col justify-end md:justify-center items-center pointer-events-none p-0 md:p-6"
      >
        <Transition
          appear
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
          enter-to-class="translate-y-0 md:opacity-100 md:scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="translate-y-0 md:opacity-100 md:scale-100"
          leave-to-class="translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
        >
          <div
            class="pointer-events-auto w-full h-screen h-dvh md:h-auto md:max-w-md bg-white dark:bg-zinc-900 border-t md:border border-slate-200 dark:border-zinc-800 md:rounded-3xl shadow-2xl flex flex-col justify-between overflow-y-auto px-5 pt-3 pb-safe md:p-8"
          >
            <!-- Mobile Top Drag Handle Indicator -->
            <div class="md:hidden flex justify-center pb-2">
              <div class="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
            </div>

            <!-- Top Action Row: Back Button (if in confirm step) & Logout Button -->
            <div class="w-full flex items-center justify-between min-h-[40px]">
              <div>
                <button
                  v-if="authStore.needsPinSetup && setupStep === 'confirm'"
                  type="button"
                  @click="handleBackInSetup"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Kembali"
                >
                  <ArrowLeft class="w-4 h-4" />
                  Kembali
                </button>
              </div>

              <!-- Tombol Keluar Akun -->
              <button
                type="button"
                @click="handleLogout"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 py-1.5 px-3 rounded-full transition-colors cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut class="w-4 h-4" />
                Keluar
              </button>
            </div>

            <!-- PIN Pad Content Area -->
            <div class="flex-1 flex flex-col justify-center my-auto">
              <PinPadView
                ref="pinPadRef"
                :title="pinTitle"
                :subtitle="pinSubtitle"
                :error-message="activeError"
                :loading="authStore.loading"
                :compact="true"
                @complete="handlePinComplete"
                @clear-error="clearAllErrors"
              >
                <!-- Below PIN (Muncul link reset bila salah 3x berturut-turut) -->
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
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>
