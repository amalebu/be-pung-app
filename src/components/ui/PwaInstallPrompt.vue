<script setup>
import { ref } from 'vue'
import { Download, X, Share2, PlusSquare } from 'lucide-vue-next'
import { usePwa } from '@/composables/usePwa'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'

const {
  canInstall,
  isInstalled,
  isIos,
  isDismissed,
  installPwa,
  dismissPrompt,
} = usePwa()

const showIosGuide = ref(false)

async function handleInstall() {
  if (isIos.value) {
    showIosGuide.value = true
  } else {
    await installPwa()
  }
}
</script>

<template>
  <!-- Install Prompt Banner (Visible on mobile/desktop if not installed & not dismissed) -->
  <aside
    v-if="!isInstalled && !isDismissed && (canInstall || isIos)"
    class="fixed top-4 inset-x-4 md:inset-x-auto md:right-4 md:w-96 z-50 bg-white dark:bg-zinc-900 border border-pod-sage/10 dark:border-zinc-800 rounded-pod p-4 shadow-floating backdrop-blur-md transition-all duration-300"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-md bg-pod-sage flex items-center justify-center text-white shrink-0 shadow-xs font-bold text-base">
          P
        </div>
        <div>
          <BaseHeading as="h4" size="sm" weight="semibold">
            Install PersonalApp
          </BaseHeading>
          <BaseText size="xs" variant="muted" class="mt-0.5">
            Akses instan di layar utama ponsel Anda tanpa perlu membuka browser.
          </BaseText>
        </div>
      </div>

      <button
        type="button"
        @click="dismissPrompt"
        class="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-md transition-colors cursor-pointer"
        title="Tutup ajakan"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Actions -->
    <div class="mt-3.5 flex items-center gap-2">
      <PrimaryButton
        size="sm"
        block
        @click="handleInstall"
      >
        <Download class="w-3.5 h-3.5" />
        {{ isIos ? 'Cara Pasang di iPhone' : 'Pasang Aplikasi' }}
      </PrimaryButton>

      <button
        type="button"
        @click="dismissPrompt"
        class="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
      >
        Nanti
      </button>
    </div>

    <!-- Special iOS Safari Instructions -->
    <div
      v-if="showIosGuide"
      class="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs space-y-1.5 text-slate-600 dark:text-zinc-300"
    >
      <p class="font-medium flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
        <Share2 class="w-3.5 h-3.5" /> 1. Ketuk tombol 'Share' di browser Safari.
      </p>
      <p class="font-medium flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
        <PlusSquare class="w-3.5 h-3.5" /> 2. Pilih 'Add to Home Screen' (Tambah ke Layar Utama).
      </p>
    </div>
  </aside>
</template>
