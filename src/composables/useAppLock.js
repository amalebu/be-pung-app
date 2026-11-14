import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

export function useAppLock() {
  const authStore = useAuthStore()
  const router = useRouter()
  let checkTimer = null

  function runLockCheck() {
    const wasAuthenticated = authStore.isAuthenticated
    authStore.checkInactivityLock()
    if (wasAuthenticated && !authStore.isAuthenticated) {
      router.push('/login')
    }
  }

  function handleVisibilityChange() {
    if (!authStore.isAuthenticated || !authStore.user?.has_pin) return

    if (document.visibilityState === 'hidden') {
      localStorage.setItem('personal_app_hidden_at', String(Date.now()))
    } else if (document.visibilityState === 'visible') {
      runLockCheck()
      if (authStore.isAuthenticated && !authStore.isPinLocked) {
        localStorage.removeItem('personal_app_hidden_at')
        authStore.recordActivity()
      }
    }
  }

  function handleUserActivity() {
    if (authStore.isAuthenticated && !authStore.isPinLocked) {
      authStore.recordActivity()
    }
  }

  function handlePageHide() {
    if (authStore.isAuthenticated && authStore.user?.has_pin) {
      localStorage.setItem('personal_app_hidden_at', String(Date.now()))
    }
  }

  onMounted(() => {
    runLockCheck()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('touchstart', handleUserActivity, { passive: true })
    window.addEventListener('click', handleUserActivity, { passive: true })
    window.addEventListener('keydown', handleUserActivity, { passive: true })

    checkTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && !authStore.isPinLocked) {
        runLockCheck()
      }
    }, 15000)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', handlePageHide)
    window.removeEventListener('touchstart', handleUserActivity)
    window.removeEventListener('click', handleUserActivity)
    window.removeEventListener('keydown', handleUserActivity)
    if (checkTimer) clearInterval(checkTimer)
  })
}
