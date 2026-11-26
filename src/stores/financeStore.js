import { defineStore } from 'pinia'
import { financeService } from '@/services/financeService'
import { formatRupiah, formatCompactRupiah } from '@/utils/currencyUtils'

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    summary: null,
    periods: [],
    activePeriod: null,
    wallets: [],
    categories: [],
    transactions: [],
    budgets: [],
    plannedPayments: [],
    statistics: null,
    savingsGoals: [],
    debts: [],
    wishlists: [],

    // Preferensi Pengguna (Persisten di localStorage)
    isBalanceHidden: localStorage.getItem('finance_hide_balance') === 'true',
    showDecimals: localStorage.getItem('finance_show_decimals') === 'true',
    cutoffDay: Number(localStorage.getItem('finance_cutoff_day') || 25),

    // UI & Loading States
    isLoading: false,
    isSaving: false,
    errorMessage: '',
    isTransactionSheetOpen: false,
    transactionSheetInitialType: 'expense',
    editingTransaction: null,
  }),

  getters: {
    totalBalance: (state) => state.summary?.total_balance ?? 0,
    periodIncome: (state) => state.summary?.income ?? 0,
    periodExpense: (state) => state.summary?.expense ?? 0,
    netCashflow: (state) => state.summary?.net_cashflow ?? 0,
    currentWallets: (state) => state.summary?.wallets ?? state.wallets ?? [],
    budgetSummary: (state) =>
      state.summary?.budget_summary ?? { total_limit: 0, total_spent: 0, percentage: 0 },
    upcomingPayments: (state) => state.summary?.upcoming_payments ?? [],
    recentTransactions: (state) => state.summary?.recent_transactions ?? [],
    expenseCategories: (state) => state.categories.filter((c) => c.type === 'expense'),
    incomeCategories: (state) => state.categories.filter((c) => c.type === 'income'),
  },

  actions: {
    clearError() {
      this.errorMessage = ''
    },

    toggleBalanceVisibility() {
      this.isBalanceHidden = !this.isBalanceHidden
      localStorage.setItem('finance_hide_balance', String(this.isBalanceHidden))
    },

    savePreferences({ cutoffDay, showDecimals }) {
      if (cutoffDay !== undefined) {
        const clamped = Math.max(1, Math.min(28, Number(cutoffDay) || 25))
        this.cutoffDay = clamped
        localStorage.setItem('finance_cutoff_day', String(clamped))
      }
      if (showDecimals !== undefined) {
        this.showDecimals = Boolean(showDecimals)
        localStorage.setItem('finance_show_decimals', String(this.showDecimals))
      }
    },

    /**
     * Format nominal uang yang otomatis menghormati sensor privasi (isBalanceHidden)
     * serta preferensi desimal (,00 vs bulat) di seluruh tampilan Finance.
     */
    formatMoney(value, { withSign = false, compact = false, ignoreMask = false } = {}) {
      if (this.isBalanceHidden && !ignoreMask) {
        return 'Rp ••••••••'
      }
      if (compact) {
        return formatCompactRupiah(value, { withSign })
      }
      return formatRupiah(value, {
        withSign,
        decimals: this.showDecimals ? 2 : 0,
      })
    },

    openTransactionSheet(type = 'expense', transaction = null) {
      this.clearError()
      this.editingTransaction = transaction ? { ...transaction } : null
      this.transactionSheetInitialType = transaction?.type || type
      this.isTransactionSheetOpen = true
    },

    closeTransactionSheet() {
      this.isTransactionSheetOpen = false
      this.editingTransaction = null
      this.clearError()
    },

    async fetchPeriods() {
      try {
        const res = await financeService.getPeriods()
        if (res.data?.success) {
          this.periods = res.data.data
          if (!this.activePeriod && this.periods.length > 0) {
            this.activePeriod = this.periods.find((p) => p.is_active) || this.periods[0]
          }
        }
      } catch (err) {
        console.error('Failed to fetch finance periods:', err)
      }
    },

    async selectPeriod(period) {
      this.activePeriod = period
      await Promise.all([
        this.fetchSummary(period.id),
        this.fetchBudgets(period.id),
        this.fetchPlannedPayments(period.id),
        this.fetchStatistics(period.id),
        this.fetchTransactions({ finance_period_id: period.id }),
      ])
    },

    async endCurrentPeriod() {
      this.isLoading = true
      this.clearError()
      try {
        const res = await financeService.endPeriod(this.activePeriod?.id, this.cutoffDay)
        if (res.data?.success) {
          const newPeriod = res.data.data
          await this.fetchPeriods()
          this.activePeriod = newPeriod
          await Promise.all([
            this.fetchSummary(newPeriod.id),
            this.fetchBudgets(newPeriod.id),
            this.fetchPlannedPayments(newPeriod.id),
            this.fetchStatistics(newPeriod.id),
            this.fetchTransactions({ finance_period_id: newPeriod.id }),
          ])
          return newPeriod
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal mengakhiri periode.'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchSummary(periodId = null) {
      this.isLoading = true
      try {
        const targetPeriodId = periodId || this.activePeriod?.id
        const res = await financeService.getSummary(targetPeriodId)
        if (res.data?.success) {
          this.summary = res.data.data
          if (!this.activePeriod && res.data.data.period) {
            this.activePeriod = res.data.data.period
          }
          if (res.data.data.wallets) {
            this.wallets = res.data.data.wallets
          }
        }
      } catch (err) {
        console.error('Failed to fetch finance summary:', err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchWallets() {
      try {
        const res = await financeService.getWallets()
        if (res.data?.success) {
          this.wallets = res.data.data
        }
      } catch (err) {
        console.error('Failed to fetch wallets:', err)
      }
    },

    async saveWallet(payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.createWallet(payload)
        if (res.data?.success) {
          await this.fetchWallets()
          await this.fetchSummary()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menyimpan dompet.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async editWallet(id, payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.updateWallet(id, payload)
        if (res.data?.success) {
          await this.fetchWallets()
          await this.fetchSummary()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal memperbarui dompet.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async removeWallet(id) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.deleteWallet(id)
        if (res.data?.success) {
          await this.fetchWallets()
          await this.fetchSummary()
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menonaktifkan dompet.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async adjustWallet(id, payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.adjustWalletBalance(id, payload)
        if (res.data?.success) {
          await this.fetchWallets()
          await this.fetchSummary()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menyesuaikan saldo dompet.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async fetchCategories(type = null) {
      try {
        const res = await financeService.getCategories(type)
        if (res.data?.success) {
          this.categories = res.data.data
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    },

    async saveCategory(payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.createCategory(payload)
        if (res.data?.success) {
          await this.fetchCategories()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menambahkan kategori.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async editCategory(id, payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.updateCategory(id, payload)
        if (res.data?.success) {
          await this.fetchCategories()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal memperbarui kategori.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async removeCategory(id) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.deleteCategory(id)
        if (res.data?.success) {
          await this.fetchCategories()
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menghapus kategori.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async fetchTransactions(filters = {}) {
      try {
        const targetFilters = {
          finance_period_id: this.activePeriod?.id,
          per_page: 100,
          ...filters,
        }
        const res = await financeService.getTransactions(targetFilters)
        if (res.data?.success) {
          this.transactions = res.data.data.data || res.data.data
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err)
      }
    },

    async addTransaction(payload) {
      this.isSaving = true
      this.clearError()
      try {
        const activePeriodObj = this.periods.find((p) => p.is_active) || this.activePeriod
        const res = await financeService.createTransaction({
          finance_period_id: activePeriodObj?.id,
          ...payload,
        })
        if (res.data?.success) {
          await Promise.all([
            this.fetchSummary(),
            this.fetchWallets(),
            this.fetchTransactions(),
            this.fetchStatistics(),
            this.fetchBudgets(),
          ])
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menyimpan transaksi.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async updateTransaction(id, payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.updateTransaction(id, payload)
        if (res.data?.success) {
          await Promise.all([
            this.fetchSummary(),
            this.fetchWallets(),
            this.fetchTransactions(),
            this.fetchStatistics(),
            this.fetchBudgets(),
          ])
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal memperbarui transaksi.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async removeTransaction(id) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.deleteTransaction(id)
        if (res.data?.success) {
          await Promise.all([
            this.fetchSummary(),
            this.fetchWallets(),
            this.fetchTransactions(),
            this.fetchStatistics(),
            this.fetchBudgets(),
          ])
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menghapus transaksi.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async fetchBudgets(periodId = null) {
      try {
        const targetPeriodId = periodId || this.activePeriod?.id
        const res = await financeService.getBudgets(targetPeriodId)
        if (res.data?.success) {
          this.budgets = res.data.data
        }
      } catch (err) {
        console.error('Failed to fetch budgets:', err)
      }
    },

    async saveBudget(payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.setBudget({
          finance_period_id: this.activePeriod?.id,
          ...payload,
        })
        if (res.data?.success) {
          await this.fetchBudgets()
          await this.fetchSummary()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menyimpan anggaran.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async removeBudget(id) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.deleteBudget(id)
        if (res.data?.success) {
          await this.fetchBudgets()
          await this.fetchSummary()
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menghapus anggaran.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async fetchPlannedPayments(periodId = null) {
      try {
        const targetPeriodId = periodId || this.activePeriod?.id
        const res = await financeService.getPlannedPayments(targetPeriodId)
        if (res.data?.success) {
          this.plannedPayments = res.data.data
        }
      } catch (err) {
        console.error('Failed to fetch planned payments:', err)
      }
    },

    async savePlannedPayment(payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.createPlannedPayment(payload)
        if (res.data?.success) {
          await this.fetchPlannedPayments()
          await this.fetchSummary()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menyimpan tagihan rutin.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async editPlannedPayment(id, payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.updatePlannedPayment(id, payload)
        if (res.data?.success) {
          await this.fetchPlannedPayments()
          await this.fetchSummary()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal memperbarui tagihan rutin.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async removePlannedPayment(id) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.deletePlannedPayment(id)
        if (res.data?.success) {
          await this.fetchPlannedPayments()
          await this.fetchSummary()
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menghapus tagihan rutin.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async payBill(id, payload = {}) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.payPlannedPayment(id, {
          finance_period_id: this.activePeriod?.id,
          ...payload,
        })
        if (res.data?.success) {
          await Promise.all([
            this.fetchPlannedPayments(),
            this.fetchSummary(),
            this.fetchWallets(),
            this.fetchTransactions(),
          ])
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal membayar tagihan rutin.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async fetchStatistics(periodId = null) {
      try {
        const targetPeriodId = periodId || this.activePeriod?.id
        const res = await financeService.getStatistics(targetPeriodId)
        if (res.data?.success) {
          this.statistics = res.data.data
        }
      } catch (err) {
        console.error('Failed to fetch statistics:', err)
      }
    },

    // ==========================================
    // TABUNGAN (SAVINGS GOALS)
    // ==========================================
    async fetchSavingsGoals() {
      try {
        const res = await financeService.getSavingsGoals()
        if (res.data?.success) {
          this.savingsGoals = res.data.data
        }
      } catch (err) {
        console.error('Failed to fetch savings goals:', err)
      }
    },

    async saveSavingsGoal(payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.createSavingsGoal(payload)
        if (res.data?.success) {
          await this.fetchSavingsGoals()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menyimpan target tabungan.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async editSavingsGoal(id, payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.updateSavingsGoal(id, payload)
        if (res.data?.success) {
          await this.fetchSavingsGoals()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal memperbarui target tabungan.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async removeSavingsGoal(id) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.deleteSavingsGoal(id)
        if (res.data?.success) {
          await this.fetchSavingsGoals()
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menghapus target tabungan.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async adjustSavingsGoal(id, payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.adjustSavingsGoal(id, payload)
        if (res.data?.success) {
          await Promise.all([
            this.fetchSavingsGoals(),
            this.fetchSummary(),
            this.fetchWallets(),
            this.fetchTransactions(),
          ])
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal memperbarui saldo tabungan.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    // ==========================================
    // HUTANG & PIUTANG (DEBTS)
    // ==========================================
    async fetchDebts() {
      try {
        const res = await financeService.getDebts()
        if (res.data?.success) {
          this.debts = res.data.data
        }
      } catch (err) {
        console.error('Failed to fetch debts:', err)
      }
    },

    async saveDebt(payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.createDebt(payload)
        if (res.data?.success) {
          await Promise.all([
            this.fetchDebts(),
            this.fetchSummary(),
            this.fetchWallets(),
          ])
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menyimpan catatan hutang/piutang.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async editDebt(id, payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.updateDebt(id, payload)
        if (res.data?.success) {
          await this.fetchDebts()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal memperbarui catatan hutang/piutang.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async removeDebt(id) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.deleteDebt(id)
        if (res.data?.success) {
          await this.fetchDebts()
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menghapus catatan hutang/piutang.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async payDebt(id, payload = {}) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.payDebt(id, payload)
        if (res.data?.success) {
          await Promise.all([
            this.fetchDebts(),
            this.fetchSummary(),
            this.fetchWallets(),
            this.fetchTransactions(),
          ])
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal mencatat pembayaran hutang/piutang.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    // ==========================================
    // TO BUY LIST / WISHLIST
    // ==========================================
    async fetchWishlists() {
      try {
        const res = await financeService.getWishlists()
        if (res.data?.success) {
          this.wishlists = res.data.data
        }
      } catch (err) {
        console.error('Failed to fetch wishlists:', err)
      }
    },

    async saveWishlist(payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.createWishlist(payload)
        if (res.data?.success) {
          await this.fetchWishlists()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menyimpan item To Buy.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async editWishlist(id, payload) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.updateWishlist(id, payload)
        if (res.data?.success) {
          await this.fetchWishlists()
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal memperbarui item To Buy.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async removeWishlist(id) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.deleteWishlist(id)
        if (res.data?.success) {
          await this.fetchWishlists()
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal menghapus item To Buy.'
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async actionWishlist(id, payload = {}) {
      this.isSaving = true
      this.clearError()
      try {
        const res = await financeService.actionWishlist(id, payload)
        if (res.data?.success) {
          await Promise.all([
            this.fetchWishlists(),
            this.fetchSummary(),
            this.fetchWallets(),
            this.fetchTransactions(),
          ])
          return res.data.data
        }
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Gagal memperbarui status item To Buy.'
        throw err
      } finally {
        this.isSaving = false
      }
    },
  },
})
