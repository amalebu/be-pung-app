/**
 * Sterilisasi dan standardisasi nomor ponsel menjadi format baku: 628xxxxxxxx
 * Aturan:
 * - Hilangkan karakter non-digit (+, -, spasi, tanda kurung)
 * - Awalan '08' diubah menjadi '628...'
 * - Awalan '8' ditambah '62' di depannya menjadi '628...'
 * - Awalan '0' diubah menjadi '62...'
 * - Selalu menghasilkan angka murni berawalan 628
 */
export function sanitizePhone(input) {
  if (!input) return ''
  let digits = String(input).replace(/\D/g, '')
  if (digits.startsWith('08')) {
    digits = '62' + digits.slice(1)
  } else if (digits.startsWith('8')) {
    digits = '62' + digits
  } else if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1)
  }
  return digits
}

/**
 * Format tampilan nomor telepon untuk antarmuka pengguna: 62852-3472-9615
 */
export function formatPhoneDisplay(phone) {
  if (!phone) return ''
  const sanitized = sanitizePhone(phone)
  if (!sanitized) return String(phone)
  if (sanitized.startsWith('62')) {
    const prefix = sanitized.slice(0, 5) // 62852
    const rest = sanitized.slice(5)
    const grouped = rest.match(/.{1,4}/g)?.join('-') || ''
    return grouped ? `${prefix}-${grouped}` : prefix
  }
  return sanitized
}
