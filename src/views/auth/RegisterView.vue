<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UserPlus, ShieldCheck } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

onMounted(() => {
  authStore.clearErrors()
})

async function handleSubmit() {
  const result = await authStore.register({
    name: form.name,
    email: form.email,
    password: form.password,
    password_confirmation: form.password_confirmation,
  })
  if (result.success) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-zinc-950 px-4 py-6">
    <!-- Top Navbar Bar -->
    <AppNavbar />

    <!-- Main Auth Card -->
    <div class="max-w-md w-full mx-auto my-8">
      <BaseCard padding="p-6 sm:p-8">
        <div class="mb-6">
          <BaseBadge variant="emerald" size="sm" class="mb-3">
            <ShieldCheck class="w-3.5 h-3.5" />
            Registrasi Baru • PersonalApp
          </BaseBadge>

          <BaseHeading as="h1" size="xl" weight="semibold">
            Buat Akun PersonalApp
          </BaseHeading>

          <BaseText size="sm" variant="muted" class="mt-1">
            Data akun Anda tersimpan secara terisolasi di database modul `personal_app.sqlite`.
          </BaseText>
        </div>

        <BaseAlert
          v-if="authStore.errorMessage"
          variant="error"
          :message="authStore.errorMessage"
          class="mb-5"
        />

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <BaseInput
            id="name"
            v-model="form.name"
            label="Nama Lengkap"
            type="text"
            placeholder="Contoh: Ama Lebu"
            autocomplete="name"
            required
            :error="authStore.validationErrors.name"
          />

          <BaseInput
            id="email"
            v-model="form.email"
            label="Alamat Email"
            type="email"
            placeholder="nama@email.com"
            autocomplete="email"
            required
            :error="authStore.validationErrors.email"
          />

          <BaseInput
            id="password"
            v-model="form.password"
            label="Password"
            type="password"
            placeholder="Minimal 8 karakter"
            autocomplete="new-password"
            required
            hint="Gunakan minimal 8 karakter."
            :error="authStore.validationErrors.password"
          />

          <BaseInput
            id="password_confirmation"
            v-model="form.password_confirmation"
            label="Konfirmasi Password"
            type="password"
            placeholder="Ulangi password"
            autocomplete="new-password"
            required
            :error="authStore.validationErrors.password_confirmation"
          />

          <div class="pt-2">
            <PrimaryButton
              type="submit"
              block
              :loading="authStore.loading"
            >
              <UserPlus v-if="!authStore.loading" class="w-4 h-4" />
              Daftar & Masuk
            </PrimaryButton>
          </div>
        </form>

        <div class="mt-6 pt-5 border-t border-slate-200 dark:border-zinc-800 text-center">
          <BaseText size="sm" variant="muted">
            Sudah punya akun?
            <router-link
              to="/login"
              class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
            >
              Masuk di sini
            </router-link>
          </BaseText>
        </div>
      </BaseCard>
    </div>

    <!-- Footer -->
    <div class="max-w-md w-full mx-auto text-center">
      <BaseText size="xs" variant="muted">
        Terhubung ke `laravelAPI` (`https://local.amalebu.test`) • SQLite Isolated
      </BaseText>
    </div>
  </div>
</template>
