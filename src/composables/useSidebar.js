import { ref } from 'vue'

const STORAGE_KEY = 'sidebar_collapsed_v2'

function getInitialCollapsed() {
  if (typeof window === 'undefined') return true
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
  } catch {
    // ignore
  }
  // Default di desktop: minimized / collapsed
  return true
}

const collapsed = ref(getInitialCollapsed())

export function useSidebar() {
  function toggle() {
    collapsed.value = !collapsed.value
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed.value))
    } catch {
      // ignore
    }
  }

  function setCollapsed(val) {
    collapsed.value = val
    try {
      localStorage.setItem(STORAGE_KEY, String(val))
    } catch {
      // ignore
    }
  }

  return {
    collapsed,
    toggle,
    setCollapsed,
  }
}
