<script setup>
import { computed } from 'vue'
import { usePhotoMarkerStore } from '@/stores/photoMarkerStore'

const photoStore = usePhotoMarkerStore()

const props = defineProps({
  customClass: {
    type: String,
    default: '',
  },
})

// Konfigurasi Warna Tema (White / Dark / Mint)
const theme = computed(() => {
  const current = photoStore.frameConfig.theme
  if (current === 'dark') {
    return {
      bg: '#000000',
      title: '#ffffff',
      subtitle: '#d4d4d8',
      metrics: '#86909c',
      exposure: '#a1d2af', // mint accent
      badge: '#a1d2af',
      divider: 'rgba(255, 255, 255, 0.2)',
    }
  }
  if (current === 'mint') {
    return {
      bg: '#d3e4d8',
      title: '#144229',
      subtitle: '#2d5a3f',
      metrics: '#3f4a3a',
      exposure: '#144229',
      badge: '#144229',
      divider: 'rgba(20, 66, 41, 0.25)',
    }
  }
  // Default 'white'
  return {
    bg: '#ffffff',
    title: '#1a1c1e',
    subtitle: '#64748b',
    metrics: '#64748b',
    exposure: '#475569',
    badge: '#1e293b',
    divider: '#e2e8f0',
  }
})

// Konfigurasi Ketebalan Padding Frame
const borderPaddingClass = computed(() => {
  const scale = photoStore.frameConfig.borderScale
  if (scale === 'compact') return 'p-2 sm:p-2.5'
  if (scale === 'spacious') return 'p-5 sm:p-7'
  return 'p-3.5 sm:p-4.5' // normal
})
</script>

<template>
  <div
    class="photo-frame-card w-full shadow-lg transition-colors duration-200 select-none text-left relative font-sans"
    :class="[borderPaddingClass, customClass]"
    :style="{ backgroundColor: theme.bg }"
  >
    <!-- 🖼️ AREA FOTO UTAMA -->
    <div class="photo-wrapper w-full overflow-hidden rounded-[2px] bg-slate-900">
      <img
        v-if="photoStore.imageUrl"
        :src="photoStore.imageUrl"
        alt="Foto Utama"
        class="w-full h-auto block object-contain select-none"
        crossorigin="anonymous"
      />
    </div>

    <!-- 📝 AREA FOOTER METADATA -->
    <div class="flex items-center justify-between pt-2.5 pb-2 px-1">
      <div class="metadata-footer flex-1 min-w-0 pr-3">
        <!-- BARIS 1: Judul Foto -->
        <h2
          v-if="photoStore.metadata.title"
          class="frame-title font-bold tracking-tight text-[11px] sm:text-[12px] leading-tight truncate"
          :style="{ color: theme.title }"
        >
          {{ photoStore.metadata.title }}
        </h2>

        <div class="flex flex-col gap-1 mt-1">
          <!-- BARIS 2: Keterangan Lensa / Kamera -->
          <p
            v-if="photoStore.metadata.lensInfo"
            class="frame-subtitle text-[9px] sm:text-[10px] font-medium leading-none truncate"
            :style="{ color: theme.subtitle }"
          >
            {{ photoStore.metadata.lensInfo }}
          </p>

          <!-- BARIS 3: Metrik File (Ukuran | Dimensi | Resolusi MP) -->
          <div
            v-if="photoStore.fileMetricsRow && photoStore.fileMetricsRow.length"
            class="frame-metrics flex items-center divide-x text-[9px] font-medium tabular-nums"
            :style="{ color: theme.metrics, '--tw-divide-color': theme.divider }"
          >
            <span
              v-for="(item, index) in photoStore.fileMetricsRow"
              :key="index"
              class="px-1.5 first:pl-0 last:pr-0"
            >
              {{ item }}
            </span>
          </div>

          <!-- BARIS 4: Parameter Eksposur (ISO | Focal | EV | Aperture | Shutter) -->
          <div
            v-if="photoStore.exposureSettingsRow && photoStore.exposureSettingsRow.length"
            class="frame-exposure flex items-center divide-x text-[9px] font-semibold tabular-nums"
            :style="{ color: theme.exposure, '--tw-divide-color': theme.divider }"
          >
            <span
              v-for="(item, index) in photoStore.exposureSettingsRow"
              :key="index"
              class="px-1.5 first:pl-0 last:pr-0"
            >
              {{ item }}
            </span>
          </div>
        </div>
      </div>

      <!-- LOGO HEXAGON CAMERA BADGE -->
      <div class="shrink-0 px-1 pt-1" :style="{ color: theme.badge }">
        <svg
          viewBox="0 0 813 800"
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-auto opacity-90"
        >
          <path
            fill="currentColor"
            d="M413.029,11.792L76.549,204.401l-1.435,387.546L410.02,786.964l336.369-192.545l0.102-379.883
		L413.029,11.792z M714.207,583.989c-1.279,0.732-2.775,1.589-4.52,2.588c-9.634,5.516-12.097-2.801-12.09-8.436
		c0.036-30.669,0.123-73.593,0.025-80.455c-0.411-28.802-0.193-33.682-11.089-42.519c-4.803-3.895-20.933-16.387-32.857-25.596
		c-7.707-5.951-7.019-14.406,1.412-19.328c11.549-6.74,26.458-15.444,32.28-18.842c10.073-5.879,10.255-5.643,10.22-24.421
		c-0.057-29.909,0.033-86.224,0.033-92.018c0.122-30.881-4.886-38.81-31.97-55.038C643.224,206.487,482.386,108.771,427.76,75.578
		c-11.337-6.889-25.211-6.755-34.986-0.922c-17.12,10.215-42.413,25.308-51.993,31.024c-15.051,8.98-17.121,22.311-1.361,31.485
		c49.711,28.937,154.142,89.718,163.917,95.345c12.875,7.412,14.247,12.002,14.247,25.564c0,11.893-0.002,43.491-0.002,43.491
		c0,11.685-10.133,12.624-20.702,5.466c-11.593-6.867-123.708-71.481-157.225-91.565c-10.92-6.544-18.745-0.91-17.676,14.113
		c0.286,4.013,0.463,141.901,0.012,191.813c-0.246,27.172-0.246,31.762,23.398,45.745c7.689,4.547,71.912,41.932,107.807,62.82
		c14.259,8.298,24.05,3.817,24.054-9.46c0.006-22.046,0.015-52.644,0.015-59.414c0-10.85,6.053-12.869,15.614-7.321
		c5.478,3.178,29.268,16.993,48.596,28.216c14.416,8.37,26.354,29.223,26.359,48.796c0.016,43.58,0.048,115.174,0.079,123.523
		c-0.059,11.999-0.581,13.668-11.79,20.183c-8.471,4.849-74.905,42.877-115.181,65.931c-21.129,11.955-44.344,9.606-64.452-1.947
		c-16.398-9.421-189.8-110.475-253.22-147.438c-18.631-11.844-23.227-24.051-22.964-40.639c0.264-16.588,1.193-322.059,1.193-322.059
		s-0.199-9.206,4.223-11.758c4.422-2.551,2.996-1.718,4.422-2.551c3.766-2.202,10.456,0.752,10.456,4.762
		c0,76.969,0,305.033,0,322.008c0,23.37,2.921,28.378,22.039,39.864c19.167,11.078,176.778,102.173,241.068,139.33
		c16.735,9.672,37.487,9.784,52.129,1.426c33.926-19.368,90.939-51.914,95.918-54.728c9.914-5.603,11.687-15.201,0.634-22.367
		c-10.933-6.505-174.985-104.135-239.925-142.783c-26.182-15.582-26.182-22.191-26.182-50.986c0-18.409,0-190.072,0-276.572
		c0-29.677,9.097-54.539,33.489-68.501c19.373-11.089,68.973-40.118,93.034-53.255c14.801-8.081,27.543-6.661,38.044-0.292
		c47.446,28.78,258.236,157.053,269.99,164.159c13.179,7.966,20.604,18.397,20.6,36.342c-0.004,15.804-0.067,257.764-0.082,315.274
		C721.355,575.493,719.991,580.68,714.207,583.989z"
          />
        </svg>
      </div>
    </div>
  </div>
</template>
