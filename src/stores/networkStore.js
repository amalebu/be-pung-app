import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { localDb } from '@/services/localDb'
import { todoService } from '@/services/todoService'
import { habitService } from '@/services/habitService'

export const useNetworkStore = defineStore('network', () => {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const wasOffline = ref(!isOnline.value)
  const showBackOnlineToast = ref(false)
  const isSyncing = ref(false)
  const pendingCount = ref(0)
  const backOnlineSubtext = ref('Semua data telah disinkronkan')

  // Top Toast Banner state (muncul di atas header & hilang dalam 1 detik)
  const topToast = ref({
    show: false,
    type: null, // 'offline' | 'online'
    message: '',
  })

  // Status koneksi terpadu untuk dot foto profil: 'offline' (merah), 'pending' (kuning/orange), 'online' (hijau)
  const connectionStatus = computed(() => {
    if (!isOnline.value) return 'offline'
    if (isSyncing.value || pendingCount.value > 0) return 'pending'
    return 'online'
  })

  let toastTimer = null
  let heartbeatTimer = null
  const syncCompleteHandlers = new Set()

  function showBanner(type, message) {
    if (toastTimer) clearTimeout(toastTimer)
    topToast.value = {
      show: true,
      type,
      message,
    }
    toastTimer = setTimeout(() => {
      topToast.value.show = false
    }, 1000) // Otomatis hilang dalam 1 detik
  }

  function onSyncCompleted(callback) {
    syncCompleteHandlers.add(callback)
  }

  async function notifySyncCompleted() {
    for (const cb of syncCompleteHandlers) {
      await cb()
    }
  }

  async function refreshPendingCount() {
    const userRaw = localStorage.getItem('personal_app_user')
    const userId = userRaw ? JSON.parse(userRaw)?.id : null
    const queue = await localDb.getSyncQueue(userId)
    pendingCount.value = queue.length
    return queue.length
  }

  function markOffline() {
    const wasOnline = isOnline.value
    isOnline.value = false
    wasOffline.value = true
    showBackOnlineToast.value = false

    // Tampilkan banner offline 1 detik saat koneksi terputus
    if (wasOnline) {
      showBanner('offline', 'Anda sedang Offline')
    }
  }

  async function markOnline({ forceToast = false } = {}) {
    const previouslyOffline = !isOnline.value || wasOffline.value
    isOnline.value = true

    await refreshPendingCount()

    if (previouslyOffline || forceToast) {
      wasOffline.value = false
      showBanner('online', 'Anda kembali Online')

      if (pendingCount.value > 0) {
        backOnlineSubtext.value = `Menyinkronkan ${pendingCount.value} perubahan lokal...`
        await syncPendingQueue()
      } else {
        backOnlineSubtext.value = 'Koneksi pulih • Data telah mutakhir'
        await notifySyncCompleted()
      }
    } else if (pendingCount.value > 0 && !isSyncing.value) {
      await syncPendingQueue()
    }
  }

  async function syncPendingQueue() {
    if (isSyncing.value || !isOnline.value) return

    const token = localStorage.getItem('personal_app_token')
    if (!token) return

    const userRaw = localStorage.getItem('personal_app_user')
    const userId = userRaw ? JSON.parse(userRaw)?.id : null
    const queue = await localDb.getSyncQueue(userId)

    if (queue.length === 0) {
      pendingCount.value = 0
      await notifySyncCompleted()
      return
    }

    isSyncing.value = true
    showBackOnlineToast.value = true
    backOnlineSubtext.value = `Menyinkronkan ${queue.length} perubahan ke server...`

    try {
      for (let i = 0; i < queue.length; i++) {
        // Re-fetch current item from queue in case previous iteration remapped its IDs
        const currentQueue = await localDb.getSyncQueue(userId)
        const entry = currentQueue.find((q) => q.queueId === queue[i].queueId)
        if (!entry) continue

        try {
          if (entry.type === 'create_todo') {
            const res = await todoService.createTodo(entry.payload)
            const createdTodo = res.data
            const oldTempId = entry.todoId

            if (oldTempId && createdTodo?.id) {
              await localDb.deleteCachedTodo(oldTempId)
              await localDb.putCachedTodo({
                ...createdTodo,
                is_pending_sync: false,
              })
              await localDb.remapSyncQueueIds({
                oldTodoId: oldTempId,
                newTodoId: createdTodo.id,
              })

              // Map initial subtask temp IDs if any
              if (
                Array.isArray(entry.tempItemIds) &&
                Array.isArray(createdTodo.items)
              ) {
                for (let idx = 0; idx < entry.tempItemIds.length; idx++) {
                  const tempItemId = entry.tempItemIds[idx]
                  const serverItem = createdTodo.items[idx]
                  if (tempItemId && serverItem?.id) {
                    await localDb.remapSyncQueueIds({
                      oldItemId: tempItemId,
                      newItemId: serverItem.id,
                    })
                  }
                }
              }
            }
          } else if (entry.type === 'update_todo') {
            if (Number(entry.todoId) > 0) {
              const res = await todoService.updateTodo(entry.todoId, entry.payload)
              if (res.data) {
                await localDb.putCachedTodo({
                  ...res.data,
                  is_pending_sync: false,
                })
              }
            }
          } else if (entry.type === 'toggle_todo') {
            if (Number(entry.todoId) > 0) {
              const res = await todoService.toggleTodo(entry.todoId)
              if (res.data) {
                await localDb.putCachedTodo({
                  ...res.data,
                  is_pending_sync: false,
                })
              }
            }
          } else if (entry.type === 'delete_todo') {
            if (Number(entry.todoId) > 0) {
              await todoService.deleteTodo(entry.todoId)
            }
            await localDb.deleteCachedTodo(entry.todoId)
          } else if (entry.type === 'add_subtask') {
            if (Number(entry.todoId) > 0) {
              const res = await todoService.addSubtask(
                entry.todoId,
                entry.payload.title
              )
              const updatedTodo = res.data
              if (updatedTodo?.items?.length && entry.itemId) {
                const newestItem =
                  updatedTodo.items[updatedTodo.items.length - 1]
                if (newestItem?.id) {
                  await localDb.remapSyncQueueIds({
                    oldItemId: entry.itemId,
                    newItemId: newestItem.id,
                  })
                }
              }
              if (updatedTodo) {
                await localDb.putCachedTodo({
                  ...updatedTodo,
                  is_pending_sync: false,
                })
              }
            }
          } else if (entry.type === 'toggle_subtask') {
            if (Number(entry.todoId) > 0 && Number(entry.itemId) > 0) {
              const res = await todoService.toggleSubtask(
                entry.todoId,
                entry.itemId
              )
              if (res.data) {
                await localDb.putCachedTodo({
                  ...res.data,
                  is_pending_sync: false,
                })
              }
            }
          } else if (entry.type === 'delete_subtask') {
            if (Number(entry.todoId) > 0 && Number(entry.itemId) > 0) {
              const res = await todoService.deleteSubtask(
                entry.todoId,
                entry.itemId
              )
              if (res.data) {
                await localDb.putCachedTodo({
                  ...res.data,
                  is_pending_sync: false,
                })
              }
            }
          } else if (entry.type === 'create_habit') {
            const res = await habitService.createHabit(entry.payload)
            const createdHabit = res.data
            const oldTempId = entry.habitId
            if (oldTempId && createdHabit?.id) {
              await localDb.deleteCachedHabit(oldTempId)
              await localDb.putCachedHabit({
                ...createdHabit,
                is_pending_sync: false,
              })
              await localDb.remapSyncQueueIds({
                oldHabitId: oldTempId,
                newHabitId: createdHabit.id,
              })
            }
          } else if (entry.type === 'update_habit') {
            if (Number(entry.habitId) > 0) {
              const res = await habitService.updateHabit(
                entry.habitId,
                entry.payload
              )
              if (res.data) {
                await localDb.putCachedHabit({
                  ...res.data,
                  is_pending_sync: false,
                })
              }
            }
          } else if (entry.type === 'delete_habit') {
            if (Number(entry.habitId) > 0) {
              await habitService.deleteHabit(entry.habitId)
            }
            await localDb.deleteCachedHabit(entry.habitId)
          } else if (entry.type === 'log_habit') {
            if (Number(entry.habitId) > 0) {
              const res = await habitService.logProgress(
                entry.habitId,
                entry.payload
              )
              if (res.data) {
                await localDb.putCachedHabit({
                  ...res.data,
                  is_pending_sync: false,
                })
              }
            }
          }

          await localDb.removeSyncQueueItem(entry.queueId)
          await refreshPendingCount()
        } catch (err) {
          // If network dropped again during replay, stop and wait for next reconnect
          if (!err.response) {
            markOffline()
            return
          }
          // If 404 or 422 validation error, discard stale item so queue never blocks forever
          await localDb.removeSyncQueueItem(entry.queueId)
          await refreshPendingCount()
        }
      }

      backOnlineSubtext.value = 'Semua perubahan offline berhasil disinkronkan'
      await notifySyncCompleted()
    } finally {
      isSyncing.value = false
      await refreshPendingCount()
    }
  }

  function initNetworkWatcher() {
    refreshPendingCount()

    window.addEventListener('online', () => {
      markOnline({ forceToast: true })
    })

    window.addEventListener('offline', () => {
      markOffline()
    })

    // Periodic check when browser is online and there are pending items or recovering from server outage
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = setInterval(async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (isOnline.value) markOffline()
        return
      }

      if (!isOnline.value || pendingCount.value > 0) {
        const token = localStorage.getItem('personal_app_token')
        if (!token) return
        try {
          await todoService.getTodos({ filter: 'all' })
          await markOnline()
        } catch (err) {
          if (!err.response) {
            markOffline()
          }
        }
      }
    }, 10000)
  }

  return {
    isOnline,
    wasOffline,
    showBackOnlineToast,
    topToast,
    connectionStatus,
    isSyncing,
    pendingCount,
    backOnlineSubtext,
    onSyncCompleted,
    refreshPendingCount,
    markOffline,
    markOnline,
    syncPendingQueue,
    initNetworkWatcher,
  }
})
