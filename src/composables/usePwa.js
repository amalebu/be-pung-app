import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const canInstall = ref(false)
const isInstalled = ref(false)
const isIos = ref(false)
const isDismissed = ref(localStorage.getItem('pwa_prompt_dismissed') === 'true')

export function usePwa() {
  function checkInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      isInstalled.value = true
      canInstall.value = false
    }
  }

  function checkIos() {
    const userAgent = window.navigator.userAgent.toLowerCase()
    isIos.value = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream
  }

  async function installPwa() {
    if (!deferredPrompt.value) return false
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      isInstalled.value = true
      canInstall.value = false
    }
    deferredPrompt.value = null
    return outcome === 'accepted'
  }

  function dismissPrompt() {
    isDismissed.value = true
    localStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  function resetDismissed() {
    isDismissed.value = false
    localStorage.removeItem('pwa_prompt_dismissed')
  }

  onMounted(() => {
    checkInstalled()
    checkIos()

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
    })

    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      canInstall.value = false
      deferredPrompt.value = null
    })
  })

  return {
    canInstall,
    isInstalled,
    isIos,
    isDismissed,
    installPwa,
    dismissPrompt,
    resetDismissed,
  }
}
