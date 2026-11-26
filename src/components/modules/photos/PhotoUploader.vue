<script setup>
import { ref } from 'vue'
import { usePhotoMarkerStore } from '@/stores/photoMarkerStore'
import { Camera, MediaImage } from '@iconoir/vue'

const photoStore = usePhotoMarkerStore()
const isDragging = ref(false)
const fileInput = ref(null)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) {
    photoStore.processFile(file)
  }
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name))) {
    photoStore.processFile(file)
  }
}
</script>

<template>
  <div class="w-full h-full flex-1 flex flex-col justify-center">
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*,.heic,.heif"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Upload Box: Layar penuh di HP (min-h-[calc(100dvh-8.5rem)]), rapi di Desktop -->
    <div
      class="w-full min-h-[calc(100dvh-8.5rem)] sm:min-h-[440px] rounded-3xl border-2 border-dashed transition-all duration-200 bg-white dark:bg-zinc-900/90 p-6 sm:p-10 flex flex-col items-center justify-center text-center select-none shadow-sm cursor-pointer active:scale-[0.99] group"
      :class="isDragging 
        ? 'border-[#144229] dark:border-[#a1d2af] bg-[#d3e4d8]/25 dark:bg-[#144229]/25 scale-[1.01]' 
        : 'border-slate-300 dark:border-zinc-700 hover:border-[#144229] dark:hover:border-[#a1d2af]'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <!-- Icon Utama -->
      <div
        class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#d3e4d8]/60 dark:bg-[#144229]/40 text-[#144229] dark:text-[#a1d2af] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-xs"
      >
        <Camera class="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.8]" />
      </div>

      <h3 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-1.5 tracking-tight">
        Upload Foto Asli
      </h3>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-6 max-w-xs sm:max-w-sm leading-relaxed">
        Ketuk di mana saja untuk mengambil foto dari kamera atau galeri
      </p>

      <!-- Tombol Aksi Visual -->
      <div
        class="px-8 py-3.5 rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] font-semibold text-sm shadow-md flex items-center justify-center gap-2 mb-6 pointer-events-none"
      >
        <MediaImage class="w-4 h-4 stroke-[2]" />
        <span>Pilih Foto</span>
      </div>

      <!-- Format Didukung -->
      <div class="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
        <span class="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">JPG</span>
        <span class="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">PNG</span>
        <span class="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">WEBP</span>
        <span class="px-2.5 py-0.5 rounded-full bg-[#d3e4d8] text-[#144229] dark:bg-[#144229] dark:text-[#a1d2af] font-bold">HEIC</span>
      </div>
    </div>
  </div>
</template>
