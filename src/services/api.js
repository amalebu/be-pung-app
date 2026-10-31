import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://9knv83ss-8000.asse.devtunnels.ms/api/v1/personal-app',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('personal_app_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Attach client's current date (YYYY-MM-DD) and timezone
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    config.headers['X-Client-Date'] = `${y}-${m}-${d}`
    config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('personal_app_token')
      localStorage.removeItem('personal_app_user')
      const base = import.meta.env.BASE_URL || '/'
      const loginUrl = base.endsWith('/') ? `${base}login` : `${base}/login`
      if (!window.location.pathname.endsWith('/login') && !window.location.pathname.endsWith('/register')) {
        window.location.href = loginUrl
      }
    }
    return Promise.reject(error)
  }
)

export default api
