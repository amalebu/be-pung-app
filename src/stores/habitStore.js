import { defineStore } from 'pinia'
import { ref } from 'vue'
import { habitService } from '@/services/habitService'
import { localDb } from '@/services/localDb'
import { useNetworkStore } from '@/stores/networkStore'

export function getTodayDateStr(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('personal_app_user')
    return raw ? JSON.parse(raw)?.id || 1 : 1
  } catch {
    return 1
  }
}

export function getHabitCellVisual(habit, rawVal) {
  const val = Number(rawVal || 0)
  const target = Math.max(0, Number(habit.target_value || 0))
  const step = Math.max(0.01, Number(habit.step_value || 1))

  if (habit.type === 'good') {
    if (val <= 0) {
      return {
        level: 0,
        className:
          'bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/70 dark:border-zinc-700/60',
        label: `0 / ${target} ${habit.unit}`,
      }
    }
    const ratio = target > 0 ? val / target : 1
    if (ratio < 0.4) {
      return {
        level: 1,
        className:
          'bg-emerald-200 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-800',
        label: `${val} / ${target} ${habit.unit} (${Math.round(ratio * 100)}%)`,
      }
    }
    if (ratio < 0.75) {
      return {
        level: 2,
        className:
          'bg-emerald-300 dark:bg-emerald-800/80 border border-emerald-400 dark:border-emerald-700',
        label: `${val} / ${target} ${habit.unit} (${Math.round(ratio * 100)}%)`,
      }
    }
    if (ratio < 1) {
      return {
        level: 3,
        className:
          'bg-emerald-400 dark:bg-emerald-600/80 border border-emerald-500 dark:border-emerald-500',
        label: `${val} / ${target} ${habit.unit} (${Math.round(ratio * 100)}%)`,
      }
    }
    return {
      level: 4,
      className:
        'bg-emerald-600 dark:bg-emerald-500 border border-emerald-700 dark:border-emerald-400 shadow-2xs',
      label: `Target Tercapai! ${val} / ${target} ${habit.unit}`,
    }
  }

  // Tipe 'bad' (Remove Bad Habit):
  // 0 = Putih bersih, tergoda sedikit = Agak merah, lebih dari maksimal = Merah pekat
  if (val <= 0) {
    return {
      level: 0,
      className:
        'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700',
      label: `Bersih (0 ${habit.unit})`,
    }
  }

  const maxThreshold = target > 0 ? target : step
  if (val <= maxThreshold) {
    return {
      level: 2,
      className:
        'bg-rose-300 dark:bg-rose-900/80 border border-rose-400 dark:border-rose-700',
      label: `Tergoda sedikit (${val} ${habit.unit}, maks ${target} ${habit.unit})`,
    }
  }

  return {
    level: 4,
    className:
      'bg-rose-600 dark:bg-rose-500 border border-rose-700 dark:border-rose-400 shadow-2xs',
    label: `Melewati batas! (${val} ${habit.unit}, maks ${target} ${habit.unit})`,
  }
}

function recalculateHabitLocalState(habit) {
  const todayStr = getTodayDateStr(0)
  const logs = Array.isArray(habit.logs) ? [...habit.logs] : []
  const logMap = {}
  for (const log of logs) {
    if (log.logged_date) {
      logMap[log.logged_date] = Number(log.value || 0)
    }
  }

  const todayVal = Number(logMap[todayStr] || 0)
  const target = Math.max(0, Number(habit.target_value || 0))
  const isTodayGoalMet =
    habit.type === 'good'
      ? target > 0
        ? todayVal >= target
        : todayVal > 0
      : todayVal <= target

  // Hitung current streak sederhana secara lokal
  let streak = 0
  if (habit.type === 'good') {
    const isSuccess = (v) => (target > 0 ? v >= target : v > 0)
    let offset = isSuccess(todayVal) ? 0 : -1
    while (offset > -365) {
      const dStr = getTodayDateStr(offset)
      if (isSuccess(Number(logMap[dStr] || 0))) {
        streak++
        offset--
      } else {
        break
      }
    }
  } else {
    let offset = 0
    while (offset > -30) {
      const dStr = getTodayDateStr(offset)
      const v = Number(logMap[dStr] || 0)
      if (v <= target) {
        streak++
        offset--
      } else {
        break
      }
      if (offset < -14 && logMap[dStr] === undefined) break
    }
  }

  return {
    ...habit,
    logs,
    today_value: Math.round(todayVal * 100) / 100,
    is_today_goal_met: isTodayGoalMet,
    current_streak: streak,
    longest_streak: Math.max(Number(habit.longest_streak || 0), streak),
  }
}

function computeLocalSummary(allHabits) {
  let goodCount = 0
  let badCount = 0
  let goodCompletedToday = 0
  let badCleanToday = 0
  let bestStreak = 0

  for (const h of allHabits) {
    if (h.type === 'good') {
      goodCount++
      if (h.is_today_goal_met) goodCompletedToday++
    } else {
      badCount++
      if (h.is_today_goal_met) badCleanToday++
    }
    if (Number(h.current_streak || 0) > bestStreak) {
      bestStreak = Number(h.current_streak || 0)
    }
  }

  return {
    total: allHabits.length,
    good_count: goodCount,
    bad_count: badCount,
    good_completed_today: goodCompletedToday,
    bad_clean_today: badCleanToday,
    best_streak: bestStreak,
  }
}

export const useHabitStore = defineStore('habit', () => {
  const networkStore = useNetworkStore()

  const habits = ref([])
  const summary = ref({
    total: 0,
    good_count: 0,
    bad_count: 0,
    good_completed_today: 0,
    bad_clean_today: 0,
    best_streak: 0,
  })

  const activeTypeFilter = ref('all') // all | good | bad
  const searchQuery = ref('')

  const loading = ref(false)
  const saving = ref(false)
  const errorMessage = ref('')
  const validationErrors = ref({})

  // Bottom Sheet States
  const isFormSheetOpen = ref(false)
  const editingHabit = ref(null)

  const isLogSheetOpen = ref(false)
  const activeLogTarget = ref(null) // { habit, dateStr, currentValue, note }

  networkStore.onSyncCompleted(async () => {
    await fetchHabits()
  })

  function clearErrors() {
    errorMessage.value = ''
    validationErrors.value = {}
  }

  function openCreateSheet(defaultType = 'good') {
    clearErrors()
    editingHabit.value = { type: defaultType }
    isFormSheetOpen.value = true
  }

  function openEditSheet(habit) {
    clearErrors()
    editingHabit.value = habit
    isFormSheetOpen.value = true
  }

  function closeFormSheet() {
    isFormSheetOpen.value = false
    editingHabit.value = null
    saving.value = false
    clearErrors()
  }

  function openLogDaySheet(habit, dateStr = getTodayDateStr(0)) {
    clearErrors()
    const existingLog = (habit.logs || []).find((l) => l.logged_date === dateStr)
    activeLogTarget.value = {
      habit,
      dateStr,
      currentValue: existingLog ? Number(existingLog.value) : 0,
      note: existingLog?.note || '',
    }
    isLogSheetOpen.value = true
  }

  function closeLogDaySheet() {
    isLogSheetOpen.value = false
    activeLogTarget.value = null
  }

  async function refreshFromLocalCache() {
    const userId = getCurrentUserId()
    const cached = (await localDb.getCachedHabits(userId)).map(
      recalculateHabitLocalState
    )
    summary.value = computeLocalSummary(cached)

    const q = searchQuery.value.trim().toLowerCase()
    habits.value = cached.filter((h) => {
      if (activeTypeFilter.value !== 'all' && h.type !== activeTypeFilter.value) {
        return false
      }
      if (q) {
        const inName = (h.name || '').toLowerCase().includes(q)
        const inDesc = (h.description || '').toLowerCase().includes(q)
        if (!inName && !inDesc) return false
      }
      return true
    })
  }

  async function fetchHabits() {
    clearErrors()
    const userId = getCurrentUserId()

    await refreshFromLocalCache()

    if (!networkStore.isOnline) {
      return { success: true, offline: true }
    }

    loading.value = habits.value.length === 0
    try {
      const res = await habitService.getHabits()
      const serverHabits = res.data?.habits || []

      await localDb.saveCachedHabits(userId, serverHabits)
      await refreshFromLocalCache()
      return { success: true, data: res.data }
    } catch (err) {
      if (!err.response) {
        networkStore.markOffline()
        await refreshFromLocalCache()
        return { success: true, offline: true }
      }
      errorMessage.value =
        err.response?.data?.message || 'Gagal memuat daftar habit.'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  async function setTypeFilter(type) {
    activeTypeFilter.value = type
    await refreshFromLocalCache()
  }

  async function createHabit(payload) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()

    try {
      if (networkStore.isOnline) {
        try {
          const res = await habitService.createHabit(payload)
          if (res.data) {
            await localDb.putCachedHabit({
              ...res.data,
              user_id: userId,
              is_pending_sync: false,
            })
          }
          await refreshFromLocalCache()
          saving.value = false
          await new Promise((r) => setTimeout(r, 100))
          closeFormSheet()
          return { success: true, data: res.data }
        } catch (err) {
          if (err.response) {
            const responseData = err.response.data
            errorMessage.value =
              responseData?.errors?.name?.[0] ||
              responseData?.message ||
              'Gagal menyimpan kebiasaan baru.'
            validationErrors.value = responseData?.errors || {}
            saving.value = false
            return { success: false }
          }
          networkStore.markOffline()
        }
      }

      const tempHabitId = -Date.now()
      const offlineHabit = recalculateHabitLocalState({
        id: tempHabitId,
        user_id: userId,
        name: payload.name,
        description: payload.description || null,
        type: payload.type || 'good',
        icon: payload.icon || (payload.type === 'bad' ? 'ban' : 'droplets'),
        unit: payload.unit || 'kali',
        target_value: Number(payload.target_value ?? 1),
        step_value: Number(payload.step_value ?? 1),
        current_streak: payload.type === 'bad' ? 1 : 0,
        longest_streak: payload.type === 'bad' ? 1 : 0,
        is_active: true,
        logs: [],
        is_pending_sync: true,
        created_at: new Date().toISOString(),
      })

      await localDb.putCachedHabit(offlineHabit)
      await localDb.enqueueSyncAction({
        userId,
        type: 'create_habit',
        habitId: tempHabitId,
        payload,
      })
      await networkStore.refreshPendingCount()
      await refreshFromLocalCache()
      saving.value = false
      await new Promise((r) => setTimeout(r, 100))
      closeFormSheet()
      return { success: true, data: offlineHabit, offline: true }
    } finally {
      saving.value = false
    }
  }

  async function updateHabit(id, payload) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()

    try {
      if (networkStore.isOnline && Number(id) > 0) {
        try {
          const res = await habitService.updateHabit(id, payload)
          if (res.data) {
            await localDb.putCachedHabit({
              ...res.data,
              user_id: userId,
              is_pending_sync: false,
            })
          }
          await refreshFromLocalCache()
          saving.value = false
          await new Promise((r) => setTimeout(r, 100))
          closeFormSheet()
          return { success: true, data: res.data }
        } catch (err) {
          if (err.response) {
            const responseData = err.response.data
            errorMessage.value =
              responseData?.errors?.name?.[0] ||
              responseData?.message ||
              'Gagal memperbarui kebiasaan.'
            validationErrors.value = responseData?.errors || {}
            saving.value = false
            return { success: false }
          }
          networkStore.markOffline()
        }
      }

      const allCached = await localDb.getCachedHabits(userId)
      const existing = allCached.find((h) => Number(h.id) === Number(id))
      const updatedLocal = recalculateHabitLocalState({
        ...(existing || {}),
        id: Number(id),
        user_id: userId,
        ...payload,
        target_value: Number(payload.target_value),
        step_value: Number(payload.step_value),
        is_pending_sync: true,
      })

      await localDb.putCachedHabit(updatedLocal)
      await localDb.enqueueSyncAction({
        userId,
        type: 'update_habit',
        habitId: Number(id),
        payload,
      })
      await networkStore.refreshPendingCount()
      await refreshFromLocalCache()
      saving.value = false
      await new Promise((r) => setTimeout(r, 100))
      closeFormSheet()
      return { success: true, data: updatedLocal, offline: true }
    } finally {
      saving.value = false
    }
  }

  async function deleteHabit(id) {
    const userId = getCurrentUserId()
    await localDb.deleteCachedHabit(id)
    await refreshFromLocalCache()

    if (networkStore.isOnline && Number(id) > 0) {
      try {
        await habitService.deleteHabit(id)
        return { success: true }
      } catch (err) {
        if (!err.response) {
          networkStore.markOffline()
        } else {
          return { success: false }
        }
      }
    }

    if (Number(id) > 0) {
      await localDb.enqueueSyncAction({
        userId,
        type: 'delete_habit',
        habitId: Number(id),
      })
      await networkStore.refreshPendingCount()
    }
    return { success: true, offline: true }
  }

  const logSeqMap = {}
  const pendingDebounceTimers = {}

  async function logProgress(habitId, { logged_date = getTodayDateStr(0), mode = 'increment', value = 1, note = null, immediate = false }) {
    const userId = getCurrentUserId()

    // 1. Ambil state habit (utamakan in-memory reactive state habits.value untuk respon instan 0ms)
    let habitIdx = habits.value.findIndex((h) => Number(h.id) === Number(habitId))
    let existing = habitIdx !== -1 ? habits.value[habitIdx] : null

    if (!existing) {
      const allCached = await localDb.getCachedHabits(userId)
      existing = allCached.find((h) => Number(h.id) === Number(habitId))
      if (!existing) return { success: false }
    }

    // 2. Kalkulasi nilai baru secara optimis
    const currentLogs = Array.isArray(existing.logs) ? [...existing.logs] : []
    const logIdx = currentLogs.findIndex((l) => l.logged_date === logged_date)
    const prevVal = logIdx !== -1 ? Number(currentLogs[logIdx].value || 0) : 0
    const nextVal =
      mode === 'set'
        ? Math.max(0, Math.round(Number(value) * 100) / 100)
        : Math.max(0, Math.round((prevVal + Number(value)) * 100) / 100)

    if (logIdx !== -1) {
      currentLogs[logIdx] = {
        ...currentLogs[logIdx],
        value: nextVal,
        note: note !== null ? note : currentLogs[logIdx].note,
      }
    } else {
      currentLogs.push({
        id: -Date.now(),
        habit_id: Number(habitId),
        logged_date,
        value: nextVal,
        note,
      })
    }

    const optimisticHabit = recalculateHabitLocalState({
      ...existing,
      logs: currentLogs,
      is_pending_sync: !networkStore.isOnline || Number(habitId) < 0,
    })

    // 3. UPDATE STATE IN-MEMORY SECARA SINKRON (0ms - bebas lag & bebas maju-mundur)
    if (habitIdx !== -1) {
      habits.value[habitIdx] = optimisticHabit
    } else {
      habits.value.push(optimisticHabit)
      habitIdx = habits.value.length - 1
    }
    summary.value = computeLocalSummary(habits.value)

    // 4. Simpan ke IndexedDB di background
    await localDb.putCachedHabit(optimisticHabit)

    // 5. Sequence counter per habit untuk mengabaikan respon server lawas/stale
    logSeqMap[habitId] = (logSeqMap[habitId] || 0) + 1
    const currentSeq = logSeqMap[habitId]

    if (pendingDebounceTimers[habitId]) {
      clearTimeout(pendingDebounceTimers[habitId])
      delete pendingDebounceTimers[habitId]
    }

    const payload = {
      logged_date,
      mode: 'set',
      value: nextVal,
      note,
    }

    const executeSync = async () => {
      delete pendingDebounceTimers[habitId]

      if (networkStore.isOnline && Number(habitId) > 0) {
        try {
          const res = await habitService.logProgress(habitId, payload)
          // Jika ada klik lanjutan dari user saat request sedang terbang, buang respon lawas agar tidak loncat!
          if (logSeqMap[habitId] !== currentSeq) {
            return { success: true }
          }

          if (res.data) {
            await localDb.putCachedHabit({
              ...res.data,
              user_id: userId,
              is_pending_sync: false,
            })
            if (logSeqMap[habitId] === currentSeq) {
              await refreshFromLocalCache()
            }
          }
          return { success: true, data: res.data }
        } catch (err) {
          if (!err.response) {
            networkStore.markOffline()
          } else {
            return { success: false }
          }
        }
      }

      // Offline mode atau gagal koneksi server
      await localDb.putCachedHabit({ ...optimisticHabit, is_pending_sync: true })
      await localDb.enqueueSyncAction({
        userId,
        type: 'log_habit',
        habitId: Number(habitId),
        payload,
      })
      await networkStore.refreshPendingCount()
      if (logSeqMap[habitId] === currentSeq) {
        await refreshFromLocalCache()
      }
      return { success: true, data: optimisticHabit, offline: true }
    }

    if (immediate) {
      return await executeSync()
    }

    return new Promise((resolve) => {
      pendingDebounceTimers[habitId] = setTimeout(async () => {
        const result = await executeSync()
        resolve(result)
      }, 200)
    })
  }

  return {
    habits,
    summary,
    activeTypeFilter,
    searchQuery,
    loading,
    saving,
    errorMessage,
    validationErrors,
    isFormSheetOpen,
    editingHabit,
    isLogSheetOpen,
    activeLogTarget,
    clearErrors,
    openCreateSheet,
    openEditSheet,
    closeFormSheet,
    openLogDaySheet,
    closeLogDaySheet,
    refreshFromLocalCache,
    fetchHabits,
    setTypeFilter,
    createHabit,
    updateHabit,
    deleteHabit,
    logProgress,
  }
})
