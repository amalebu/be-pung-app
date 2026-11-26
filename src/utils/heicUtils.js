// Utilitas format file HEIC/HEIF untuk PhotoMarker
// Browser modern selain Safari membutuhkan decoding HEIC ke JPEG kualitas 100%
// EXIF tetap diekstrak dari file asli menggunakan exifr

const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']

export async function isHeicFile(file) {
  if (!file) return false
  if (/\.(heic|heif)$/i.test(file.name || '')) return true
  if (/image\/hei[cf]/i.test(file.type || '')) return true
  try {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
    const marker = String.fromCharCode(...head.slice(4, 8))
    const brand = String.fromCharCode(...head.slice(8, 12))
    return marker === 'ftyp' && HEIC_BRANDS.includes(brand)
  } catch {
    return false
  }
}

export async function heicToJpegBlob(file) {
  const { heicTo } = await import('heic-to')
  return heicTo({ blob: file, type: 'image/jpeg', quality: 1 })
}
