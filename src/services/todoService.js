import api from './api'

export const todoService = {
  async getTodos(params = {}) {
    const response = await api.get('/todos', { params })
    return response.data
  },

  async createTodo(payload) {
    const response = await api.post('/todos', payload)
    return response.data
  },

  async updateTodo(id, payload) {
    const response = await api.put(`/todos/${id}`, payload)
    return response.data
  },

  async toggleTodo(id) {
    const response = await api.patch(`/todos/${id}/toggle`)
    return response.data
  },

  async deleteTodo(id) {
    const response = await api.delete(`/todos/${id}`)
    return response.data
  },

  async addSubtask(todoId, title) {
    const response = await api.post(`/todos/${todoId}/items`, { title })
    return response.data
  },

  async toggleSubtask(todoId, itemId) {
    const response = await api.patch(`/todos/${todoId}/items/${itemId}/toggle`)
    return response.data
  },

  async deleteSubtask(todoId, itemId) {
    const response = await api.delete(`/todos/${todoId}/items/${itemId}`)
    return response.data
  },
}
