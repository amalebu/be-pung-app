import api from './api'

export const authService = {
  async checkPhone(phone) {
    const response = await api.post('/auth/phone/check', { phone })
    return response.data
  },

  async authenticateWithPhonePin(payload) {
    const response = await api.post('/auth/phone/pin', payload)
    return response.data
  },

  async setupPin(payload) {
    const response = await api.post('/auth/pin/setup', payload)
    return response.data
  },

  async verifyPin(pin) {
    const response = await api.post('/auth/pin/verify', { pin })
    return response.data
  },

  async loginWithGoogle(payload) {
    const response = await api.post('/auth/google', payload)
    return response.data
  },

  async getGoogleRedirectUrl() {
    const response = await api.get('/auth/google/redirect')
    return response.data
  },

  async register(payload) {
    const response = await api.post('/auth/register', payload)
    return response.data
  },

  async login(payload) {
    const response = await api.post('/auth/login', payload)
    return response.data
  },

  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  },

  async getMe() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async updateProfile(payload) {
    const response = await api.put('/auth/profile', payload)
    return response.data
  },
}
