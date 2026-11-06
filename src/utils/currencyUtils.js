/**
 * Konstanta komisi broker default (IDX / BEI):
 * - Buy Fee: 0.1513% (komisi beli broker + levy + PPN)
 * - Sell Fee: 0.2513% (komisi jual broker + levy + PPN + PPh final penjualan 0.1%)
 */
export const DEFAULT_BUY_FEE_RATE = 0.001513 // 0.1513%
export const DEFAULT_SELL_FEE_RATE = 0.002513 // 0.2513%

/**
 * Menghitung estimasi biaya komisi beli default (0.1513%)
 */
export function calculateDefaultBuyFee(grossAmount) {
  const gross = Math.max(0, Number(grossAmount || 0))
  return Math.round(gross * DEFAULT_BUY_FEE_RATE)
}

/**
 * Menghitung estimasi biaya komisi jual default (0.2513%)
 */
export function calculateDefaultSellFee(grossAmount) {
  const gross = Math.max(0, Number(grossAmount || 0))
  return Math.round(gross * DEFAULT_SELL_FEE_RATE)
}

/**
 * Format angka menjadi nominal Rupiah lengkap (contoh: Rp 5.100.000)
 */
export function formatRupiah(value, { withSign = false, decimals = 0 } = {}) {
  const num = Number(value || 0)
  const abs = Math.abs(num)
  const formatted = abs.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  if (withSign) {
    if (num > 0) return `+Rp${formatted}`
    if (num < 0) return `-Rp${formatted}`
    return `Rp${formatted}`
  }

  return num < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`
}

/**
 * Format angka kompak seperti pada tabel sekuritas (contoh: Rp167,50K, -Rp23K, Rp12,4M)
 */
export function formatCompactRupiah(value, { withSign = false } = {}) {
  const num = Number(value || 0)
  const abs = Math.abs(num)
  let suffix = ''
  let scaled = abs
  let decimals = 0

  if (abs >= 1_000_000_000) {
    scaled = abs / 1_000_000_000
    suffix = 'B'
    decimals = 2
  } else if (abs >= 1_000_000) {
    scaled = abs / 1_000_000
    suffix = 'Jt'
    decimals = abs % 1_000_000 === 0 ? 0 : 2
  } else if (abs >= 10_000) {
    scaled = abs / 1_000
    suffix = 'K'
    decimals = abs % 1_000 === 0 ? 0 : 2
  }

  const formatted = scaled.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })

  if (withSign) {
    if (num > 0) return `+Rp${formatted}${suffix}`
    if (num < 0) return `-Rp${formatted}${suffix}`
    return `Rp${formatted}${suffix}`
  }

  return num < 0 ? `-Rp${formatted}${suffix}` : `Rp${formatted}${suffix}`
}

/**
 * Format harga per lembar saham (contoh: 5.100 atau 762,00)
 */
export function formatSharePrice(value, decimals = 0) {
  const num = Number(value || 0)
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  })
}

/**
 * Format persentase P/L (contoh: +12,07% atau -12,07%)
 */
export function formatPercent(value, { withSign = true } = {}) {
  const num = Number(value || 0)
  const abs = Math.abs(num).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (!withSign) return `${num < 0 ? '-' : ''}${abs}%`
  if (num > 0) return `+${abs}%`
  if (num < 0) return `-${abs}%`
  return `0,00%`
}
