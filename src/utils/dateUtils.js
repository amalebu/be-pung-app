export const JAKARTA_TIMEZONE = import.meta.env?.VITE_APP_TIMEZONE || 'Asia/Jakarta'

/**
 * Mengembalikan tanggal hari ini (atau dengan offset hari) berformat 'YYYY-MM-DD'
 * dalam zona waktu Asia/Jakarta (WIB, GMT+7).
 */
export function getJakartaTodayStr(offsetDays = 0) {
  const d = new Date()
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays)
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * Mengembalikan waktu saat ini berformat 'HH:mm' (24 jam)
 * dalam zona waktu Asia/Jakarta (WIB, GMT+7).
 */
export function getJakartaNowTimeStr() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: JAKARTA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const h = parts.find((p) => p.type === 'hour')?.value || '00'
  const m = parts.find((p) => p.type === 'minute')?.value || '00'
  return `${h}:${m}`
}

/**
 * Mengembalikan jam saat ini (0-23)
 * dalam zona waktu Asia/Jakarta (WIB, GMT+7).
 */
export function getJakartaHour() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: JAKARTA_TIMEZONE,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date())
  const h = parts.find((p) => p.type === 'hour')?.value || '0'
  return parseInt(h, 10)
}

/**
 * Memformat objek Date ke string lokal id-ID dengan zona waktu Asia/Jakarta.
 */
export function formatDateJakarta(dateObj, options = {}) {
  const opts = {
    timeZone: JAKARTA_TIMEZONE,
    ...options,
  }
  return (dateObj instanceof Date ? dateObj : new Date(dateObj)).toLocaleDateString('id-ID', opts)
}

/**
 * Memformat waktu ke string lokal id-ID dengan zona waktu Asia/Jakarta.
 */
export function formatTimeJakarta(dateObj, options = {}) {
  const opts = {
    timeZone: JAKARTA_TIMEZONE,
    ...options,
  }
  return (dateObj instanceof Date ? dateObj : new Date(dateObj)).toLocaleTimeString('id-ID', opts)
}
