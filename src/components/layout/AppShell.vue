<script setup>
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import BottomNav from './BottomNav.vue'
import FloatingActionButton from './FloatingActionButton.vue'
import QuickActionSheet from './QuickActionSheet.vue'
import TodoFormSheet from '@/components/modules/todos/TodoFormSheet.vue'
import HabitFormSheet from '@/components/modules/habits/HabitFormSheet.vue'
import { useTodoStore } from '@/stores/todoStore'
import { useHabitStore } from '@/stores/habitStore'

const showQuickActions = ref(false)
const todoStore = useTodoStore()
const habitStore = useHabitStore()

function onQuickActionSelect(action) {
  if (action.id === 'todo') {
    todoStore.openCreateSheet()
  } else if (action.id === 'habit') {
    habitStore.openCreateSheet('good')
  }
}

async function handleTodoFormSubmit(payload) {
  if (todoStore.editingTodo?.id) {
    await todoStore.updateTodo(todoStore.editingTodo.id, payload)
  } else {
    await todoStore.createTodo(payload)
  }
}

async function handleHabitFormSubmit(payload) {
  if (habitStore.editingHabit?.id) {
    await habitStore.updateHabit(habitStore.editingHabit.id, payload)
  } else {
    await habitStore.createHabit(payload)
  }
}
</script>

<template>
  <div class="min-h-screen flex bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased">
    <!-- Desktop Sidebar -->
    <AppSidebar />

    <!-- Main Content Stream -->
    <div class="flex-1 flex flex-col min-w-0">
      <AppHeader />

      <!-- Main Body with Mobile-First Safe Bottom Padding -->
      <main class="flex-1 p-4 md:p-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
        <slot />
      </main>
    </div>

    <!-- Mobile-First Floating Action Button (Quick Add) -->
    <FloatingActionButton
      label="Aksi Cepat"
      @click="showQuickActions = true"
    />

    <!-- Quick Action Modal / Bottom Sheet -->
    <QuickActionSheet
      :show="showQuickActions"
      @close="showQuickActions = false"
      @select="onQuickActionSelect"
    />

    <!-- Global To-Do Form Bottom Sheet (Add / Edit) -->
    <TodoFormSheet
      :show="todoStore.isSheetOpen"
      :editing-todo="todoStore.editingTodo"
      :saving="todoStore.saving"
      :error-message="todoStore.errorMessage"
      @close="todoStore.closeSheet()"
      @submit="handleTodoFormSubmit"
    />

    <!-- Global Habit Form Bottom Sheet (Add / Edit) -->
    <HabitFormSheet
      :show="habitStore.isFormSheetOpen"
      :editing-habit="habitStore.editingHabit"
      :saving="habitStore.saving"
      :error-message="habitStore.errorMessage"
      @close="habitStore.closeFormSheet()"
      @submit="handleHabitFormSubmit"
    />

    <!-- Mobile Bottom Navigation Bar -->
    <BottomNav />
  </div>
</template>
