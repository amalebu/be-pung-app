<script setup>
import { ref, computed } from 'vue'
import { Camera, User as UserIcon, SystemRestart } from '@iconoir/vue'
import { compressImageToBase64 } from '@/utils/imageUtils'

const props = defineProps({
  avatarUrl: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    default: 'Pengguna',
  },
  size: {
    type: String,
    default: 'md', // 'xs', 'sm', 'md', 'lg', 'xl', '2xl'
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(v),
  },
  editable: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['change', 'error'])

const fileInput = ref(null)
const imageLoadError = ref(false)
const processing = ref(false)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return {
        box: 'w-6 h-6 text-xs',
        icon: 'w-3.5 h-3.5',
        badge: 'w-3 h-3',
        badgeIcon: 'w-2 h-2',
      }
    case 'sm':
      return {
        box: 'w-8 h-8 text-xs',
        icon: 'w-4 h-4',
        badge: 'w-4 h-4',
        badgeIcon: 'w-2.5 h-2.5',
      }
    case 'lg':
      return {
        box: 'w-14 h-14 text-lg',
        icon: 'w-7 h-7',
        badge: 'w-6 h-6',
        badgeIcon: 'w-3.5 h-3.5',
      }
    case 'xl':
      return {
        box: 'w-20 h-20 text-2xl',
        icon: 'w-10 h-10',
        badge: 'w-7 h-7',
        badgeIcon: 'w-4 h-4',
      }
    case '2xl':
      return {
        box: 'w-24 h-24 text-3xl',
        icon: 'w-12 h-12',
        badge: 'w-8 h-8',
        badgeIcon: 'w-4.5 h-4.5',
      }
    case 'md':
    default:
      return {
        box: 'w-10 h-10 text-sm',
        icon: 'w-5 h-5',
        badge: 'w-5 h-5',
        badgeIcon: 'w-3 h-3',
      }
  }
})

const initial = computed(() => {
  if (!props.name) return '?'
  const trimmed = props.name.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
})

const hasValidAvatar = computed(() => {
  return Boolean(props.avatarUrl && !imageLoadError.value)
})

function triggerFileInput() {
  if (props.editable && !props.loading && !processing.value) {
    fileInput.value?.click()
  }
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  // Reset file input so same file can be selected again if needed
  event.target.value = ''

  if (!file.type.startsWith('image/')) {
    emit('error', 'File yang dipilih harus berupa gambar (JPG, PNG, WebP).')
    return
  }

  try {
    processing.value = true
    const base64 = await compressImageToBase64(file, 256, 0.85)
    imageLoadError.value = false
    emit('change', base64, file)
  } catch (err) {
    emit('error', err.message || 'Gagal memproses gambar.')
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="relative inline-flex items-center justify-center select-none group">
    <!-- Clickable / Interactive Avatar Box -->
    <div
      :class="[
        sizeClasses.box,
        'rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-zinc-700/60 shadow-surface transition-all duration-200',
        editable
          ? 'cursor-pointer hover:ring-2 hover:ring-pod-lime hover:ring-offset-2 dark:hover:ring-offset-zinc-900 active:scale-95'
          : '',
        hasValidAvatar
          ? 'bg-slate-100 dark:bg-zinc-800'
          : 'bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-100 dark:from-emerald-950/70 dark:via-zinc-800 dark:to-lime-950/50 text-emerald-800 dark:text-lime-300 font-semibold',
      ]"
      @click="triggerFileInput"
      :title="editable ? 'Klik untuk memilih atau mengubah foto profil' : props.name"
    >
      <!-- Loading State -->
      <div
        v-if="loading || processing"
        class="w-full h-full flex items-center justify-center bg-black/40 text-white backdrop-blur-xs"
      >
        <SystemRestart class="animate-spin" :class="sizeClasses.badgeIcon" />
      </div>

      <!-- Real Image -->
      <img
        v-else-if="hasValidAvatar"
        :src="props.avatarUrl"
        :alt="props.name"
        @error="imageLoadError = true"
        class="w-full h-full object-cover"
      />

      <!-- Default Tactile Avatar (Initial or Icon) -->
      <template v-else>
        <span v-if="initial !== '?'" class="tracking-tight select-none font-bold">
          {{ initial }}
        </span>
        <UserIcon v-else :class="sizeClasses.icon" class="text-emerald-700 dark:text-lime-400" />
      </template>

      <!-- Hover Overlay for Editable Mode -->
      <div
        v-if="editable && !loading && !processing"
        class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]"
      >
        <Camera :class="sizeClasses.icon" />
      </div>
    </div>

    <!-- Editable Camera Badge Pin (Corner) -->
    <button
      v-if="editable"
      type="button"
      @click.stop="triggerFileInput"
      :disabled="loading || processing"
      class="absolute bottom-0 right-0 rounded-full bg-pod-carbon dark:bg-pod-lime text-white dark:text-zinc-950 border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-floating transition-transform active:scale-90 cursor-pointer"
      :class="sizeClasses.badge"
      title="Ubah foto profil"
    >
      <SystemRestart v-if="loading || processing" class="animate-spin" :class="sizeClasses.badgeIcon" />
      <Camera v-else :class="sizeClasses.badgeIcon" />
    </button>

    <!-- Hidden Native File Input -->
    <input
      v-if="editable"
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      class="hidden"
      @change="handleFileChange"
    />
  </div>
</template>
