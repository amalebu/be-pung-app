<script setup>
import { ref, computed, onMounted } from 'vue'
import { User, Phone, Key, CheckCircle, WarningCircle, ShieldCheck, Link, FloppyDisk, ArrowLeft, Lock } from '@iconoir/vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import SecondaryButton from '@/components/ui/SecondaryButton.vue'
import DefaultAvatar from '@/components/ui/DefaultAvatar.vue'
import GoogleLoginButton from '@/components/ui/GoogleLoginButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { useAuthStore } from '@/stores/authStore'
import { sanitizePhone, formatPhoneDisplay } from '@/utils/phoneUtils'
import { usePhoneFormatter } from '@/composables/usePhoneFormatter'

const router = useRouter()
const authStore = useAuthStore()

// State edit profil umum
const name = ref('')
const avatarPreview = ref(null)
const profileSaving = ref(false)
const profileSuccess = ref('')
const profileError = ref('')

// State tautkan nomor HP & PIN
const isPhoneLinkingOpen = ref(false)
const { phone: newPhoneInput, onInput: onNewPhoneInput } = usePhoneFormatter('')
const newPin = ref('')
const newPinConfirm = ref('')
const phoneLinkingSaving = ref(false)
const phoneLinkingSuccess = ref('')
const phoneLinkingError = ref('')

// State tautkan Google
const googleLinkingSuccess = ref('')
const googleLinkingError = ref('')

const isGoogleLinked = computed(() => Boolean(authStore.user?.google_id))
const isPhoneLinked = computed(() => Boolean(authStore.user?.phone))

const isNewPhoneValid = computed(() => {
  const sanitized = sanitizePhone(newPhoneInput.value)
  return /^628[1-9][0-9]{6,11}$/.test(sanitized)
})

const isNewPinValid = computed(() => {
  return /^\d{6}$/.test(newPin.value) && newPin.value === newPinConfirm.value
})

onMounted(async () => {
  if (authStore.user) {
    name.value = authStore.user.name || ''
    avatarPreview.value = authStore.user.avatar || null
  }
  // Refresh data user terbaru
  const refreshed = await authStore.fetchMe()
  if (refreshed) {
    name.value = refreshed.name || ''
    avatarPreview.value = refreshed.avatar || null
  }
})

function onAvatarChanged(base64DataUrl) {
  avatarPreview.value = base64DataUrl
  profileSuccess.value = ''
  profileError.value = ''
  // Langsung simpan foto profil ke server & lokal
  handleSaveProfile()
}

function onAvatarError(errorMessage) {
  profileError.value = errorMessage
}

async function handleSaveProfile() {
  if (!name.value.trim()) {
    profileError.value = 'Nama lengkap wajib diisi.'
    return
  }

  profileSaving.value = true
  profileError.value = ''
  profileSuccess.value = ''

  const payload = {
    name: name.value.trim(),
  }

  if (avatarPreview.value) {
    payload.avatar = avatarPreview.value
  }

  const res = await authStore.updateProfile(payload)
  profileSaving.value = false

  if (res.success) {
    profileSuccess.value = 'Profil Anda berhasil diperbarui!'
    setTimeout(() => {
      profileSuccess.value = ''
    }, 4000)
  } else {
    profileError.value =
      authStore.validationErrors?.name?.[0] ||
      authStore.validationErrors?.avatar?.[0] ||
      authStore.errorMessage ||
      'Gagal menyimpan profil.'
  }
}

async function handleLinkPhone() {
  phoneLinkingError.value = ''
  phoneLinkingSuccess.value = ''

  const sanitized = sanitizePhone(newPhoneInput.value)
  if (!sanitized) {
    phoneLinkingError.value = 'Nomor ponsel wajib diisi.'
    return
  }

  if (!isNewPhoneValid.value) {
    phoneLinkingError.value = 'Format nomor ponsel tidak valid. Gunakan format nomor Indonesia (contoh: 081234567890).'
    return
  }

  if (!/^\d{6}$/.test(newPin.value)) {
    phoneLinkingError.value = 'PIN harus terdiri dari 6 digit angka.'
    return
  }

  if (newPin.value !== newPinConfirm.value) {
    phoneLinkingError.value = 'Konfirmasi PIN tidak cocok dengan PIN yang dimasukkan.'
    return
  }

  phoneLinkingSaving.value = true
  const res = await authStore.linkPhoneAccount({
    phone: sanitized,
    pin: newPin.value,
    pin_confirmation: newPinConfirm.value,
  })
  phoneLinkingSaving.value = false

  if (res.success) {
    phoneLinkingSuccess.value = 'Nomor ponsel & PIN berhasil ditautkan! Anda kini dapat login menggunakan nomor HP dan PIN ini.'
    isPhoneLinkingOpen.value = false
    newPhoneInput.value = ''
    newPin.value = ''
    newPinConfirm.value = ''
    setTimeout(() => {
      phoneLinkingSuccess.value = ''
    }, 5000)
  } else {
    phoneLinkingError.value =
      authStore.validationErrors?.phone?.[0] ||
      authStore.validationErrors?.pin?.[0] ||
      authStore.errorMessage ||
      'Gagal menautkan nomor ponsel.'
  }
}

async function handleGoogleSuccess(payload) {
  googleLinkingError.value = ''
  googleLinkingSuccess.value = ''

  const res = await authStore.linkGoogleAccount(payload)
  if (res.success) {
    googleLinkingSuccess.value = 'Akun Google berhasil ditautkan ke profil Anda!'
    setTimeout(() => {
      googleLinkingSuccess.value = ''
    }, 5000)
  } else {
    googleLinkingError.value =
      authStore.validationErrors?.google?.[0] ||
      authStore.errorMessage ||
      'Gagal menautkan akun Google.'
  }
}

function handleGoogleError(msg) {
  googleLinkingError.value = msg
}

async function handleGoogleRedirect() {
  try {
    const res = await authStore.getGoogleRedirectUrl()
    if (res?.data?.url) {
      window.location.href = res.data.url
    }
  } catch (err) {
    googleLinkingError.value = err.message || 'Gagal memulai otorisasi Google.'
  }
}
</script>

<template>
  <AppShell>
    <div class="space-y-4 md:space-y-6 max-w-4xl mx-auto">
      <!-- Breadcrumb & Page Header -->
      <div class="flex items-center justify-between">
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
              Profil Pengguna
            </BaseHeading>
            <BaseText size="sm" variant="muted" class="mt-0.5 hidden md:block">
              Kelola identitas, foto profil, dan tautkan akun login Anda
            </BaseText>
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-semibold">
          <ShieldCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Multi-Auth Terpadu</span>
        </div>
      </div>

      <!-- Section 1: Profil & Foto Avatar -->
      <BaseCard class="p-4 sm:p-6">
        <div class="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200/80 dark:border-zinc-800">
          <User class="w-5 h-5 text-emerald-600 dark:text-lime-400" />
          <BaseHeading as="h2" size="md" weight="semibold">
            Identitas Profil
          </BaseHeading>
        </div>

        <div class="space-y-6">
          <!-- Avatar Picker -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-6">
            <div class="flex flex-col items-center sm:items-start gap-2">
              <DefaultAvatar
                :avatar-url="avatarPreview"
                :name="name || authStore.user?.name || 'Pengguna'"
                size="2xl"
                editable
                :loading="profileSaving"
                @change="onAvatarChanged"
                @error="onAvatarError"
              />
              <span class="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                Klik foto untuk mengganti
              </span>
            </div>

            <div class="flex-1 space-y-1.5 text-center sm:text-left">
              <BaseHeading as="h3" size="sm" weight="semibold">
                Foto Profil
              </BaseHeading>
              <BaseText size="xs" variant="muted" class="max-w-md">
                Gunakan foto asli atau inisial avatar tactile. Gambar akan otomatis dioptimalkan dan dikompresi di browser (maksimal 256x256 px) agar ringan dan cepat saat offline.
              </BaseText>
            </div>
          </div>

          <!-- Alert Pesan Sukses / Error -->
          <BaseAlert v-if="profileSuccess" variant="success">
            {{ profileSuccess }}
          </BaseAlert>
          <BaseAlert v-if="profileError" variant="error">
            {{ profileError }}
          </BaseAlert>

          <!-- Input Nama Lengkap -->
          <form @submit.prevent="handleSaveProfile" class="space-y-4 max-w-lg">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1.5">
                Nama Lengkap
              </label>
              <input
                v-model="name"
                type="text"
                placeholder="Nama lengkap Anda"
                required
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pod-lime transition-all text-sm font-medium"
              />
            </div>

            <div class="flex justify-start">
              <PrimaryButton
                type="submit"
                size="md"
                :loading="profileSaving"
                class="w-full sm:w-auto"
              >
                <FloppyDisk class="w-4 h-4 mr-2" />
                Simpan Profil
              </PrimaryButton>
            </div>
          </form>
        </div>
      </BaseCard>

      <!-- Section 2: Hubungkan Akun (Account Linking) -->
      <BaseCard class="p-4 sm:p-6">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80 dark:border-zinc-800">
          <div class="flex items-center gap-2">
            <Link class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <BaseHeading as="h2" size="md" weight="semibold">
              Hubungkan Metode Masuk (Account Linking)
            </BaseHeading>
          </div>
        </div>

        <BaseText size="xs" variant="muted" class="mb-6">
          Hubungkan nomor ponsel dan akun Google ke 1 akun PersonalApp yang sama. Setelah terhubung, Anda dapat masuk bergantian lewat nomor HP + PIN maupun lewat Google.
        </BaseText>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Card 2.1: Akun Google -->
          <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <BaseHeading as="h3" size="sm" weight="semibold">
                      Akun Google
                    </BaseHeading>
                    <BaseText size="xs" variant="muted">
                      Login satu klik dengan Google
                    </BaseText>
                  </div>
                </div>

                <span
                  v-if="isGoogleLinked"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                >
                  <CheckCircle class="w-3.5 h-3.5" />
                  Terhubung
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                >
                  Belum Terhubung
                </span>
              </div>

              <div v-if="authStore.user?.email" class="my-3 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80">
                <span class="text-[11px] text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider block">
                  Email Terdaftar
                </span>
                <span class="text-sm font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                  {{ authStore.user.email }}
                </span>
              </div>

              <!-- Alerts -->
              <BaseAlert v-if="googleLinkingSuccess" variant="success" class="my-2">
                {{ googleLinkingSuccess }}
              </BaseAlert>
              <BaseAlert v-if="googleLinkingError" variant="error" class="my-2">
                {{ googleLinkingError }}
              </BaseAlert>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-200/70 dark:border-zinc-800">
              <div v-if="isGoogleLinked" class="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle class="w-4 h-4 shrink-0" />
                <span>Akun Google ini telah terhubung dan aktif untuk masuk.</span>
              </div>
              <div v-else>
                <GoogleLoginButton
                  label="Tautkan Akun Google Ini"
                  @success="handleGoogleSuccess"
                  @error="handleGoogleError"
                  @redirect="handleGoogleRedirect"
                  class="w-full text-xs py-2.5"
                />
              </div>
            </div>
          </div>

          <!-- Card 2.2: Nomor Ponsel & PIN -->
          <div class="p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shadow-xs text-emerald-600 dark:text-lime-400">
                    <Phone class="w-4 h-4" />
                  </div>
                  <div>
                    <BaseHeading as="h3" size="sm" weight="semibold">
                      Nomor HP & PIN
                    </BaseHeading>
                    <BaseText size="xs" variant="muted">
                      Login aman nomor ponsel Indonesia
                    </BaseText>
                  </div>
                </div>

                <span
                  v-if="isPhoneLinked"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                >
                  <CheckCircle class="w-3.5 h-3.5" />
                  Terhubung
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                >
                  Belum Terhubung
                </span>
              </div>

              <!-- Info Nomor Ponsel Terdaftar -->
              <div v-if="isPhoneLinked" class="my-3 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80">
                <span class="text-[11px] text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider block">
                  Nomor Ponsel Aktif
                </span>
                <div class="flex items-center justify-between mt-0.5">
                  <span class="text-sm font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                    {{ formatPhoneDisplay(authStore.user?.phone) }}
                  </span>
                  <span class="text-xs text-emerald-600 dark:text-lime-400 font-medium flex items-center gap-1">
                    <Key class="w-3.5 h-3.5" />
                    PIN Aktif
                  </span>
                </div>
              </div>

              <!-- Alerts -->
              <BaseAlert v-if="phoneLinkingSuccess" variant="success" class="my-2">
                {{ phoneLinkingSuccess }}
              </BaseAlert>
              <BaseAlert v-if="phoneLinkingError" variant="error" class="my-2">
                {{ phoneLinkingError }}
              </BaseAlert>

              <!-- Form Tautkan Nomor HP & Buat PIN (jika belum terhubung atau sedang dibuka) -->
              <div v-if="!isPhoneLinked || isPhoneLinkingOpen" class="mt-3 space-y-3 p-4 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
                <BaseHeading as="h4" size="xs" weight="semibold">
                  {{ isPhoneLinked ? 'Ganti Nomor Ponsel & PIN' : 'Tautkan Nomor Ponsel' }}
                </BaseHeading>

                <!-- Input Nomor Telepon -->
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                    Nomor HP Indonesia (08... / 8...)
                  </label>
                  <div class="relative flex items-center">
                    <span class="absolute left-3 text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
                      +62
                    </span>
                    <input
                      v-model="newPhoneInput"
                      @input="onNewPhoneInput"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9\-]*"
                      maxlength="17"
                      placeholder="852-3472-9615"
                      class="w-full pl-12 pr-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-pod-lime"
                    />
                  </div>
                  <span class="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">
                    Otomatis disimpan dalam format steril 628xxxxxxxx.
                  </span>
                </div>

                <!-- Input PIN 6 Digit -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                      PIN Baru (6 Digit)
                    </label>
                    <input
                      v-model="newPin"
                      type="password"
                      inputmode="numeric"
                      maxlength="6"
                      placeholder="••••••"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-pod-lime"
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                      Konfirmasi PIN
                    </label>
                    <input
                      v-model="newPinConfirm"
                      type="password"
                      inputmode="numeric"
                      maxlength="6"
                      placeholder="••••••"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-pod-lime"
                    />
                  </div>
                </div>

                <div class="flex items-center gap-2 pt-2">
                  <PrimaryButton
                    type="button"
                    size="xs"
                    :loading="phoneLinkingSaving"
                    :disabled="!isNewPhoneValid || !isNewPinValid"
                    @click="handleLinkPhone"
                    class="w-full"
                  >
                    Simpan & Tautkan Nomor
                  </PrimaryButton>

                  <SecondaryButton
                    v-if="isPhoneLinked"
                    type="button"
                    size="xs"
                    @click="isPhoneLinkingOpen = false"
                  >
                    Batal
                  </SecondaryButton>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-200/70 dark:border-zinc-800">
              <div v-if="isPhoneLinked && !isPhoneLinkingOpen" class="flex items-center justify-between">
                <span class="text-xs text-slate-500 dark:text-zinc-400">
                  Ingin mengganti nomor ponsel?
                </span>
                <button
                  type="button"
                  @click="isPhoneLinkingOpen = true"
                  class="text-xs text-emerald-600 dark:text-lime-400 hover:underline font-semibold cursor-pointer"
                >
                  Ubah Nomor / PIN
                </button>
              </div>

              <div v-else-if="!isPhoneLinked && !isPhoneLinkingOpen">
                <button
                  type="button"
                  @click="isPhoneLinkingOpen = true"
                  class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                >
                  <Phone class="w-3.5 h-3.5" />
                  <span>Tautkan Nomor HP & PIN Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </AppShell>
</template>
