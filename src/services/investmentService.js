import api from './api'

export const investmentService = {
  async getPortfolio(refresh = false) {
    const response = await api.get('/investments', {
      params: refresh ? { refresh: 1 } : {},
    })
    return response.data
  },

  async refreshPrices() {
    const response = await api.post('/investments/refresh-prices')
    return response.data
  },

  async searchTickers(query = '') {
    const response = await api.get('/investments/tickers/search', {
      params: { q: query },
    })
    return response.data
  },

  async getTickerQuote(ticker) {
    const response = await api.get('/investments/tickers/quote', {
      params: { ticker },
    })
    return response.data
  },

  async adjustCash(payload) {
    const response = await api.post('/investments/cash', payload)
    return response.data
  },

  async buyStockLot(payload) {
    const response = await api.post('/investments/lots', payload)
    return response.data
  },

  async updateStockLot(lotId, payload) {
    const response = await api.put(`/investments/lots/${lotId}`, payload)
    return response.data
  },

  async deleteStockLot(lotId) {
    const response = await api.delete(`/investments/lots/${lotId}`)
    return response.data
  },

  async closePosition(payload) {
    const response = await api.post('/investments/positions/close', payload)
    return response.data
  },
}
