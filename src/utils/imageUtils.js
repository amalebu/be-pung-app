/**
 * Kompresi dan resize gambar menjadi Base64 data URL di sisi browser (maksimal 256x256 px)
 * @param {File|Blob} file - File gambar yang dipilih pengguna
 * @param {number} maxDimension - Batas dimensi terpanjang (default: 256px)
 * @param {number} quality - Kualitas kompresi JPEG (default: 0.85)
 * @returns {Promise<string>} Base64 data URL (image/jpeg)
 */
export function compressImageToBase64(file, maxDimension = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar yang valid.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Gagal memuat format gambar.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Scaling proporsional dengan mempertahankan aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Kanvas grafis browser tidak dapat diinisialisasi.'))
          return
        }

        // Gambar ke kanvas
        ctx.drawImage(img, 0, 0, width, height)

        // Konversi ke Base64 JPEG ringan (~15-30 KB)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.src = e.target.result
    }

    reader.readAsDataURL(file)
  })
}
