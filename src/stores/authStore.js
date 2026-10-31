import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'
import { localDb } from '@/services/localDb'
import { disconnectEcho } from '@/services/echo'

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 1 Minggu (7 Hari)
const PIN_LOCK_TIMEOUT_MS = 5 * 60 * 1000 // 5 Menit

async function computePinHash(pin, userId = '') {
  const raw = `personal_app_pin:${userId}:${pin}`
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(raw)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  return btoa(raw)
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('personal_app_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('personal_app_user') || 'null'))
  const isPinLocked = ref(localStorage.getItem('personal_app_pin_locked') === 'true')
  const loading = ref(false)
  const errorMessage = ref('')
  const validationErrors = ref({})

  const isAuthenticated = computed(() => Boolean(token.value))
  const needsPinSetup = computed(() =>
    Boolean(isAuthenticated.value && user.value && user.value.has_pin === false)
  )

  function clearErrors() {
    errorMessage.value = ''
    validationErrors.value = {}
  }

  function recordActivity() {
    const now = String(Date.now())
    localStorage.setItem('personal_app_last_active_at', now)
  }

  function setPinLocked(locked) {
    isPinLocked.value = locked
    localStorage.setItem('personal_app_pin_locked', locked ? 'true' : 'false')
    if (!locked) {
      recordActivity()
      localStorage.removeItem('personal_app_hidden_at')
    }
  }

  function lockApp() {
    if (isAuthenticated.value && user.value?.has_pin) {
      setPinLocked(true)
    }
  }

  function isSessionExpired() {
    if (!token.value) return true
    const expiresAt = Number(localStorage.getItem('personal_app_session_expires_at') || 0)
    if (expiresAt > 0 && Date.now() >= expiresAt) {
      clearSession()
      return true
    }
    return false
  }

  function checkInactivityLock() {
    if (!isAuthenticated.value) return

    // 1. Cek apakah masa berlaku sesi 1 minggu sudah habis
    if (isSessionExpired()) return

    if (!user.value?.has_pin) return

    // 2. Cek apakah aplikasi ditinggalkan / tidak aktif >= 5 menit
    const hiddenAt = Number(localStorage.getItem('personal_app_hidden_at') || 0)
    const lastActiveAt = Number(localStorage.getItem('personal_app_last_active_at') || 0)
    const now = Date.now()

    if (
      (hiddenAt > 0 && now - hiddenAt >= PIN_LOCK_TIMEOUT_MS) ||
      (lastActiveAt > 0 && now - lastActiveAt >= PIN_LOCK_TIMEOUT_MS)
    ) {
      setPinLocked(true)
    }
  }

  function setSession(newToken, newUser, { lockPin = false } = {}) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('personal_app_token', newToken)
    localStorage.setItem('personal_app_user', JSON.stringify(newUser))
    localStorage.setItem('personal_app_session_expires_at', String(Date.now() + SESSION_EXPIRY_MS))
    setPinLocked(lockPin)
    recordActivity()
  }

  async function saveLocalPinHash(pin, userId) {
    if (!pin) return
    const hashed = await computePinHash(pin, userId ?? user.value?.id ?? '')
    localStorage.setItem('personal_app_pin_hash', hashed)
  }

  function clearSession() {
    token.value = null
    user.value = null
    isPinLocked.value = false
    localStorage.removeItem('personal_app_token')
    localStorage.removeItem('personal_app_user')
    localStorage.removeItem('personal_app_pin_locked')
    localStorage.removeItem('personal_app_pin_hash')
    localStorage.removeItem('personal_app_session_expires_at')
    localStorage.removeItem('personal_app_last_active_at')
    localStorage.removeItem('personal_app_hidden_at')
    localDb.clearAll()
    disconnectEcho()
  }

  async function checkPhone(phone) {
    loading.value = true
    clearErrors()
    try {
      const res = await authService.checkPhone(phone)
      return { success: true, data: res.data }
    } catch (err) {
      const responseData = err.response?.data
      const defaultMsg = (!err.response || err.response.status >= 500 || typeof responseData !== 'object')
        ? 'Gagal menghubungkan ke server backend.'
        : 'Format nomor ponsel tidak valid.'
      errorMessage.value =
        responseData?.errors?.phone?.[0] ||
        responseData?.message ||
        defaultMsg
      validationErrors.value = responseData?.errors || {}
      return { success: false, error: responseData }
    } finally {
      loading.value = false
    }
  }

  async function authenticateWithPhonePin(payload) {
    loading.value = true
    clearErrors()
    try {
      const res = await authService.authenticateWithPhonePin(payload)
      setSession(res.data.token, res.data.user, { lockPin: false })
      await saveLocalPinHash(payload.pin, res.data.user?.id)
      return { success: true, data: res.data }
    } catch (err) {
      const responseData = err.response?.data
      errorMessage.value =
        responseData?.errors?.pin?.[0] ||
        responseData?.message ||
        'PIN yang dimasukkan salah.'
      validationErrors.value = responseData?.errors || {}
      return { success: false, error: responseData }
    } finally {
      loading.value = false
    }
  }

  async function setupPin(payload) {
    loading.value = true
    clearErrors()
    try {
      const res = await authService.setupPin(payload)
      user.value = res.data
      localStorage.setItem('personal_app_user', JSON.stringify(res.data))
      await saveLocalPinHash(payload.pin, res.data?.id)
      setPinLocked(false)
      return { success: true, data: res.data }
    } catch (err) {
      const responseData = err.response?.data
      errorMessage.value =
        responseData?.errors?.pin?.[0] ||
        responseData?.message ||
        'Gagal menyimpan PIN baru.'
      validationErrors.value = responseData?.errors || {}
      return { success: false, error: responseData }
    } finally {
      loading.value = false
    }
  }

  async function verifyPin(pin) {
    loading.value = true
    clearErrors()

    // Jika sedang offline, verifikasi langsung terhadap hash PIN lokal (Web Crypto SHA-256)
    const isBrowserOffline = typeof navigator !== 'undefined' && !navigator.onLine
    const savedLocalHash = localStorage.getItem('personal_app_pin_hash')

    if (isBrowserOffline && savedLocalHash) {
      try {
        const candidateHash = await computePinHash(pin, user.value?.id ?? '')
        if (candidateHash === savedLocalHash) {
          setPinLocked(false)
          return { success: true, offline: true }
        }
        errorMessage.value = 'PIN yang dimasukkan salah.'
        return { success: false }
      } finally {
        loading.value = false
      }
    }

    try {
      await authService.verifyPin(pin)
      await saveLocalPinHash(pin, user.value?.id)
      setPinLocked(false)
      return { success: true }
    } catch (err) {
      // Fallback ke hash lokal jika request gagal karena terputus dari jaringan/server
      if (!err.response && savedLocalHash) {
        const candidateHash = await computePinHash(pin, user.value?.id ?? '')
        if (candidateHash === savedLocalHash) {
          setPinLocked(false)
          return { success: true, offline: true }
        }
      }
      const responseData = err.response?.data
      errorMessage.value =
        responseData?.errors?.pin?.[0] ||
        responseData?.message ||
        'PIN yang dimasukkan salah.'
      validationErrors.value = responseData?.errors || {}
      return { success: false, error: responseData }
    } finally {
      loading.value = false
    }
  }

  async function loginWithGoogle(payload) {
    loading.value = true
    clearErrors()
    try {
      const res = await authService.loginWithGoogle(payload)
      const shouldLockWithPin = Boolean(res.data.user?.has_pin)
      setSession(res.data.token, res.data.user, { lockPin: shouldLockWithPin })
      return { success: true, data: res.data }
    } catch (err) {
      const responseData = err.response?.data
      errorMessage.value =
        responseData?.errors?.google?.[0] ||
        responseData?.message ||
        'Gagal masuk dengan akun Google.'
      validationErrors.value = responseData?.errors || {}
      return { success: false, error: responseData }
    } finally {
      loading.value = false
    }
  }

  async function loginWithToken(newToken) {
    loading.value = true
    clearErrors()
    try {
      token.value = newToken
      localStorage.setItem('personal_app_token', newToken)
      localStorage.setItem('personal_app_session_expires_at', String(Date.now() + SESSION_EXPIRY_MS))
      const me = await fetchMe()
      if (!me) {
        throw new Error('Token tidak valid')
      }
      setPinLocked(Boolean(me.has_pin))
      recordActivity()
      return { success: true, data: me }
    } catch {
      clearSession()
      errorMessage.value = 'Sesi login Google gagal diverifikasi.'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value || isSessionExpired()) return null

    // Saat offline, pertahankan profil user lokal tanpa menghapus sesi
    if (typeof navigator !== 'undefined' && !navigator.onLine && user.value) {
      return user.value
    }

    try {
      const res = await authService.getMe()
      user.value = res.data
      localStorage.setItem('personal_app_user', JSON.stringify(res.data))
      if (!localStorage.getItem('personal_app_session_expires_at')) {
        localStorage.setItem('personal_app_session_expires_at', String(Date.now() + SESSION_EXPIRY_MS))
      }
      return res.data
    } catch (err) {
      // Hanya hapus sesi jika benar-benar 401 Unauthorized dari server (bukan karena offline/network error)
      if (err.response && err.response.status === 401) {
        clearSession()
        return null
      }
      return user.value
    }
  }

  async function logout() {
    loading.value = true
    try {
      if (token.value) {
        await authService.logout()
      }
    } catch {
      // Ignore network error on logout and clear local session anyway
    } finally {
      clearSession()
      loading.value = false
    }
  }

  return {
    token,
    user,
    isPinLocked,
    needsPinSetup,
    loading,
    errorMessage,
    validationErrors,
    isAuthenticated,
    clearErrors,
    recordActivity,
    lockApp,
    isSessionExpired,
    checkInactivityLock,
    checkPhone,
    authenticateWithPhonePin,
    setupPin,
    verifyPin,
    loginWithGoogle,
    loginWithToken,
    fetchMe,
    logout,
  }
})
