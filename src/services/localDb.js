const DB_NAME = 'personal_app_offline_db'
const DB_VERSION = 2
const STORE_TODOS = 'todos'
const STORE_HABITS = 'habits'
const STORE_SYNC_QUEUE = 'sync_queue'

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak didukung di browser ini.'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains(STORE_TODOS)) {
        const todoStore = db.createObjectStore(STORE_TODOS, { keyPath: 'id' })
        todoStore.createIndex('user_id', 'user_id', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORE_HABITS)) {
        const habitStore = db.createObjectStore(STORE_HABITS, { keyPath: 'id' })
        habitStore.createIndex('user_id', 'user_id', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_SYNC_QUEUE, {
          keyPath: 'queueId',
          autoIncrement: true,
        })
        queueStore.createIndex('user_id', 'user_id', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      dbPromise = null
      reject(event.target.error)
    }
  })

  return dbPromise
}

function clonePlain(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export const localDb = {
  // ================= TODOS =================
  async getCachedTodos(userId) {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TODOS, 'readonly')
        const store = tx.objectStore(STORE_TODOS)
        const req = store.getAll()

        req.onsuccess = () => {
          const all = req.result || []
          const filtered = userId
            ? all.filter((item) => Number(item.user_id) === Number(userId))
            : all
          resolve(filtered)
        }
        req.onerror = () => reject(req.error)
      })
    } catch {
      return []
    }
  },

  async saveCachedTodos(userId, serverTodos) {
    try {
      const db = await openDb()
      const existing = await this.getCachedTodos(userId)
      const pendingLocalOnly = existing.filter(
        (t) => Number(t.id) < 0 || t.is_pending_sync === true
      )

      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TODOS, 'readwrite')
        const store = tx.objectStore(STORE_TODOS)

        for (const oldItem of existing) {
          if (Number(oldItem.id) > 0 && !oldItem.is_pending_sync) {
            store.delete(oldItem.id)
          }
        }

        const pendingIds = new Set(pendingLocalOnly.map((p) => Number(p.id)))
        for (const todo of serverTodos) {
          if (!pendingIds.has(Number(todo.id))) {
            store.put(
              clonePlain({
                ...todo,
                user_id: todo.user_id ?? userId,
                is_pending_sync: false,
              })
            )
          }
        }

        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // Ignore IndexedDB errors
    }
  },

  async putCachedTodo(todo) {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TODOS, 'readwrite')
        const store = tx.objectStore(STORE_TODOS)
        store.put(clonePlain(todo))
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      return false
    }
  },

  async deleteCachedTodo(id) {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TODOS, 'readwrite')
        const store = tx.objectStore(STORE_TODOS)
        store.delete(Number(id))
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      return false
    }
  },

  // ================= HABITS =================
  async getCachedHabits(userId) {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_HABITS, 'readonly')
        const store = tx.objectStore(STORE_HABITS)
        const req = store.getAll()

        req.onsuccess = () => {
          const all = req.result || []
          const filtered = userId
            ? all.filter((item) => Number(item.user_id) === Number(userId))
            : all
          resolve(filtered)
        }
        req.onerror = () => reject(req.error)
      })
    } catch {
      return []
    }
  },

  async saveCachedHabits(userId, serverHabits) {
    try {
      const db = await openDb()
      const existing = await this.getCachedHabits(userId)
      const pendingLocalOnly = existing.filter(
        (h) => Number(h.id) < 0 || h.is_pending_sync === true
      )

      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_HABITS, 'readwrite')
        const store = tx.objectStore(STORE_HABITS)

        for (const oldItem of existing) {
          if (Number(oldItem.id) > 0 && !oldItem.is_pending_sync) {
            store.delete(oldItem.id)
          }
        }

        const pendingIds = new Set(pendingLocalOnly.map((p) => Number(p.id)))
        for (const habit of serverHabits) {
          if (!pendingIds.has(Number(habit.id))) {
            store.put(
              clonePlain({
                ...habit,
                user_id: habit.user_id ?? userId,
                is_pending_sync: false,
              })
            )
          }
        }

        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // Ignore
    }
  },

  async putCachedHabit(habit) {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_HABITS, 'readwrite')
        const store = tx.objectStore(STORE_HABITS)
        store.put(clonePlain(habit))
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      return false
    }
  },

  async deleteCachedHabit(id) {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_HABITS, 'readwrite')
        const store = tx.objectStore(STORE_HABITS)
        store.delete(Number(id))
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      return false
    }
  },

  // ================= SYNC QUEUE =================
  async enqueueSyncAction(action) {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite')
        const store = tx.objectStore(STORE_SYNC_QUEUE)
        const record = clonePlain({
          ...action,
          createdAt: Date.now(),
        })
        const req = store.add(record)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
    } catch {
      return null
    }
  },

  async getSyncQueue(userId = null) {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly')
        const store = tx.objectStore(STORE_SYNC_QUEUE)
        const req = store.getAll()
        req.onsuccess = () => {
          const items = (req.result || []).sort((a, b) => a.queueId - b.queueId)
          if (!userId) {
            resolve(items)
            return
          }
          resolve(
            items.filter(
              (item) => !item.userId || Number(item.userId) === Number(userId)
            )
          )
        }
        req.onerror = () => reject(req.error)
      })
    } catch {
      return []
    }
  },

  async removeSyncQueueItem(queueId) {
    try {
      const db = await openDb()
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite')
        const store = tx.objectStore(STORE_SYNC_QUEUE)
        store.delete(queueId)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      return false
    }
  },

  async remapSyncQueueIds({
    oldTodoId,
    newTodoId,
    oldItemId,
    newItemId,
    oldHabitId,
    newHabitId,
  }) {
    try {
      const db = await openDb()
      const all = await this.getSyncQueue()
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite')
        const store = tx.objectStore(STORE_SYNC_QUEUE)

        for (const entry of all) {
          let changed = false
          if (oldTodoId !== undefined && Number(entry.todoId) === Number(oldTodoId)) {
            entry.todoId = newTodoId
            changed = true
          }
          if (oldItemId !== undefined && Number(entry.itemId) === Number(oldItemId)) {
            entry.itemId = newItemId
            changed = true
          }
          if (oldHabitId !== undefined && Number(entry.habitId) === Number(oldHabitId)) {
            entry.habitId = newHabitId
            changed = true
          }
          if (changed) {
            store.put(clonePlain(entry))
          }
        }

        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // Ignore
    }
  },

  async clearAll() {
    try {
      const db = await openDb()
      await new Promise((resolve, reject) => {
        const tx = db.transaction(
          [STORE_TODOS, STORE_HABITS, STORE_SYNC_QUEUE],
          'readwrite'
        )
        tx.objectStore(STORE_TODOS).clear()
        tx.objectStore(STORE_HABITS).clear()
        tx.objectStore(STORE_SYNC_QUEUE).clear()
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // Ignore
    }
  },
}
