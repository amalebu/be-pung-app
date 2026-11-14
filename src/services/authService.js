import api from './api'
import { sanitizePhone } from '@/utils/phoneUtils'

export const authService = {
  async checkPhone(phone) {
    const sanitized = sanitizePhone(phone)
    const response = await api.post('/auth/phone/check', { phone: sanitized })
    return response.data
  },

  async authenticateWithPhonePin(payload) {
    const data = {
      ...payload,
      phone: sanitizePhone(payload.phone),
    }
    const response = await api.post('/auth/phone/pin', data)
    return response.data
  },

  async setupPin(payload) {
    const response = await api.post('/auth/pin/setup', payload)
    return response.data
  },

  async verifyPin(pin) {
    const response = await api.post('/auth/pin/verify', { pin }, { timeout: 3500 })
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
    const data = { ...payload }
    if (data.phone) {
      data.phone = sanitizePhone(data.phone)
    }
    const response = await api.post('/auth/register', data)
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
    const data = { ...payload }
    if (data.phone) {
      data.phone = sanitizePhone(data.phone)
    }
    const response = await api.put('/auth/profile', data)
    return response.data
  },

  async linkGoogle(payload) {
    const response = await api.post('/auth/google/link', payload)
    return response.data
  },

  async linkPhone(payload) {
    const data = {
      ...payload,
      phone: sanitizePhone(payload.phone),
    }
    const response = await api.post('/auth/phone/link', data)
    return response.data
  },
}
