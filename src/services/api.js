import axios from 'axios'
import { getJakartaTodayStr, JAKARTA_TIMEZONE } from '@/utils/dateUtils'

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    if (!envUrl || envUrl.startsWith('/')) {
      return 'https://9knv83ss-8000.asse.devtunnels.ms/api/v1/personal-app'
    }
  }
  return envUrl || 'https://9knv83ss-8000.asse.devtunnels.ms/api/v1/personal-app'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
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

    // Attach client's current date (YYYY-MM-DD) and timezone (Asia/Jakarta, GMT+7)
    config.headers['X-Client-Date'] = getJakartaTodayStr()
    config.headers['X-Timezone'] = JAKARTA_TIMEZONE

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
