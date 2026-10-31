<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthShell from '@/components/layout/AuthShell.vue'
import AuthMobileHeader from '@/components/layout/AuthMobileHeader.vue'
import PhoneInput from '@/components/ui/PhoneInput.vue'
import PinPadView from '@/components/ui/PinPadView.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 'phone' | 'enter-pin' | 'create-pin' | 'confirm-pin'
const step = ref('phone')
const phone = ref('')
const firstPin = ref('')
const localError = ref('')
const pinPadRef = ref(null)

const isPhoneValid = computed(() => {
  const clean = phone.value.replace(/[^0-9]/g, '')
  return clean.length >= 8 && clean.length <= 13 && clean.startsWith('8')
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
  if (step.value === 'enter-pin') {
    return `Masukkan PIN keamanan untuk nomor +62 ${phone.value}`
  }
  if (step.value === 'create-pin') {
    return `Nomor +62 ${phone.value} baru pertama kali masuk. Buat 6 digit PIN Anda.`
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

  const res = await authStore.checkPhone(phone.value)
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

  // 1. Jika user lama memasukkan PIN
  if (step.value === 'enter-pin') {
    const res = await authStore.authenticateWithPhonePin({
      phone: phone.value,
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
      phone: phone.value,
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
    <!-- Top Mobile Header -->
    <template #header>
      <AuthMobileHeader
        :title="headerTitle"
        :show-back="step !== 'phone'"
        @back="handleBack"
      />
    </template>

    <!-- STEP 1: INPUT NOMOR TELEPON -->
    <main v-if="step === 'phone'" class="flex-1 pt-8">
      <div class="space-y-8">
        <div class="space-y-1.5">
          <h1
            class="text-[32px] leading-[38px] md:text-[44px] md:leading-[52px] font-normal tracking-[-0.02em] md:tracking-[-0.03em] text-slate-900 dark:text-zinc-100"
          >
            Selamat Datang!
          </h1>
          <p class="text-base text-slate-500 dark:text-zinc-400 italic">
            Masuk untuk melanjutkan.
          </p>
        </div>

        <BaseAlert
          v-if="activeErrorMessage"
          variant="error"
          :message="activeErrorMessage"
        />

        <form
          id="login-form"
          @submit.prevent="handleCheckPhone"
          novalidate
        >
          <PhoneInput
            v-model="phone"
            label="Masukkan Nomor Ponsel Anda"
            placeholder="81234567890"
            :disabled="authStore.loading"
            :error="authStore.validationErrors.phone"
          />
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

    <!-- Bottom stack: Login dengan Google (menggantikan baris Syarat & Ketentuan) + tombol utama -->
    <template v-if="step === 'phone'" #footer>
      <div class="space-y-3">
        <GoogleLoginButton
          label="Login dengan Google"
          :loading="authStore.loading"
          @success="handleGoogleSuccess"
          @redirect="handleGoogleRedirect"
          @error="handleGoogleError"
        />

        <PrimaryButton
          type="submit"
          form="login-form"
          size="lg"
          block
          :disabled="!isPhoneValid"
          :loading="authStore.loading"
        >
          Lanjutkan
        </PrimaryButton>
      </div>
    </template>
  </AuthShell>
</template>