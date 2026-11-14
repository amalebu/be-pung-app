<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle, WarningTriangle, Spark, FireFlame, Wallet, Lock } from '@iconoir/vue'
import DashboardHero from '@/components/modules/dashboard/DashboardHero.vue'
import DashboardStatTile from '@/components/modules/dashboard/DashboardStatTile.vue'
import DashboardWeeklyChart from '@/components/modules/dashboard/DashboardWeeklyChart.vue'
import DashboardFocusList from '@/components/modules/dashboard/DashboardFocusList.vue'
import DashboardHabitList from '@/components/modules/dashboard/DashboardHabitList.vue'
import DashboardInvestmentHero from '@/components/modules/dashboard/DashboardInvestmentHero.vue'
import { useAuthStore } from '@/stores/authStore'
import { useTodoStore } from '@/stores/todoStore'
import { useHabitStore, getTodayDateStr } from '@/stores/habitStore'
import { useInvestmentStore } from '@/stores/investmentStore'

const authStore = useAuthStore()
const todoStore = useTodoStore()
const habitStore = useHabitStore()
const investmentStore = useInvestmentStore()

// ---- Ringkasan tugas hari ini ----
const todayTasks = computed(() => {
  const today = getTodayDateStr(0)
  return todoStore.allTodos.filter((t) => t.due_date === today)
})
const overdueActive = computed(() =>
  todoStore.allTodos.filter((t) => !t.is_completed && t.is_overdue && t.due_date !== getTodayDateStr(0))
)
const tasksTotal = computed(() => todayTasks.value.length + overdueActive.value.length)
const tasksDone = computed(() => todayTasks.value.filter((t) => t.is_completed).length)

// ---- Ringkasan habit hari ini ----
const habitsTotal = computed(() => habitStore.allHabits.length)
const habitsDone = computed(() => habitStore.allHabits.filter((h) => h.is_today_goal_met).length)

const overallPercent = computed(() => {
  const total = tasksTotal.value + habitsTotal.value
  if (total === 0) return 0
  return ((tasksDone.value + habitsDone.value) / total) * 100
})

const bestStreak = computed(() => Number(habitStore.summary?.best_streak || 0))

// ---- Aksi ----
function handleToggleTodo(id) {
  todoStore.toggleTodo(id)
}

async function handleIncrementHabit(habit) {
  const step = Math.max(0.01, Number(habit.step_value || 1))
  await habitStore.logProgress(habit.id, {
    logged_date: getTodayDateStr(0),
    mode: 'increment',
    value: step,
  })
}

const router = useRouter()

function goToInvestmentsWithTicker(ticker) {
  if (ticker && ticker !== 'Lainnya') {
    investmentStore.searchQuery = ticker
  }
  router.push('/investments')
}

onMounted(() => {
  authStore.fetchMe()
  todoStore.fetchTodos()
  habitStore.fetchHabits()
  investmentStore.fetchPortfolio(false)
})
</script>

<template>
  <div class="space-y-3.5 sm:space-y-5">
      <!-- Baris 1: Hero progres + Grafik mingguan -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <DashboardHero
          class="lg:col-span-2"
          :percent="overallPercent"
          :tasks-done="tasksDone"
          :tasks-total="tasksTotal"
          :habits-done="habitsDone"
          :habits-total="habitsTotal"
        />
        <DashboardWeeklyChart :habits="habitStore.allHabits" />
      </div>

      <!-- Baris 2: Statistik ringkas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardStatTile
          label="Tugas hari ini"
          :value="todoStore.counts.today || 0"
          :hint="`${todoStore.counts.upcoming || 0} akan datang`"
          :icon="CheckCircle"
          tone="forest"
          to="/todos"
        />
        <DashboardStatTile
          label="Terlambat"
          :value="todoStore.counts.overdue || 0"
          :hint="todoStore.counts.overdue ? 'Perlu segera ditangani' : 'Semua tepat waktu'"
          :icon="WarningTriangle"
          :tone="todoStore.counts.overdue ? 'rose' : 'slate'"
          to="/todos"
        />
        <DashboardStatTile
          label="Habit tercapai"
          :value="`${habitsDone}/${habitsTotal}`"
          :hint="`${habitStore.summary.good_count || 0} good · ${habitStore.summary.bad_count || 0} bad`"
          :icon="Spark"
          tone="forest"
          to="/habits"
        />
        <DashboardStatTile
          label="Streak terbaik"
          :value="bestStreak"
          :hint="bestStreak ? 'hari berturut-turut' : 'Mulai streak pertamamu'"
          :icon="FireFlame"
          tone="amber"
          to="/habits"
        />
      </div>

      <!-- Baris 3: Fokus tugas + Habit hari ini -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        <DashboardFocusList
          class="lg:col-span-3"
          :todos="todoStore.allTodos"
          :loading="todoStore.loading"
          @toggle="handleToggleTodo"
          @create="todoStore.openCreateSheet()"
        />
        <DashboardHabitList
          class="lg:col-span-2"
          :habits="habitStore.allHabits"
          :loading="habitStore.loading"
          @increment="handleIncrementHabit"
          @create="habitStore.openCreateSheet('good')"
        />
      </div>

      <!-- Baris 4: Hero Portofolio Investasi & Saham (Besar seperti Hero Progres) -->
      <DashboardInvestmentHero
        :summary="investmentStore.summary"
        :stocks="investmentStore.stocks"
        :is-masked="investmentStore.isBalanceMasked"
        @toggle-privacy="investmentStore.toggleBalanceMask()"
        @select-ticker="goToInvestmentsWithTicker"
        @buy="investmentStore.openBuySheet()"
      />

      <!-- Baris 5: Teaser modul Finance -->
      <section
        class="hidden md:flex relative overflow-hidden items-center gap-4 rounded-3xl p-5 bg-[#f3f3f6] dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800"
      >
        <span class="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center bg-white dark:bg-zinc-800 text-[#144229] dark:text-[#a1d2af] shadow-surface">
          <Wallet class="w-5 h-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold text-slate-900 dark:text-zinc-100">Finance Tracker</p>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Dompet, transaksi, dan anggaran bulanan sedang disiapkan.
          </p>
        </div>
        <span class="inline-flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-[#e2e2e5] dark:border-zinc-700">
          <Lock class="w-3 h-3" />
          Segera
        </span>
      </section>
    </div>
</template>
