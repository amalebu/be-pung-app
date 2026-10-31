import api from './api'

export const habitService = {
  async getHabits(params = {}) {
    const response = await api.get('/habits', { params })
    return response.data
  },

  async createHabit(payload) {
    const response = await api.post('/habits', payload)
    return response.data
  },

  async updateHabit(id, payload) {
    const response = await api.put(`/habits/${id}`, payload)
    return response.data
  },

  async deleteHabit(id) {
    const response = await api.delete(`/habits/${id}`)
    return response.data
  },

  async logProgress(id, payload) {
    const response = await api.post(`/habits/${id}/log`, payload)
    return response.data
  },
}
