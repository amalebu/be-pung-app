import { defineStore } from 'pinia'
import { ref } from 'vue'
import { todoService } from '@/services/todoService'
import { localDb } from '@/services/localDb'
import { useNetworkStore } from '@/stores/networkStore'

function getTodayDateStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getNowTimeStr() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('personal_app_user')
    return raw ? JSON.parse(raw)?.id || 1 : 1
  } catch {
    return 1
  }
}

function computeIsOverdue(todo, todayStr = getTodayDateStr(), nowTime = getNowTimeStr()) {
  if (todo.is_completed || !todo.due_date) return false
  if (todo.due_date < todayStr) return true
  if (todo.due_date === todayStr && todo.due_time && todo.due_time < nowTime) {
    return true
  }
  return false
}

function normalizeTodoWithSubtasks(todo) {
  const items = Array.isArray(todo.items) ? todo.items : []
  const subtasksTotal = items.length
  const subtasksCompleted = items.filter((i) => i.is_completed).length

  let isCompleted = Boolean(todo.is_completed)
  if (subtasksTotal > 0) {
    isCompleted = subtasksCompleted === subtasksTotal
  }

  const normalized = {
    ...todo,
    items,
    is_completed: isCompleted,
    subtasks_total: subtasksTotal,
    subtasks_completed: subtasksCompleted,
  }
  normalized.is_overdue = computeIsOverdue(normalized)
  return normalized
}

function computeLocalCounts(allTodos) {
  const today = getTodayDateStr()
  const nowTime = getNowTimeStr()

  let active = 0
  let todayCount = 0
  let upcoming = 0
  let overdue = 0
  let completed = 0

  for (const todo of allTodos) {
    if (todo.is_completed) {
      completed++
      continue
    }
    active++
    if (!todo.due_date) continue

    if (computeIsOverdue(todo, today, nowTime)) {
      overdue++
    }
    if (todo.due_date === today) {
      todayCount++
    } else if (todo.due_date > today) {
      upcoming++
    }
  }

  return {
    all: allTodos.length,
    active,
    today: todayCount,
    upcoming,
    overdue,
    completed,
  }
}

function filterAndSortLocalTodos(allTodos, { filter = 'all', priority = '', search = '' }) {
  const today = getTodayDateStr()
  const nowTime = getNowTimeStr()
  const q = (search || '').trim().toLowerCase()

  const filtered = allTodos
    .map((t) => ({
      ...t,
      is_overdue: computeIsOverdue(t, today, nowTime),
    }))
    .filter((todo) => {
      if (filter === 'today') {
        if (todo.is_completed || todo.due_date !== today) return false
      } else if (filter === 'upcoming') {
        if (todo.is_completed || !todo.due_date || todo.due_date <= today) return false
      } else if (filter === 'overdue') {
        if (todo.is_completed || !todo.is_overdue) return false
      } else if (filter === 'completed') {
        if (!todo.is_completed) return false
      } else if (filter === 'active') {
        if (todo.is_completed) return false
      }

      if (priority && todo.priority !== priority) {
        return false
      }

      if (q) {
        const inTitle = (todo.title || '').toLowerCase().includes(q)
        const inDesc = (todo.description || '').toLowerCase().includes(q)
        if (!inTitle && !inDesc) return false
      }

      return true
    })

  const priorityRank = { high: 1, medium: 2, low: 3 }

  return filtered.sort((a, b) => {
    if (Boolean(a.is_completed) !== Boolean(b.is_completed)) {
      return a.is_completed ? 1 : -1
    }
    const pa = priorityRank[a.priority] || 2
    const pb = priorityRank[b.priority] || 2
    if (pa !== pb) return pa - pb

    if (Boolean(a.due_date) !== Boolean(b.due_date)) {
      return a.due_date ? -1 : 1
    }
    if (a.due_date && b.due_date && a.due_date !== b.due_date) {
      return a.due_date.localeCompare(b.due_date)
    }
    if (Boolean(a.due_time) !== Boolean(b.due_time)) {
      return a.due_time ? -1 : 1
    }
    if (a.due_time && b.due_time && a.due_time !== b.due_time) {
      return a.due_time.localeCompare(b.due_time)
    }
    return Math.abs(Number(b.id)) - Math.abs(Number(a.id))
  })
}

export const useTodoStore = defineStore('todo', () => {
  const networkStore = useNetworkStore()

  const todos = ref([])
  const counts = ref({
    all: 0,
    active: 0,
    today: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
  })

  const activeFilter = ref('all') // all | today | upcoming | overdue | completed
  const activePriority = ref('') // '' | high | medium | low
  const searchQuery = ref('')

  const loading = ref(false)
  const saving = ref(false)
  const errorMessage = ref('')
  const validationErrors = ref({})

  // Global Bottom Sheet State
  const isSheetOpen = ref(false)
  const editingTodo = ref(null)

  // Register callback when networkStore finishes replaying offline queue
  networkStore.onSyncCompleted(async () => {
    await fetchTodos()
  })

  function clearErrors() {
    errorMessage.value = ''
    validationErrors.value = {}
  }

  function openCreateSheet() {
    clearErrors()
    editingTodo.value = null
    isSheetOpen.value = true
  }

  function openEditSheet(todo) {
    clearErrors()
    editingTodo.value = todo
    isSheetOpen.value = true
  }

  function closeSheet() {
    isSheetOpen.value = false
    editingTodo.value = null
    saving.value = false
    clearErrors()
  }

  async function refreshFromLocalCache() {
    const userId = getCurrentUserId()
    const allCached = await localDb.getCachedTodos(userId)
    counts.value = computeLocalCounts(allCached)
    todos.value = filterAndSortLocalTodos(allCached, {
      filter: activeFilter.value,
      priority: activePriority.value,
      search: searchQuery.value,
    })
  }

  async function fetchTodos(customParams = {}) {
    clearErrors()
    const userId = getCurrentUserId()

    // 1. Tampilkan data dari IndexedDB browser secara instan (0ms Offline-First)
    await refreshFromLocalCache()

    if (!networkStore.isOnline) {
      return { success: true, offline: true }
    }

    loading.value = todos.value.length === 0
    try {
      // Ambil seluruh daftar milik user dari server agar cache IndexedDB selalu utuh untuk semua tab filter
      const res = await todoService.getTodos({ filter: 'all' })
      const serverTodos = res.data?.todos || []

      await localDb.saveCachedTodos(userId, serverTodos)
      await refreshFromLocalCache()

      return { success: true, data: res.data }
    } catch (err) {
      if (!err.response) {
        networkStore.markOffline()
        await refreshFromLocalCache()
        return { success: true, offline: true }
      }
      errorMessage.value =
        err.response?.data?.message || 'Gagal memuat daftar tugas.'
      return { success: false }
    } finally {
      loading.value = false
    }
  }

  async function setFilter(filter) {
    activeFilter.value = filter
    await refreshFromLocalCache()
  }

  async function setPriorityFilter(priority) {
    activePriority.value = activePriority.value === priority ? '' : priority
    await refreshFromLocalCache()
  }

  async function createTodo(payload) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()

    try {
      if (networkStore.isOnline) {
        try {
          const res = await todoService.createTodo(payload)
          if (res.data) {
            await localDb.putCachedTodo({
              ...res.data,
              user_id: userId,
              is_pending_sync: false,
            })
          }
          await refreshFromLocalCache()
          saving.value = false
          await new Promise((r) => setTimeout(r, 100))
          closeSheet()
          return { success: true, data: res.data }
        } catch (err) {
          if (err.response) {
            const responseData = err.response.data
            errorMessage.value =
              responseData?.errors?.title?.[0] ||
              responseData?.message ||
              'Gagal menyimpan tugas baru.'
            validationErrors.value = responseData?.errors || {}
            saving.value = false
            return { success: false, error: responseData }
          }
          // Network error -> fallback to offline IndexedDB storage below
          networkStore.markOffline()
        }
      }

      // Offline Mode: Simpan ke IndexedDB + masukkan ke Sync Queue
      const tempTodoId = -Date.now()
      const tempItemIds = []
      const localItems = (payload.items || []).map((item, idx) => {
        const tempItemId = -(Date.now() + idx + 1)
        tempItemIds.push(tempItemId)
        return {
          id: tempItemId,
          todo_id: tempTodoId,
          title: item.title,
          is_completed: Boolean(item.is_completed),
          sort_order: idx,
        }
      })

      const offlineTodo = normalizeTodoWithSubtasks({
        id: tempTodoId,
        user_id: userId,
        title: payload.title,
        description: payload.description || null,
        priority: payload.priority || 'medium',
        due_date: payload.due_date || null,
        due_time: payload.due_date ? payload.due_time || null : null,
        is_completed: false,
        items: localItems,
        is_pending_sync: true,
        created_at: new Date().toISOString(),
      })

      await localDb.putCachedTodo(offlineTodo)
      await localDb.enqueueSyncAction({
        userId,
        type: 'create_todo',
        todoId: tempTodoId,
        tempItemIds,
        payload,
      })
      await networkStore.refreshPendingCount()
      await refreshFromLocalCache()
      saving.value = false
      await new Promise((r) => setTimeout(r, 100))
      closeSheet()
      return { success: true, data: offlineTodo, offline: true }
    } finally {
      saving.value = false
    }
  }

  async function updateTodo(id, payload) {
    saving.value = true
    clearErrors()
    const userId = getCurrentUserId()

    try {
      if (networkStore.isOnline && Number(id) > 0) {
        try {
          const res = await todoService.updateTodo(id, payload)
          if (res.data) {
            await localDb.putCachedTodo({
              ...res.data,
              user_id: userId,
              is_pending_sync: false,
            })
          }
          await refreshFromLocalCache()
          saving.value = false
          await new Promise((r) => setTimeout(r, 100))
          closeSheet()
          return { success: true, data: res.data }
        } catch (err) {
          if (err.response) {
            const responseData = err.response.data
            errorMessage.value =
              responseData?.errors?.title?.[0] ||
              responseData?.message ||
              'Gagal memperbarui tugas.'
            validationErrors.value = responseData?.errors || {}
            saving.value = false
            return { success: false, error: responseData }
          }
          networkStore.markOffline()
        }
      }

      // Offline Mode Update
      const allCached = await localDb.getCachedTodos(userId)
      const existing = allCached.find((t) => Number(t.id) === Number(id))
      const localItems = (payload.items || []).map((item, idx) => ({
        id: item.id || -(Date.now() + idx + 1),
        todo_id: Number(id),
        title: item.title,
        is_completed: Boolean(item.is_completed),
        sort_order: idx,
      }))

      const updatedLocal = normalizeTodoWithSubtasks({
        ...(existing || {}),
        id: Number(id),
        user_id: userId,
        title: payload.title,
        description: payload.description || null,
        priority: payload.priority || 'medium',
        due_date: payload.due_date || null,
        due_time: payload.due_date ? payload.due_time || null : null,
        items: localItems,
        is_pending_sync: true,
      })

      await localDb.putCachedTodo(updatedLocal)
      await localDb.enqueueSyncAction({
        userId,
        type: 'update_todo',
        habitId: Number(id),
        payload,
      })
      await networkStore.refreshPendingCount()
      await refreshFromLocalCache()
      saving.value = false
      await new Promise((r) => setTimeout(r, 100))
      closeSheet()
      return { success: true, data: updatedLocal, offline: true }
    } finally {
      saving.value = false
    }
  }

  async function toggleTodo(id) {
    const userId = getCurrentUserId()
    const allCached = await localDb.getCachedTodos(userId)
    const existing = allCached.find((t) => Number(t.id) === Number(id))
    if (!existing) return { success: false }

    // Optimistic Local Update
    const nextCompleted = !existing.is_completed
    const optimisticTodo = {
      ...existing,
      is_completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
      is_overdue: computeIsOverdue({ ...existing, is_completed: nextCompleted }),
      is_pending_sync: !networkStore.isOnline || Number(id) < 0,
    }
    await localDb.putCachedTodo(optimisticTodo)
    await refreshFromLocalCache()

    if (networkStore.isOnline && Number(id) > 0) {
      try {
        const res = await todoService.toggleTodo(id)
        if (res.data) {
          await localDb.putCachedTodo({
            ...res.data,
            user_id: userId,
            is_pending_sync: false,
          })
          await refreshFromLocalCache()
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

    // Queue for offline sync
    await localDb.putCachedTodo({ ...optimisticTodo, is_pending_sync: true })
    await localDb.enqueueSyncAction({
      userId,
      type: 'toggle_todo',
      todoId: Number(id),
    })
    await networkStore.refreshPendingCount()
    await refreshFromLocalCache()
    return { success: true, offline: true }
  }

  async function deleteTodo(id) {
    const userId = getCurrentUserId()
    await localDb.deleteCachedTodo(id)
    await refreshFromLocalCache()

    if (networkStore.isOnline && Number(id) > 0) {
      try {
        await todoService.deleteTodo(id)
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
        type: 'delete_todo',
        todoId: Number(id),
      })
      await networkStore.refreshPendingCount()
    }
    return { success: true, offline: true }
  }

  async function addSubtask(todoId, title) {
    const userId = getCurrentUserId()
    const allCached = await localDb.getCachedTodos(userId)
    const existing = allCached.find((t) => Number(t.id) === Number(todoId))
    if (!existing) return { success: false }

    if (networkStore.isOnline && Number(todoId) > 0) {
      try {
        const res = await todoService.addSubtask(todoId, title)
        if (res.data) {
          await localDb.putCachedTodo({
            ...res.data,
            user_id: userId,
            is_pending_sync: false,
          })
          await refreshFromLocalCache()
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

    // Offline Subtask Creation
    const tempItemId = -Date.now()
    const currentItems = Array.isArray(existing.items) ? [...existing.items] : []
    currentItems.push({
      id: tempItemId,
      todo_id: Number(todoId),
      title: title.trim(),
      is_completed: false,
      sort_order: currentItems.length,
    })

    const updatedLocal = normalizeTodoWithSubtasks({
      ...existing,
      items: currentItems,
      is_pending_sync: true,
    })

    await localDb.putCachedTodo(updatedLocal)
    await localDb.enqueueSyncAction({
      userId,
      type: 'add_subtask',
      todoId: Number(todoId),
      itemId: tempItemId,
      payload: { title: title.trim() },
    })
    await networkStore.refreshPendingCount()
    await refreshFromLocalCache()
    return { success: true, data: updatedLocal, offline: true }
  }

  async function toggleSubtask(todoId, itemId) {
    const userId = getCurrentUserId()
    const allCached = await localDb.getCachedTodos(userId)
    const existing = allCached.find((t) => Number(t.id) === Number(todoId))
    if (!existing) return { success: false }

    // Optimistic local update (auto-completes parent if all subtasks are checked)
    const updatedItems = (existing.items || []).map((item) =>
      Number(item.id) === Number(itemId)
        ? { ...item, is_completed: !item.is_completed }
        : item
    )
    const optimisticTodo = normalizeTodoWithSubtasks({
      ...existing,
      items: updatedItems,
      is_pending_sync: !networkStore.isOnline || Number(todoId) < 0 || Number(itemId) < 0,
    })

    await localDb.putCachedTodo(optimisticTodo)
    await refreshFromLocalCache()

    if (networkStore.isOnline && Number(todoId) > 0 && Number(itemId) > 0) {
      try {
        const res = await todoService.toggleSubtask(todoId, itemId)
        if (res.data) {
          await localDb.putCachedTodo({
            ...res.data,
            user_id: userId,
            is_pending_sync: false,
          })
          await refreshFromLocalCache()
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

    await localDb.putCachedTodo({ ...optimisticTodo, is_pending_sync: true })
    await localDb.enqueueSyncAction({
      userId,
      type: 'toggle_subtask',
      todoId: Number(todoId),
      itemId: Number(itemId),
    })
    await networkStore.refreshPendingCount()
    await refreshFromLocalCache()
    return { success: true, data: optimisticTodo, offline: true }
  }

  async function deleteSubtask(todoId, itemId) {
    const userId = getCurrentUserId()
    const allCached = await localDb.getCachedTodos(userId)
    const existing = allCached.find((t) => Number(t.id) === Number(todoId))
    if (!existing) return { success: false }

    const remainingItems = (existing.items || []).filter(
      (i) => Number(i.id) !== Number(itemId)
    )
    const optimisticTodo = normalizeTodoWithSubtasks({
      ...existing,
      items: remainingItems,
      is_pending_sync: !networkStore.isOnline || Number(todoId) < 0 || Number(itemId) < 0,
    })

    await localDb.putCachedTodo(optimisticTodo)
    await refreshFromLocalCache()

    if (networkStore.isOnline && Number(todoId) > 0 && Number(itemId) > 0) {
      try {
        const res = await todoService.deleteSubtask(todoId, itemId)
        if (res.data) {
          await localDb.putCachedTodo({
            ...res.data,
            user_id: userId,
            is_pending_sync: false,
          })
          await refreshFromLocalCache()
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

    await localDb.putCachedTodo({ ...optimisticTodo, is_pending_sync: true })
    await localDb.enqueueSyncAction({
      userId,
      type: 'delete_subtask',
      todoId: Number(todoId),
      itemId: Number(itemId),
    })
    await networkStore.refreshPendingCount()
    await refreshFromLocalCache()
    return { success: true, data: optimisticTodo, offline: true }
  }

  return {
    todos,
    counts,
    activeFilter,
    activePriority,
    searchQuery,
    loading,
    saving,
    errorMessage,
    validationErrors,
    isSheetOpen,
    editingTodo,
    clearErrors,
    openCreateSheet,
    openEditSheet,
    closeSheet,
    refreshFromLocalCache,
    fetchTodos,
    setFilter,
    setPriorityFilter,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  }
})
