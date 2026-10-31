import { ref, onMounted } from 'vue'

const isDark = ref(false)

export function useTheme() {
  function applyTheme(dark) {
    isDark.value = dark
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('personal_app_theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('personal_app_theme', 'light')
    }
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
