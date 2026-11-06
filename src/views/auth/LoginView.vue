<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowRight, SystemRestart } from '@iconoir/vue'
import AuthShell from '@/components/layout/AuthShell.vue'
import AuthMobileHeader from '@/components/layout/AuthMobileHeader.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import PhoneInput from '@/components/ui/PhoneInput.vue'
import PinPadView from '@/components/ui/PinPadView.vue'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { sanitizePhone, formatPhoneDisplay } from '@/utils/phoneUtils'
import { usePhoneFormatter } from '@/composables/usePhoneFormatter'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 'phone' | 'enter-pin' | 'create-pin' | 'confirm-pin'
const step = ref('phone')
const { phone, onInput } = usePhoneFormatter('')
const firstPin = ref('')
const localError = ref('')
const pinPadRef = ref(null)

const isPhoneValid = computed(() => {
  const clean = sanitizePhone(phone.value)
  return /^628[1-9][0-9]{6,11}$/.test(clean)
})

const headerTitle = computed(() => {
  if (step.value === 'enter-pin') return 'Masukkan PIN'
  if (step.value === 'create-pin') return 'Buat PIN Baru'
  if (step.value === 'confirm-pin') return 'Konfirmasi PIN'
  return 'Masuk'
})

const pinScreenTitle = computed(() => {
  if (step.value === 'enter-pin') return 'Masukkan 6 Digit PIN'
  if (step.value === 'create-pin') return 'Buat 6 Digit PIN Baru'
  return 'Konfirmasi 6 Digit PIN'
})

const pinScreenSubtitle = computed(() => {
  const display = formatPhoneDisplay(phone.value)
  if (step.value === 'enter-pin') {
    return `Masukkan PIN keamanan untuk nomor ${display}`
  }
  if (step.value === 'create-pin') {
    return `Nomor ${display} baru pertama kali masuk. Buat 6 digit PIN Anda.`
  }
  return 'Masukkan kembali 6 digit PIN yang baru saja Anda buat.'
})

const activeErrorMessage = computed(() => localError.value || authStore.errorMessage)

function clearAllErrors() {
  localError.value = ''
  authStore.clearErrors()
}

onMounted(async () => {
  clearAllErrors()

  const googleToken = route.query.google_token
  const googleError = route.query.google_error

  if (googleToken) {
    const res = await authStore.loginWithToken(String(googleToken))
    if (res.success) {
      router.replace('/dashboard')
    }
  } else if (googleError) {
    authStore.errorMessage = String(googleError)
  }
})

async function handleCheckPhone() {
  if (!isPhoneValid.value) return
  clearAllErrors()

  const cleanPhone = sanitizePhone(phone.value)
  const res = await authStore.checkPhone(cleanPhone)
  if (res.success) {
    firstPin.value = ''
    if (res.data.has_pin) {
      step.value = 'enter-pin'
    } else {
      step.value = 'create-pin'
    }
  }
}

async function handlePinCompleted(enteredPin) {
  clearAllErrors()
  const cleanPhone = sanitizePhone(phone.value)

  // 1. Jika user lama memasukkan PIN
  if (step.value === 'enter-pin') {
    const res = await authStore.authenticateWithPhonePin({
      phone: cleanPhone,
      pin: enteredPin,
    })
    if (res.success) {
      router.push('/dashboard')
    } else {
      pinPadRef.value?.resetPin()
    }
    return
  }

  // 2. Jika user baru membuat PIN (Langkah 1)
  if (step.value === 'create-pin') {
    firstPin.value = enteredPin
    step.value = 'confirm-pin'
    pinPadRef.value?.resetPin()
    return
  }

  // 3. Jika user baru mengonfirmasi PIN (Langkah 2)
  if (step.value === 'confirm-pin') {
    if (enteredPin !== firstPin.value) {
      localError.value = 'Konfirmasi PIN tidak cocok. Silakan coba lagi.'
      pinPadRef.value?.resetPin()
      return
    }

    const res = await authStore.authenticateWithPhonePin({
      phone: cleanPhone,
      pin: firstPin.value,
      pin_confirmation: enteredPin,
    })

    if (res.success) {
      router.push('/dashboard')
    } else {
      pinPadRef.value?.resetPin()
    }
  }
}

function handleBack() {
  clearAllErrors()
  if (step.value === 'confirm-pin') {
    firstPin.value = ''
    step.value = 'create-pin'
    pinPadRef.value?.resetPin()
  } else {
    firstPin.value = ''
    step.value = 'phone'
  }
}

async function handleGoogleSuccess(payload) {
  clearAllErrors()
  const result = await authStore.loginWithGoogle(payload)
  if (result.success) {
    router.push('/dashboard')
  }
}

async function handleGoogleRedirect() {
  clearAllErrors()
  authStore.loading = true
  try {
    const res = await authService.getGoogleRedirectUrl()
    if (res.data?.url) {
      window.location.assign(res.data.url)
      return
    }
    authStore.loading = false
  } catch (err) {
    authStore.loading = false
    authStore.errorMessage =
      err.response?.data?.errors?.google?.[0] ||
      err.response?.data?.message ||
      'Gagal menghubungkan ke server Google OAuth.'
  }
}

function handleGoogleError(message) {
  authStore.errorMessage = message
}
</script>

<template>
  <AuthShell :keyboard-aware="step === 'phone'">
    <!-- Top Mobile Header / App Brand Header -->
    <template #header>
      <div v-if="step === 'phone'" class="w-full flex items-center justify-end pt-1">
        <!-- Theme Toggle -->
        <ThemeToggle />
      </div>

      <AuthMobileHeader
        v-else
        :title="headerTitle"
        show-back
        @back="handleBack"
      />
    </template>

    <!-- STEP 1: INPUT NOMOR TELEPON -->
    <main v-if="step === 'phone'" class="flex-1 flex flex-col justify-start pt-2 md:pt-4 pb-6">
      <div class="space-y-6 ">
        <!-- Selamat Datang Heading -->
        <div class="flex flex-col text-center pt-2">
          <h1 class="text-[26px] md:text-[28px] text-slate-900 dark:text-zinc-100 font-bold tracking-tight">
            Selamat Datang!
          </h1>
          <p class="text-sm md:text-base text-slate-500 dark:text-zinc-400 mt-1">
            Masuk untuk memulanjutkan.
          </p>
        </div>

        <!-- Form Phone Input & Actions -->
        <form
          id="loginForm"
          @submit.prevent="handleCheckPhone"
          class="flex flex-col gap-4 px-1"
          novalidate
        >
          <PhoneInput
            v-model="phone"
            @input="onInput"
            label="Nomor Ponsel Aktif"
            placeholder="812-3456-7890"
            :disabled="authStore.loading"
            :error="authStore.validationErrors.phone"
          />

          <!-- Action Stack -->
          <div class="flex flex-col gap-3 mt-2">
            <!-- Tombol Utama: Lanjutkan (Primary Deep Forest) -->
            <button
              id="submitBtn"
              type="submit"
              :disabled="!isPhoneValid || authStore.loading"
              class="w-full py-3.5 px-6 rounded-full bg-[#144229] hover:bg-[#2d5a3f] dark:bg-[#a1d2af] text-white dark:text-[#002110] font-semibold shadow-[0_10px_30px_rgba(20,66,41,0.18)] dark:shadow-[0_4px_16px_rgba(161,210,175,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <SystemRestart v-if="authStore.loading" class="w-5 h-5 animate-spin" />
              <template v-else>
                <span class="text-[16px] font-semibold">Lanjutkan</span>
                <ArrowRight class="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </template>
            </button>

            
        <BaseAlert
          v-if="activeErrorMessage"
          variant="error"
          :message="activeErrorMessage"
        />


            <!-- Divider: ATAU -->
            <div class="relative flex py-1.5 items-center">
              <div class="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
              <span class="flex-shrink mx-4 text-slate-400 dark:text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                Atau
              </span>
              <div class="flex-grow border-t border-slate-200 dark:border-zinc-800"></div>
            </div>

            <!-- Tombol Google Login (di bawah Lanjutkan) -->
            <GoogleLoginButton
              label="Lanjutkan dengan Google"
              :loading="authStore.loading"
              @success="handleGoogleSuccess"
              @redirect="handleGoogleRedirect"
              @error="handleGoogleError"
            />
          </div>
        </form>
      </div>
    </main>

    <!-- STEP 2: ON-SCREEN NUMPAD 6-DIGIT PIN (ENTER / CREATE / CONFIRM) -->
    <PinPadView
      v-else
      ref="pinPadRef"
      :title="pinScreenTitle"
      :subtitle="pinScreenSubtitle"
      :error-message="activeErrorMessage"
      :loading="authStore.loading"
      @complete="handlePinCompleted"
      @clear-error="clearAllErrors"
    />
  </AuthShell>
</template>
