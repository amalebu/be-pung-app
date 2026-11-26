<script setup>
import { usePhotoMarkerStore } from '@/stores/photoMarkerStore'
import PhotoUploader from '@/components/modules/photos/PhotoUploader.vue'
import PhotoFramePreview from '@/components/modules/photos/PhotoFramePreview.vue'
import { Camera, Spark, WarningCircle } from '@iconoir/vue'

const photoStore = usePhotoMarkerStore()
</script>

<template>
  <div class="p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-3 sm:space-y-6 min-h-[calc(100dvh-5.5rem)] flex flex-col">
    <!-- Header Halaman: Ramping di Mobile, Elegan di Desktop -->
    <div class="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-zinc-800/80 pb-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] flex items-center justify-center shadow-xs shrink-0">
          <Camera class="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
        </div>
        <div>
          <h1 class="text-base sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight leading-tight">
            PhotoMarker
          </h1>
          <p class="hidden sm:block text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Ekstrak metadata EXIF & buat bingkai foto elegan 100% lokal di browser Anda.
          </p>
        </div>
      </div>

      <!-- Badge Privasi Aman -->
      <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d3e4d8]/40 text-[#144229] dark:bg-[#144229]/40 dark:text-[#a1d2af] text-[10px] sm:text-xs font-semibold border border-[#144229]/15 dark:border-[#a1d2af]/20 shrink-0">
        <Spark class="w-3 h-3" />
        <span>100% Client-Side</span>
      </div>
    </div>

    <!-- Alert Error Jika Ada -->
    <div
      v-if="photoStore.error"
      class="p-3 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5"
    >
      <WarningCircle class="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
      <div>
        <div class="font-bold">Gagal memproses foto</div>
        <p class="mt-0.5">{{ photoStore.error }}</p>
      </div>
    </div>

    <!-- Loading State Overlay -->
    <div
      v-if="photoStore.isLoading"
      class="flex-1 py-16 flex flex-col items-center justify-center space-y-3"
    >
      <div class="w-10 h-10 border-3 border-slate-200 dark:border-zinc-800 border-t-[#144229] dark:border-t-[#a1d2af] rounded-full animate-spin"></div>
      <p class="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-300">
        {{ photoStore.loadingMessage }}
      </p>
    </div>

    <!-- Tampilan Utama: Uploader (Layar Penuh HP) atau Preview Frame (Ultra-Simpel) -->
    <div v-else class="flex-1 flex flex-col justify-center">
      <PhotoUploader v-if="!photoStore.hasImage" />
      <PhotoFramePreview v-else />
    </div>
  </div>
</template>
