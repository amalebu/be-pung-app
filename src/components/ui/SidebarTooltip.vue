<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  enabled: {
    type: Boolean,
    default: true,
  },
})

const visible = ref(false)
const tooltip = ref(null)
const position = ref({})

function hide() {
  visible.value = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', hide, true)
    window.removeEventListener('resize', hide)
  }
}

async function show(anchor) {
  if (!props.enabled || !anchor) return
  const rect = anchor.getBoundingClientRect()
  position.value = {
    left: `${rect.right + 10}px`,
    top: `${rect.top}px`,
  }
  visible.value = true

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
  }

  await nextTick()
  if (!visible.value || !tooltip.value) return

  const { width, height } = tooltip.value.getBoundingClientRect()
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 768

  position.value = {
    left: `${Math.max(8, Math.min(rect.right + 10, screenWidth - width - 8))}px`,
    top: `${Math.max(8, Math.min(rect.top + (rect.height - height) / 2, screenHeight - height - 8))}px`,
  }
}

watch(() => props.enabled, (val) => {
  if (!val) hide()
})

onBeforeUnmount(hide)

defineExpose({ show, hide })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && enabled"
      ref="tooltip"
      role="tooltip"
      aria-hidden="true"
      :style="position"
      class="pointer-events-none fixed z-[10000] w-max max-w-xs select-none break-words rounded-xl border border-slate-200/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.12)] animate-pop-in"
    >
      <slot />
    </div>
  </Teleport>
</template>
