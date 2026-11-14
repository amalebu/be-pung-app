import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { investmentService } from '@/services/investmentService'
import { localDb } from '@/services/localDb'

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('personal_app_user')
    return raw ? JSON.parse(raw)?.id || 1 : 1
  } catch {
    return 1
  }
}

export const useInvestmentStore = defineStore('investment', () => {
  const summary = ref({
    total_portfolio_value: 0,
    cash_balance: 0,
    stock_market_value: 0,
    stock_cost_basis: 0,
    daily_pl: 0,
    unrealized_pl: 0,
    unrealized_pl_percent: 0,
    realized_pl: 0,
    active_tickers_count: 0,
    total_open_lots: 0,
  })

  const cash = ref({
    balance: 0,
    total_topup: 0,
    total_withdrawn: 0,
    mutations: [],
  })

  const stocks = ref([])
  const sales = ref([])

  const searchQuery = ref('')
  const activeTab = ref('holdings') // holdings | sales | cash
  const expandedTickerIds = ref([]) // Daftar stock.id yang sedang di-expand

  const loading = ref(false)
  const refreshingPrices = ref(false)
  const saving = ref(false)
  const errorMessage = ref('')

  // BottomSheet Modal States
  const isBuySheetOpen = ref(false)
  const prefilledTicker = ref('')

  const isCashSheetOpen = ref(false)
  const initialCashMode = ref('topup') // topup | withdraw | adjustment

  const isEditLotSheetOpen = ref(false)
  const editingLot = ref(null) // objek lot yang sedang diedit

  const isClosePositionSheetOpen = ref(false)
  const closingTarget = ref(null) // { stock, lot (opsional) }

  // Privacy Mode (Show/Hide Balance with ****)
  const isBalanceMasked = ref(
    typeof window !== 'undefined'
      ? localStorage.getItem('investment_privacy_mode') === 'true'
      : false
  )

  function toggleBalanceMask() {
    isBalanceMasked.value = !isBalanceMasked.value
    try {
      localStorage.setItem('investment_privacy_mode', String(isBalanceMasked.value))
    } catch {
      // Ignore storage write issues
    }
  }

  const filteredStocks = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return stocks.value
    return stocks.value.filter(
      (s) =>
        (s.ticker || '').toLowerCase().includes(q) ||
        (s.company_name || '').toLowerCase().includes(q)
    )
  })

  function applyPortfolioPayload(payload) {
    if (!payload) return
    if (payload.summary) summary.value = payload.summary
    if (payload.cash) cash.value = payload.cash
    if (Array.isArray(payload.stocks)) stocks.value = payload.stocks
    if (Array.isArray(payload.sales)) sales.value = payload.sales
  }

  function clearErrors() {
    errorMessage.value = ''
  }

  function toggleExpandStock(stockId) {
    const idx = expandedTickerIds.value.indexOf(stockId)
    if (idx >= 0) {
      expandedTickerIds.value.splice(idx, 1)
    } else {
      expandedTickerIds.value.push(stockId)
    }
  }

  function isStockExpanded(stockId) {
    return expandedTickerIds.value.includes(stockId)
  }

  // Modal Open/Close Helpers
  function openBuySheet(ticker = '') {
    clearErrors()
    prefilledTicker.value = ticker || ''
    isBuySheetOpen.value = true
  }

  function closeBuySheet() {
    isBuySheetOpen.value = false
    prefilledTicker.value = ''
    clearErrors()
  }

  function openCashSheet(mode = 'topup') {
    clearErrors()
    initialCashMode.value = mode
    isCashSheetOpen.value = true
  }

  function closeCashSheet() {
    isCashSheetOpen.value = false
    clearErrors()
  }

  function openEditLotSheet(lot, stock) {
    clearErrors()
    editingLot.value = {
      ...lot,
      ticker: stock?.ticker || lot.ticker,
      company_name: stock?.company_name || '',
    }
    isEditLotSheetOpen.value = true
  }

  function closeEditLotSheet() {
    isEditLotSheetOpen.value = false
    editingLot.value = null
    clearErrors()
  }

  function openClosePositionSheet({ stock, lot = null }) {
    clearErrors()
    closingTarget.value = { stock, lot }
    isClosePositionSheetOpen.value = true
  }

  function closeClosePositionSheet() {
    isClosePositionSheetOpen.value = false
    closingTarget.value = null
    clearErrors()
  }

  // API Actions
  /**
   * Menghitung total transaksi kotor (Buy + Sale) pada tanggal tertentu
   * yang sudah ada di portofolio (kecuali lot/sale yang sedang diedit).
   */
  function getExistingDailyTurnover(dateStr, excludeLotId = null, excludeSaleId = null) {
    if (!dateStr) return 0
    const targetDate = String(dateStr).split('T')[0]
    let total = 0

    // Akumulasi pembelian (Buy lots)
    for (const stock of (stocks.value || [])) {
      for (const lot of (stock.lots || [])) {
        if (excludeLotId && String(lot.id) === String(excludeLotId)) {
          continue
        }
        const lotDate = String(lot.opened_at || '').split('T')[0]
        if (lotDate === targetDate) {
          total += (Number(lot.initial_lots || 0) * 100 * Number(lot.buy_price || 0))
        }
      }
    }

    // Akumulasi penjualan (Sales)
    for (const sale of (sales.value || [])) {
      if (excludeSaleId && String(sale.id) === String(excludeSaleId)) {
        continue
      }
      const saleDate = String(sale.sold_at || '').split('T')[0]
      if (saleDate === targetDate) {
        total += (Number(sale.sold_lots || 0) * 100 * Number(sale.sell_price || 0))
      }
    }

    return total
  }

  /**
   * Memeriksa apakah transaksi pada tanggal tertentu dengan nilai kotor baru
   * akan memicu Fee Materai Rp 10.000 untuk pertama kalinya hari itu.
   * Return true HANYA jika sebelum transaksi ini turnover <= 10jt DAN setelah ditambah menjadi > 10jt.
   */
  function willTriggerDailyStampDuty(dateStr, newGrossTurnover, excludeLotId = null, excludeSaleId = null) {
    const existing = getExistingDailyTurnover(dateStr, excludeLotId, excludeSaleId)
    // Jika sebelum transaksi ini sudah > 10jt, fee materai sudah aktif di transaksi sebelumnya -> tidak tampil lagi
    if (existing > 10000000) {
      return false
    }
    // Jika sebelum <= 10jt dan setelah ditambah transaksi ini menjadi > 10jt -> tampilkan
    return (existing + Number(newGrossTurnover || 0)) > 10000000
  }

  async function fetchPortfolio(forceRefresh = false) {
    clearErrors()
    const userId = getCurrentUserId()

    try {
      const cached = await localDb.getCachedPortfolio(userId)
      if (cached) {
        applyPortfolioPayload(cached)
      }
    } catch {
      // Ignore cache reading error
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      loading.value = false
      return { success: true, offline: true }
    }

    loading.value = stocks.value.length === 0
    if (forceRefresh) refreshingPrices.value = true

    try {
      const res = await investmentService.getPortfolio(forceRefresh)
      if (res.data) {
        applyPortfolioPayload(res.data)
        await localDb.saveCachedPortfolio(userId, res.data)
      }
      return { success: true }
    } catch (err) {
      if (!err.response) {
        // Offline / network failure: keep current cached data active
        return { success: true, offline: true }
      }
      errorMessage.value =
        err.response?.data?.message || 'Gagal memuat data portofolio investasi.'
      return { success: false }
    } finally {
      loading.value = false
      refreshingPrices.value = false
    }
  }

  async function refreshMarketPrices() {
    refreshingPrices.value = true
    clearErrors()
    const userId = getCurrentUserId()
    try {
      const res = await investmentService.refreshPrices()
      if (res.data) {
        applyPortfolioPayload(res.data)
        await localDb.saveCachedPortfolio(userId, res.data)
      }
      return { success: true }
    } catch (err) {
      errorMessage.value =
        err.response?.data?.message || 'Gagal memperbarui harga dari Yahoo Finance.'
      return { success: false }
    } finally {
      refreshingPrices.value = false
    }
  }

  async function submitCashAdjustment(payload) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()
    try {
      const res = await investmentService.adjustCash(payload)
      if (res.data) {
        applyPortfolioPayload(res.data)
        await localDb.saveCachedPortfolio(userId, res.data)
      }
      closeCashSheet()
      return { success: true }
    } catch (err) {
      const firstFieldErr = Object.values(err.response?.data?.errors || {})[0]?.[0]
      errorMessage.value =
        firstFieldErr || err.response?.data?.message || 'Gagal menyimpan perubahan Cash RDN.'
      return { success: false }
    } finally {
      saving.value = false
    }
  }

  async function submitBuyLot(payload) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()
    try {
      const res = await investmentService.buyStockLot(payload)
      if (res.data) {
        applyPortfolioPayload(res.data)
        await localDb.saveCachedPortfolio(userId, res.data)
      }
      closeBuySheet()
      return { success: true }
    } catch (err) {
      const firstFieldErr = Object.values(err.response?.data?.errors || {})[0]?.[0]
      errorMessage.value =
        firstFieldErr || err.response?.data?.message || 'Gagal mencatat pembelian saham.'
      return { success: false }
    } finally {
      saving.value = false
    }
  }

  async function submitUpdateLot(lotId, payload) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()
    try {
      const res = await investmentService.updateStockLot(lotId, payload)
      if (res.data) {
        applyPortfolioPayload(res.data)
        await localDb.saveCachedPortfolio(userId, res.data)
      }
      closeEditLotSheet()
      return { success: true }
    } catch (err) {
      const firstFieldErr = Object.values(err.response?.data?.errors || {})[0]?.[0]
      errorMessage.value =
        firstFieldErr || err.response?.data?.message || 'Gagal memperbarui posisi pembelian.'
      return { success: false }
    } finally {
      saving.value = false
    }
  }

  async function submitDeleteLot(lotId) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()
    try {
      const res = await investmentService.deleteStockLot(lotId)
      if (res.data) {
        applyPortfolioPayload(res.data)
        await localDb.saveCachedPortfolio(userId, res.data)
      }
      closeEditLotSheet()
      return { success: true }
    } catch (err) {
      errorMessage.value =
        err.response?.data?.message || 'Gagal menghapus posisi pembelian.'
      return { success: false }
    } finally {
      saving.value = false
    }
  }

  async function submitClosePosition(payload) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()
    try {
      const res = await investmentService.closePosition(payload)
      if (res.data) {
        applyPortfolioPayload(res.data)
        await localDb.saveCachedPortfolio(userId, res.data)
      }
      closeClosePositionSheet()
      return { success: true }
    } catch (err) {
      const firstFieldErr = Object.values(err.response?.data?.errors || {})[0]?.[0]
      errorMessage.value =
        firstFieldErr || err.response?.data?.message || 'Gagal menutup posisi saham.'
      return { success: false }
    } finally {
      saving.value = false
    }
  }

  async function submitDeleteSale(saleId) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()
    try {
      const res = await investmentService.deleteStockSale(saleId)
      if (res.data) {
        applyPortfolioPayload(res.data)
        await localDb.saveCachedPortfolio(userId, res.data)
      }
      return { success: true }
    } catch (err) {
      errorMessage.value =
        err.response?.data?.message || 'Gagal membatalkan transaksi penjualan.'
      return { success: false, message: errorMessage.value }
    } finally {
      saving.value = false
    }
  }

  async function recalculateFees() {
    loading.value = true
    clearErrors()
    const userId = getCurrentUserId()
    try {
      const res = await investmentService.recalculateFees()
      if (res.data) {
        applyPortfolioPayload(res.data)
        await localDb.saveCachedPortfolio(userId, res.data)
      }
      return { success: true }
    } catch (err) {
      errorMessage.value = err.response?.data?.message || 'Gagal menghitung ulang fee materai.'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  return {
    summary,
    cash,
    stocks,
    sales,
    filteredStocks,
    searchQuery,
    activeTab,
    expandedTickerIds,
    loading,
    refreshingPrices,
    saving,
    errorMessage,
    isBuySheetOpen,
    prefilledTicker,
    isCashSheetOpen,
    initialCashMode,
    isEditLotSheetOpen,
    editingLot,
    isClosePositionSheetOpen,
    closingTarget,
    isBalanceMasked,
    toggleBalanceMask,
    toggleExpandStock,
    isStockExpanded,
    openBuySheet,
    closeBuySheet,
    openCashSheet,
    closeCashSheet,
    openEditLotSheet,
    closeEditLotSheet,
    openClosePositionSheet,
    closeClosePositionSheet,
    fetchPortfolio,
    refreshMarketPrices,
    submitCashAdjustment,
    submitBuyLot,
    submitUpdateLot,
    submitDeleteLot,
    submitClosePosition,
    submitDeleteSale,
    recalculateFees,
    getExistingDailyTurnover,
    willTriggerDailyStampDuty,
  }
})
