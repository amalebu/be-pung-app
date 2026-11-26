<script setup>
import { usePhotoMarkerStore } from '@/stores/photoMarkerStore'
import PhotoFrameTemplate1 from './PhotoFrameTemplate1.vue'

const photoStore = usePhotoMarkerStore()

const props = defineProps({
  customClass: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <!-- 
    TEMPLATE 2: NOIR SPOTLIGHT
    Template 1 yang ditaruh di tengah kanvas berasio 9:16 dengan background B&W
    dan aksen garis bracket di pojok.
  -->
  <div
    class="photo-frame-card-template2 relative w-full aspect-[9/16] overflow-hidden bg-slate-950 select-none text-left shadow-2xl flex flex-col justify-center items-center p-4 sm:p-6"
    :class="customClass"
  >
    <!-- 🌑 BACKGROUND FOTO HITAM PUTIH (MONOCHROME NOIR) -->
    <div class="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <img
        v-if="photoStore.imageUrl"
        :src="photoStore.imageUrl"
        alt="Background Monochrome"
        class="w-full h-full object-cover filter grayscale contrast-125 brightness-75 block"
        crossorigin="anonymous"
      />
      <div class="absolute inset-0 bg-black/30 pointer-events-none"></div>
    </div>

    <!-- 🖼️ CARD UTAMA DENGAN AKSEN SUDUT FRAME -->
    <div class="relative z-10 w-[86%] sm:w-[84%] max-w-[360px] mx-auto flex flex-col items-center">
      <!-- Aksen Sudut Atas-Kanan -->
      <div
        class="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-24 sm:w-32 h-32 sm:h-44 border-t-2 border-r-2 sm:border-t-[2.5px] sm:border-r-[2.5px] border-white/90 pointer-events-none z-0"
      ></div>

      <!-- Aksen Sudut Bawah-Kiri -->
      <div
        class="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 w-24 sm:w-32 h-32 sm:h-44 border-b-2 border-l-2 sm:border-b-[2.5px] sm:border-l-[2.5px] border-white/90 pointer-events-none z-0"
      ></div>

      <!-- Aksen Garis Vertikal Sisi Kiri -->
      <div
        class="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 w-[2px] h-12 sm:h-16 bg-white/80 rounded-full pointer-events-none z-0"
      ></div>

      <!-- KARTU UTAMA: TEMPLATE 1 -->
      <div class="relative z-10 w-full shadow-2xl">
        <PhotoFrameTemplate1 />
      </div>
    </div>
  </div>
</template>
