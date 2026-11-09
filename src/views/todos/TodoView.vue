<script setup>
import { onMounted, ref } from 'vue'
import { Plus, CheckSquare, Spark } from '@iconoir/vue'
import AppShell from '@/components/layout/AppShell.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import TodoSummaryBar from '@/components/modules/todos/TodoSummaryBar.vue'
import TodoFilterTabs from '@/components/modules/todos/TodoFilterTabs.vue'
import TodoCard from '@/components/modules/todos/TodoCard.vue'
import { useTodoStore } from '@/stores/todoStore'
import { getJakartaTodayStr } from '@/utils/dateUtils'

const todoStore = useTodoStore()
let searchDebounceTimer = null
const quickTitle = ref('')

function handleSearchUpdate(val) {
  todoStore.searchQuery = val
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    todoStore.fetchTodos()
  }, 250)
}

async function handleQuickAdd() {
  const title = quickTitle.value.trim()
  if (!title) return
  const dateStr = getJakartaTodayStr(0)
  quickTitle.value = ''
  await todoStore.createTodo({
    title,
    priority: 'medium',
    due_date: dateStr,
  })
}

async function handleAddSubtask({ todoId, title }) {
  await todoStore.addSubtask(todoId, title)
}

async function handleToggleSubtask({ todoId, itemId }) {
  await todoStore.toggleSubtask(todoId, itemId)
}

async function handleDeleteSubtask({ todoId, itemId }) {
  await todoStore.deleteSubtask(todoId, itemId)
}

onMounted(() => {
  todoStore.fetchTodos()
})
</script>

<template>
  <AppShell>
    <div class="space-y-3.5 md:space-y-5">
      <!-- Page Header: ringkas di mobile (tombol "+" bawah sudah menambah tugas) -->
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <BaseHeading as="h2" size="xl" weight="semibold">
            <span class="md:hidden">To-Do</span>
            <span class="hidden md:inline">To-Do List & Sub-Checklist</span>
          </BaseHeading>
          <BaseText size="sm" variant="muted" class="mt-0.5 hidden md:block">
            Kelola prioritas harian, tenggat waktu, dan rincian langkah kerja Anda.
          </BaseText>
        </div>

        <div class="hidden md:block shrink-0">
          <PrimaryButton
            size="md"
            @click="todoStore.openCreateSheet()"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Tugas</span>
          </PrimaryButton>
        </div>
      </div>

      <!-- Summary Metric Cards -->
      <TodoSummaryBar
        :counts="todoStore.counts"
        :active-filter="todoStore.activeFilter"
        @select-filter="todoStore.setFilter"
      />

      <!-- Quick Input Bar (Ketik judul tugas -> Enter) -->
      <form
        @submit.prevent="handleQuickAdd"
        class="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs"
      >
        <div class="pl-2.5 text-indigo-500">
          <Spark class="w-4 h-4" />
        </div>
        <input
          v-model="quickTitle"
          type="text"
          placeholder="Tambah tugas cepat..."
          class="flex-1 bg-transparent text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none py-1.5"
        />
        <button
          type="submit"
          :disabled="!quickTitle.trim() || todoStore.saving"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors cursor-pointer shrink-0"
        >
          <span class="sm:hidden">Tambah</span>
          <span class="hidden sm:inline">Tambah Cepat</span>
        </button>
      </form>

      <!-- Filter Tabs, Priority Pills, & Search -->
      <TodoFilterTabs
        :active-filter="todoStore.activeFilter"
        :active-priority="todoStore.activePriority"
        :search-query="todoStore.searchQuery"
        :counts="todoStore.counts"
        @update:filter="todoStore.setFilter"
        @update:priority="todoStore.setPriorityFilter"
        @update:search="handleSearchUpdate"
      />

      <!-- State 1: Loading Skeleton -->
      <div
        v-if="todoStore.loading && todoStore.todos.length === 0"
        class="space-y-3"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse space-y-2.5"
        >
          <div class="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
          <div class="h-3 bg-slate-100 dark:bg-zinc-800/70 rounded w-1/2" />
        </div>
      </div>

      <!-- State 2: Empty State -->
      <BaseCard
        v-else-if="todoStore.todos.length === 0"
        padding="p-8 sm:p-10"
        class="text-center"
      >
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <CheckSquare class="w-6 h-6" />
        </div>
        <BaseHeading as="h3" size="md" weight="semibold">
          Belum Ada Tugas pada Filter Ini
        </BaseHeading>
        <BaseText size="xs" variant="muted" class="mt-1 max-w-sm mx-auto">
          Buat tugas baru lengkap dengan sub-checklist, tenggat tanggal/jam, dan prioritas agar hari Anda lebih terarah.
        </BaseText>
        <div class="mt-4">
          <PrimaryButton size="md" @click="todoStore.openCreateSheet()">
            <Plus class="w-4 h-4" />
            <span>Buat Tugas Baru</span>
          </PrimaryButton>
        </div>
      </BaseCard>

      <!-- State 3: Data List -->
      <div v-else class="space-y-3">
        <TodoCard
          v-for="todo in todoStore.todos"
          :key="todo.id"
          :todo="todo"
          @toggle="todoStore.toggleTodo"
          @edit="todoStore.openEditSheet"
          @delete="todoStore.deleteTodo"
          @add-item="handleAddSubtask"
          @toggle-item="handleToggleSubtask"
          @delete-item="handleDeleteSubtask"
        />
      </div>
    </div>
  </AppShell>
</template>
