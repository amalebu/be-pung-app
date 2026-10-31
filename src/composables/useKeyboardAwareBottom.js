import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Mengangkat stack tombol bawah di atas keyboard virtual ponsel (terutama iOS Safari
 * yang tidak me-resize layout viewport saat keyboard muncul).
 * Aman dipakai di browser tanpa `window.visualViewport`.
 */
export function useKeyboardAwareBottom() {
  const keyboardOffset = ref(0)
  const vv = typeof window !== 'undefined' ? window.visualViewport : null

  function update() {
    if (!vv) return
    const diff = Math.round(window.innerHeight - vv.height - vv.offsetTop)
    // Abaikan perubahan kecil (toolbar browser) agar tidak bergetar
    keyboardOffset.value = diff > 80 ? diff : 0
  }

  onMounted(() => {
    if (!vv) return
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
  })

  onBeforeUnmount(() => {
    if (!vv) return
    vv.removeEventListener('resize', update)
    vv.removeEventListener('scroll', update)
  })

  return { keyboardOffset }
}
