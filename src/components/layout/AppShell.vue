<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import AppMobileDrawer from './AppMobileDrawer.vue'
import BottomNav from './BottomNav.vue'
import FloatingActionButton from './FloatingActionButton.vue'
import QuickActionSheet from './QuickActionSheet.vue'
import TodoFormSheet from '@/components/modules/todos/TodoFormSheet.vue'
import HabitFormSheet from '@/components/modules/habits/HabitFormSheet.vue'
import InvestmentBuySheet from '@/components/modules/investments/InvestmentBuySheet.vue'
import { useTodoStore } from '@/stores/todoStore'
import { useHabitStore } from '@/stores/habitStore'
import { useInvestmentStore } from '@/stores/investmentStore'

const showQuickActions = ref(false)
const showMobileDrawer = ref(false)
const todoStore = useTodoStore()
const habitStore = useHabitStore()
const investmentStore = useInvestmentStore()
const route = useRoute()

// Edge-swipe dari 1/5 layar sebelah kiri untuk membuka drawer mobile
const touchStartX = ref(0)
const touchStartY = ref(0)
const isTrackingSwipe = ref(false)

function handleGlobalTouchStart(e) {
  if (showMobileDrawer.value) return
  const touch = e.touches[0]
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400
  const maxLeftZone = screenWidth / 5 // 1/5 lebar layar dari kiri

  if (touch.clientX <= maxLeftZone) {
    touchStartX.value = touch.clientX
    touchStartY.value = touch.clientY
    isTrackingSwipe.value = true
  } else {
    isTrackingSwipe.value = false
  }
}

function handleGlobalTouchMove(e) {
  if (!isTrackingSwipe.value || showMobileDrawer.value) return
  const touch = e.touches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = Math.abs(touch.clientY - touchStartY.value)

  // Buka drawer seketika jika usapan horizontal ke kanan sudah mencapai >= 60px
  if (deltaX >= 60 && deltaX > deltaY * 1.3) {
    showMobileDrawer.value = true
    isTrackingSwipe.value = false
  }
}

function handleGlobalTouchEnd(e) {
  if (!isTrackingSwipe.value || showMobileDrawer.value) return
  const touch = e.changedTouches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = Math.abs(touch.clientY - touchStartY.value)

  // Quick flick: jika geser >= 35px dan dominan horizontal
  if (deltaX >= 35 && deltaX > deltaY) {
    showMobileDrawer.value = true
  }
  isTrackingSwipe.value = false
}

function handlePlusAction() {
  const currentPath = route.path || ''
  const currentName = route.name || ''

  if (currentName === 'todos' || currentPath.startsWith('/todos')) {
    // Sedang berada di dalam menu To-Do List -> langsung buat tugas
    todoStore.openCreateSheet()
  } else if (currentName === 'habits' || currentPath.startsWith('/habits')) {
    // Sedang berada di dalam menu Habit Tracker -> langsung buat kebiasaan
    habitStore.openCreateSheet('good')
  } else if (currentName === 'investments' || currentPath.startsWith('/investments')) {
    // Sedang berada di dalam menu Investment -> langsung buka form Beli Saham
    investmentStore.openBuySheet()
  } else {
    // Sedang berada di Dashboard atau menu umum -> tampilkan opsi semua menu
    showQuickActions.value = true
  }
}

function onQuickActionSelect(action) {
  if (action.id === 'todo') {
    todoStore.openCreateSheet()
  } else if (action.id === 'habit') {
    habitStore.openCreateSheet('good')
  } else if (action.id === 'investment') {
    investmentStore.openBuySheet()
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
  <div
    class="min-h-screen flex bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased"
    @touchstart="handleGlobalTouchStart"
    @touchmove="handleGlobalTouchMove"
    @touchend="handleGlobalTouchEnd"
  >
    <!-- Desktop Sidebar -->
    <AppSidebar />

    <!-- Mobile Left-Sliding Sidenav Drawer -->
    <AppMobileDrawer
      :show="showMobileDrawer"
      @close="showMobileDrawer = false"
    />

    <!-- Main Content Stream -->
      <AppHeader @open-mobile-drawer="showMobileDrawer = true" />

      <!-- Main Body with Mobile-First Safe Bottom Padding -->
      <main class="flex-1 p-4 md:p-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto pt-[calc(env(safe-area-inset-top,0px)+5rem)] md:pt-[calc(env(safe-area-inset-top,0px)+5rem)]">
        <slot />
      </main>


    <!-- Mobile-First Floating Action Button (Quick Add) -->
    <FloatingActionButton
      label="Aksi Cepat"
      @click="handlePlusAction"
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

    <!-- Global Investment Buy Lot Bottom Sheet -->
    <InvestmentBuySheet
      :show="investmentStore.isBuySheetOpen"
      :prefilled-ticker="investmentStore.prefilledTicker"
      :cash-balance="investmentStore.summary.cash_balance"
      :saving="investmentStore.saving"
      :error-message="investmentStore.errorMessage"
      @close="investmentStore.closeBuySheet()"
      @submit="investmentStore.submitBuyLot"
    />

    <!-- Mobile Bottom Navigation Bar (Floating Submenu) -->
    <BottomNav @quick-action="handlePlusAction" />
  </div>
</template>
