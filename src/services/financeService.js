import api from './api'

export const financeService = {
  // Summary & Statistik
  getSummary(periodId = null) {
    const params = periodId ? { finance_period_id: periodId } : {}
    return api.get('/finance/summary', { params })
  },
  getStatistics(periodId = null) {
    const params = periodId ? { finance_period_id: periodId } : {}
    return api.get('/finance/statistics', { params })
  },

  // Periode Keuangan
  getPeriods() {
    return api.get('/finance/periods')
  },
  endPeriod(periodId = null, cutoffDay = 25) {
    return api.post('/finance/periods/end', {
      finance_period_id: periodId,
      cutoff_day: cutoffDay,
    })
  },

  // Dompet & Kartu
  getWallets() {
    return api.get('/finance/wallets')
  },
  createWallet(data) {
    return api.post('/finance/wallets', data)
  },
  updateWallet(id, data) {
    return api.put(`/finance/wallets/${id}`, data)
  },
  deleteWallet(id) {
    return api.delete(`/finance/wallets/${id}`)
  },
  adjustWalletBalance(id, data) {
    return api.post(`/finance/wallets/${id}/adjust`, data)
  },

  // Kategori & Sub-kategori
  getCategories(type = null) {
    const params = type ? { type } : {}
    return api.get('/finance/categories', { params })
  },
  createCategory(data) {
    return api.post('/finance/categories', data)
  },
  updateCategory(id, data) {
    return api.put(`/finance/categories/${id}`, data)
  },
  deleteCategory(id) {
    return api.delete(`/finance/categories/${id}`)
  },

  // Transaksi
  getTransactions(params = {}) {
    return api.get('/finance/transactions', { params })
  },
  createTransaction(data) {
    return api.post('/finance/transactions', data)
  },
  updateTransaction(id, data) {
    return api.put(`/finance/transactions/${id}`, data)
  },
  deleteTransaction(id) {
    return api.delete(`/finance/transactions/${id}`)
  },

  // Anggaran (Budgeting)
  getBudgets(periodId = null) {
    const params = periodId ? { finance_period_id: periodId } : {}
    return api.get('/finance/budgets', { params })
  },
  setBudget(data) {
    return api.post('/finance/budgets', data)
  },
  deleteBudget(id) {
    return api.delete(`/finance/budgets/${id}`)
  },

  // Planned Payments (Tagihan Rutin)
  getPlannedPayments(periodId = null) {
    const params = periodId ? { finance_period_id: periodId } : {}
    return api.get('/finance/planned-payments', { params })
  },
  createPlannedPayment(data) {
    return api.post('/finance/planned-payments', data)
  },
  updatePlannedPayment(id, data) {
    return api.put(`/finance/planned-payments/${id}`, data)
  },
  deletePlannedPayment(id) {
    return api.delete(`/finance/planned-payments/${id}`)
  },
  payPlannedPayment(id, data = {}) {
    return api.post(`/finance/planned-payments/${id}/pay`, data)
  },

  // Savings Goals (Tabungan)
  getSavingsGoals() {
    return api.get('/finance/savings-goals')
  },
  createSavingsGoal(data) {
    return api.post('/finance/savings-goals', data)
  },
  updateSavingsGoal(id, data) {
    return api.put(`/finance/savings-goals/${id}`, data)
  },
  deleteSavingsGoal(id) {
    return api.delete(`/finance/savings-goals/${id}`)
  },
  adjustSavingsGoal(id, data) {
    return api.post(`/finance/savings-goals/${id}/adjust`, data)
  },

  // Debts & Receivables (Hutang & Piutang)
  getDebts() {
    return api.get('/finance/debts')
  },
  createDebt(data) {
    return api.post('/finance/debts', data)
  },
  updateDebt(id, data) {
    return api.put(`/finance/debts/${id}`, data)
  },
  deleteDebt(id) {
    return api.delete(`/finance/debts/${id}`)
  },
  payDebt(id, data) {
    return api.post(`/finance/debts/${id}/pay`, data)
  },

  // Wishlists (To Buy List)
  getWishlists() {
    return api.get('/finance/wishlists')
  },
  createWishlist(data) {
    return api.post('/finance/wishlists', data)
  },
  updateWishlist(id, data) {
    return api.put(`/finance/wishlists/${id}`, data)
  },
  deleteWishlist(id) {
    return api.delete(`/finance/wishlists/${id}`)
  },
  actionWishlist(id, data) {
    return api.post(`/finance/wishlists/${id}/action`, data)
  },
}
