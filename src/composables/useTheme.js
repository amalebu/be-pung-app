import { ref, onMounted } from 'vue'

const isDark = ref(false)

export function useTheme() {
  function updateThemeColorMeta(dark) {
    const color = dark ? '#1a1c1e' : '#f9f9fc'
    const metas = document.querySelectorAll('meta[name="theme-color"]')
    metas.forEach((meta) => {
      meta.setAttribute('content', color)
    })
  }

  function applyTheme(dark) {
    isDark.value = dark
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      localStorage.setItem('personal_app_theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
      localStorage.setItem('personal_app_theme', 'light')
    }
    updateThemeColorMeta(dark)
  }

  function toggleTheme() {
    applyTheme(!isDark.value)
  }

  function initTheme() {
    const saved = localStorage.getItem('personal_app_theme')
    if (saved === 'dark') {
      applyTheme(true)
    } else if (saved === 'light') {
      applyTheme(false)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(prefersDark)
    }
  }

  onMounted(() => {
    initTheme()
  })

  return {
    isDark,
    toggleTheme,
    initTheme,
  }
}
