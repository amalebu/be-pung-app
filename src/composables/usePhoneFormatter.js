import { ref } from 'vue'

export function usePhoneFormatter(initialValue = '') {
  const phone = ref('')

  const formatPhone = (raw) => {
    if (!raw) {
      phone.value = ''
      return ''
    }

    // Hapus semua yang bukan angka
    let value = String(raw).replace(/\D/g, '')

    let prefix = ''
    if (value.startsWith('62')) {
      prefix = value.slice(0, 5) // 62852
      value = value.slice(5)
    } else if (value.startsWith('0')) {
      prefix = value.slice(0, 4) // 0852
      value = value.slice(4)
    } else {
      prefix = value.slice(0, 3) // 852
      value = value.slice(3)
    }

    // Grouping per 4 digit
    const grouped = value.match(/.{1,4}/g)?.join('-') || ''

    phone.value = grouped ? `${prefix}-${grouped}` : prefix
    return phone.value
  }

  const onInput = (e) => {
    // langsung validasi: hanya angka
    const rawDigits = e.target.value.replace(/\D/g, '')
    e.target.value = rawDigits
    formatPhone(rawDigits)
    e.target.value = phone.value
  }

  // helper: dapetin nomor mentah tanpa dash
  const getRawPhone = () => phone.value.replace(/-/g, '')

  if (initialValue) {
    formatPhone(initialValue)
  }

  return {
    phone,
    formatPhone,
    onInput,
    getRawPhone,
  }
}
