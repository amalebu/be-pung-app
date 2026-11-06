<script setup>
import { computed, onMounted } from 'vue'
import { CheckCircle, WarningTriangle, Spark, FireFlame, Wallet, Lock, GraphUp, ArrowRight, Eye, EyeClosed } from '@iconoir/vue'
import AppShell from '@/components/layout/AppShell.vue'
import DashboardHero from '@/components/modules/dashboard/DashboardHero.vue'
import DashboardStatTile from '@/components/modules/dashboard/DashboardStatTile.vue'
import DashboardWeeklyChart from '@/components/modules/dashboard/DashboardWeeklyChart.vue'
import DashboardFocusList from '@/components/modules/dashboard/DashboardFocusList.vue'
import DashboardHabitList from '@/components/modules/dashboard/DashboardHabitList.vue'
import { useAuthStore } from '@/stores/authStore'
import { useTodoStore } from '@/stores/todoStore'
import { useHabitStore, getTodayDateStr } from '@/stores/habitStore'
import { useInvestmentStore } from '@/stores/investmentStore'
import { formatRupiah, formatPercent } from '@/utils/currencyUtils'

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

onMounted(() => {
  authStore.fetchMe()
  todoStore.fetchTodos()
  habitStore.fetchHabits()
  investmentStore.fetchPortfolio(false)
})
</script>

<template>
  <AppShell>
    <div class="space-y-4 sm:space-y-5">
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

      <!-- Baris 4: Ringkasan Investasi & Portofolio Saham -->
      <section
        class="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl p-5 bg-gradient-to-br from-[#d3e4d8]/40 via-white to-white dark:from-[#2d5a3f]/30 dark:via-zinc-900 dark:to-zinc-900 border border-[#144229]/20 dark:border-[#a1d2af]/25 shadow-surface"
      >
        <div class="flex items-start gap-4">
          <span class="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-surface">
            <GraphUp class="w-6 h-6 stroke-[2]" />
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-bold text-slate-900 dark:text-zinc-100">Portofolio Investasi & Saham</p>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#144229]/10 text-[#144229] dark:bg-[#a1d2af]/20 dark:text-[#a1d2af]">
                BEI / IDX
              </span>
              <button
                type="button"
                @click="investmentStore.toggleBalanceMask()"
                class="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                :title="investmentStore.isBalanceMasked ? 'Tampilkan Nominal Saldo' : 'Sembunyikan Nominal Saldo'"
              >
                <component :is="investmentStore.isBalanceMasked ? EyeClosed : Eye" class="w-3.5 h-3.5 stroke-[2]" />
              </button>
            </div>
            <div class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span class="text-lg font-extrabold tabular-nums text-slate-900 dark:text-zinc-100">
                {{ investmentStore.isBalanceMasked ? 'Rp ****' : formatRupiah(investmentStore.summary.total_portfolio_value) }}
              </span>
              <span
                class="text-xs font-bold tabular-nums"
                :class="
                  investmentStore.isBalanceMasked
                    ? 'text-slate-500'
                    : investmentStore.summary.unrealized_pl > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : investmentStore.summary.unrealized_pl < 0
                        ? 'text-[#ba1a1a] dark:text-rose-400'
                        : 'text-slate-500'
                "
              >
                P/L: {{ investmentStore.isBalanceMasked ? '****' : `${formatRupiah(investmentStore.summary.unrealized_pl, { withSign: true })} (${formatPercent(investmentStore.summary.unrealized_pl_percent)})` }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 tabular-nums">
              Cash RDN:
              <span :class="!investmentStore.isBalanceMasked && Number(investmentStore.summary.cash_balance) < 0 ? 'text-[#ba1a1a] dark:text-rose-400 font-bold' : ''">
                {{ investmentStore.isBalanceMasked ? 'Rp ****' : formatRupiah(investmentStore.summary.cash_balance) }}
              </span>
              · {{ investmentStore.summary.active_tickers_count }} emiten aktif
            </p>
          </div>
        </div>

        <RouterLink
          to="/investments"
          class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] hover:bg-[#2d5a3f] transition-all cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
        >
          <span>Kelola Portofolio</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </RouterLink>
      </section>

      <!-- Baris 5: Teaser modul Finance -->
      <section
        class="relative overflow-hidden flex items-center gap-4 rounded-3xl p-5 bg-[#f3f3f6] dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-800"
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
  </AppShell>
</template>
