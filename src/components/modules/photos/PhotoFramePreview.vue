<script setup>
import { ref } from 'vue'
import { toCanvas } from 'html-to-image'
import { usePhotoMarkerStore } from '@/stores/photoMarkerStore'
import PhotoFrameTemplate1 from './templates/PhotoFrameTemplate1.vue'
import PhotoFrameTemplate2 from './templates/PhotoFrameTemplate2.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import {
  Download,
  Check,
  Trash,
  MediaImage,
  Lock,
  Settings,
  Xmark,
} from '@iconoir/vue'

const photoStore = usePhotoMarkerStore()

const frameWrapperRef = ref(null)
const replaceFileInput = ref(null)
const isDownloading = ref(false)
const downloadSuccess = ref(false)
const showExifSheet = ref(false)

const templateOptions = [
  { id: 'template1', label: 'Studio' },
  { id: 'template2', label: 'Noir' },
]

const themes = [
  { id: 'white', label: 'Putih' },
  { id: 'dark', label: 'Gelap' },
  { id: 'mint', label: 'Mint' },
]

const borders = [
  { id: 'compact', label: 'Tipis' },
  { id: 'normal', label: 'Standar' },
  { id: 'spacious', label: 'Lebar' },
]

function triggerReplaceImage() {
  replaceFileInput.value?.click()
}

function handleReplaceFileChange(e) {
  const file = e.target.files?.[0]
  if (file) {
    photoStore.replaceImageOnly(file)
  }
  e.target.value = ''
}

// Download lossless 1:1 JPG dengan resolusi asli
async function handleDownloadImage() {
  if (!frameWrapperRef.value) return
  isDownloading.value = true

  try {
    const rootEl = frameWrapperRef.value.firstElementChild || frameWrapperRef.value
    const origW = photoStore.originalDimensions.width
    const currentW = rootEl.offsetWidth || 1

    const scaleMultiplier = photoStore.frameConfig.templateId === 'template2' ? 1.22 : 1.0
    const pixelRatio = origW > 0 && currentW > 0 ? Math.max((origW * scaleMultiplier) / currentW, 1) : 2

    if (document.fonts?.ready) {
      await document.fonts.ready
    }

    const canvas = await toCanvas(rootEl, {
      pixelRatio,
      cacheBust: false,
    })

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error('Gagal menghasilkan file JPG dari canvas'))
        },
        'image/jpeg',
        1.0
      )
    })

    if (!blob) {
      throw new Error('Gagal memproses file JPG')
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const rawTitle = (photoStore.metadata.title || 'photo')
      .replace(/\.(jpe?g|png|webp|heic|heif)$/i, '')
      .trim()

    const sanitizedTitle = rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    a.href = url
    a.download = `${sanitizedTitle || 'photo'}_framed.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    downloadSuccess.value = true
    setTimeout(() => {
      downloadSuccess.value = false
    }, 3500)
  } catch (err) {
    console.error('Download error:', err)
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-lg mx-auto space-y-3 sm:space-y-4">
    <!-- Hidden input untuk ganti foto -->
    <input
      ref="replaceFileInput"
      type="file"
      accept="image/*,.heic,.heif"
      class="hidden"
      @change="handleReplaceFileChange"
    />

    <!-- Status Pill: Foto Diganti & Metadata Terkunci (Minimalist) -->
    <div
      v-if="photoStore.isImageSwapped"
      class="flex items-center justify-between gap-2 bg-[#144229] text-white px-3.5 py-1.5 rounded-full text-[11px] font-semibold shadow-xs"
    >
      <div class="flex items-center gap-1.5 truncate">
        <Lock class="w-3.5 h-3.5 text-[#a1d2af] shrink-0" />
        <span class="truncate">Foto diganti • EXIF awal terkunci</span>
      </div>
      <button
        type="button"
        @click="photoStore.resetPhoto"
        class="text-[#a1d2af] underline underline-offset-2 hover:text-white shrink-0 cursor-pointer text-[10px]"
      >
        Reset EXIF
      </button>
    </div>

    <!-- 1. TOOLBAR KONTROL ULTRA-SIMPEL: Judul + Template Switcher + Tombol Setting -->
    <div class="flex items-center gap-2">
      <!-- Input Judul Foto -->
      <div class="relative flex-1 min-w-0 flex items-center">
        <input
          v-model="photoStore.metadata.title"
          type="text"
          placeholder="Judul foto..."
          class="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:border-[#144229] dark:focus:border-[#a1d2af] rounded-full pl-3.5 pr-8 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none transition-colors shadow-2xs"
        />
        <button
          v-if="photoStore.metadata.title"
          type="button"
          @click="photoStore.metadata.title = ''"
          class="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full cursor-pointer"
          title="Kosongkan"
        >
          <Xmark class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Segmented Button: Pilihan Template (Studio vs Noir) -->
      <div class="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shrink-0">
        <button
          v-for="tpl in templateOptions"
          :key="tpl.id"
          type="button"
          @click="photoStore.setTemplate(tpl.id)"
          class="px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer"
          :class="photoStore.frameConfig.templateId === tpl.id
            ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-xs'
            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'"
        >
          {{ tpl.label }}
        </button>
      </div>

      <!-- 1 Tombol dengan Logo Setting (Membuka Bottom Sheet EXIF) -->
      <button
        type="button"
        @click="showExifSheet = true"
        class="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:text-[#144229] dark:hover:text-[#a1d2af] active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0"
        title="Pengaturan Metadata EXIF"
      >
        <Settings class="w-4 h-4 stroke-[2]" />
      </button>
    </div>

    <!-- 2. AREA PREVIEW BINGKAI FOTO (FOKUS UTAMA) -->
    <div class="bg-slate-100/70 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl p-2.5 sm:p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
      <div
        ref="frameWrapperRef"
        class="w-full flex justify-center cursor-pointer active:scale-[0.99] transition-transform select-none"
        @click="triggerReplaceImage"
        title="Ketuk untuk mengganti foto"
      >
        <PhotoFrameTemplate1 v-if="photoStore.frameConfig.templateId === 'template1'" />
        <PhotoFrameTemplate2 v-else-if="photoStore.frameConfig.templateId === 'template2'" />
      </div>

      <!-- Hint tap to change -->
      <span class="mt-2 text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
        Ketuk foto untuk ganti gambar cepat
      </span>
    </div>

    <!-- 3. BARIS AKSI MOBILE (Ganti Foto, Reset, & Download) -->
    <div class="flex items-center gap-2 pt-1">
      <!-- Tombol Ganti Foto Saja -->
      <button
        type="button"
        @click="triggerReplaceImage"
        class="flex-1 py-3 px-3 rounded-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-95 text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
      >
        <MediaImage class="w-4 h-4 stroke-[2]" />
        <span>Ganti Foto</span>
      </button>

      <!-- Tombol Hapus & Ulang -->
      <button
        type="button"
        @click="photoStore.resetPhoto"
        class="w-11 h-11 rounded-full bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
        title="Hapus & Ulang"
      >
        <Trash class="w-4 h-4 stroke-[2]" />
      </button>

      <!-- Tombol Utama Download JPG 100% -->
      <button
        type="button"
        @click="handleDownloadImage"
        :disabled="isDownloading"
        class="flex-2 py-3 px-4 rounded-full bg-[#144229] hover:bg-[#1f5738] active:scale-95 text-white dark:bg-[#a1d2af] dark:text-[#002110] dark:hover:bg-[#bbf0cb] text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Check v-if="downloadSuccess" class="w-4 h-4 stroke-[2.5]" />
        <Download v-else class="w-4 h-4 stroke-[2.2]" />
        <span class="truncate">{{ isDownloading ? 'Memproses...' : (downloadSuccess ? 'Tersimpan!' : 'Download JPG') }}</span>
      </button>
    </div>

    <!-- 4. BOTTOM SHEET: EDIT METADATA EXIF (Hanya Muncul Saat Tombol Setting Ditekan) -->
    <BottomSheet
      :show="showExifSheet"
      title="Pengaturan Metadata EXIF"
      @close="showExifSheet = false"
    >
      <div class="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
        <!-- Lensa / Model Kamera -->
        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Keterangan Lensa / Kamera
          </label>
          <input
            v-model="photoStore.metadata.lensInfo"
            type="text"
            placeholder="mis. Telephoto lens - 69mm"
            class="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#144229] dark:focus:border-[#a1d2af]"
          />
        </div>

        <!-- Metrik File -->
        <div>
          <span class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Metrik File
          </span>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <span class="block text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Ukuran</span>
              <input
                v-model="photoStore.metadata.fileSize"
                type="text"
                class="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Dimensi (px)</span>
              <input
                v-model="photoStore.metadata.dimensionsText"
                type="text"
                class="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Megapiksel</span>
              <input
                v-model="photoStore.metadata.megapixelsText"
                type="text"
                class="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Parameter Exposure -->
        <div>
          <span class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Parameter Exposure
          </span>
          <div class="grid grid-cols-5 gap-1.5">
            <div>
              <span class="block text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">ISO</span>
              <input
                v-model="photoStore.metadata.iso"
                type="text"
                class="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-1.5 py-1 text-[11px] font-medium text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Focal</span>
              <input
                v-model="photoStore.metadata.focalLength"
                type="text"
                class="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-1.5 py-1 text-[11px] font-medium text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">EV</span>
              <input
                v-model="photoStore.metadata.ev"
                type="text"
                class="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-1.5 py-1 text-[11px] font-medium text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Aperture</span>
              <input
                v-model="photoStore.metadata.aperture"
                type="text"
                class="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-1.5 py-1 text-[11px] font-medium text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 dark:text-zinc-500 mb-0.5">Shutter</span>
              <input
                v-model="photoStore.metadata.shutterSpeed"
                type="text"
                class="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-1.5 py-1 text-[11px] font-medium text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Warna Kartu & Tebal Border -->
        <div class="pt-2 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
          <div>
            <span class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Warna Kartu
            </span>
            <div class="flex gap-1.5">
              <button
                v-for="t in themes"
                :key="t.id"
                type="button"
                @click="photoStore.frameConfig.theme = t.id"
                class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer"
                :class="photoStore.frameConfig.theme === t.id
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'"
              >
                {{ t.label }}
              </button>
            </div>
          </div>

          <div>
            <span class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Tebal Border
            </span>
            <div class="flex gap-1.5">
              <button
                v-for="b in borders"
                :key="b.id"
                type="button"
                @click="photoStore.frameConfig.borderScale = b.id"
                class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer"
                :class="photoStore.frameConfig.borderScale === b.id
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'"
              >
                {{ b.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tombol Tutup Sheet -->
        <div class="pt-2">
          <button
            type="button"
            @click="showExifSheet = false"
            class="w-full py-2.5 rounded-full bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs cursor-pointer active:scale-95 transition-transform"
          >
            Selesai
          </button>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
