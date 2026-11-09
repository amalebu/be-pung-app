<script setup>
import { ref, computed } from 'vue'
import { Check, CheckSquare, NavArrowDown, NavArrowUp, EditPencil, Trash, Plus, CloudUpload } from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import TodoPriorityBadge from './TodoPriorityBadge.vue'
import TodoDueBadge from './TodoDueBadge.vue'
import TodoSubtaskList from './TodoSubtaskList.vue'

const props = defineProps({
  todo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits([
  'toggle',
  'edit',
  'delete',
  'toggle-item',
  'add-item',
  'delete-item',
])

const expanded = ref(false)

const subtasksTotal = computed(() => props.todo.items?.length ?? props.todo.subtasks_total ?? 0)
const subtasksCompleted = computed(() => {
  if (Array.isArray(props.todo.items)) {
    return props.todo.items.filter((i) => i.is_completed).length
  }
  return props.todo.subtasks_completed ?? 0
})

const progressPercent = computed(() => {
  if (subtasksTotal.value === 0) return 0
  return Math.round((subtasksCompleted.value / subtasksTotal.value) * 100)
})
</script>

<template>
  <BaseCard
    padding="p-4"
    class="transition-all duration-200"
    :class="
      todo.is_completed
        ? 'opacity-75 bg-slate-50/70 dark:bg-zinc-900/50'
        : 'hover:border-slate-300 dark:hover:border-zinc-700'
    "
  >
    <div class="flex items-start gap-3">
      <!-- Main Task Checkbox (Manual Toggle Anytime) -->
      <button
        type="button"
        @click.stop="emit('toggle', todo.id)"
        class="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all cursor-pointer shrink-0 active:scale-85"
        :class="
          todo.is_completed
            ? 'bg-emerald-500 border-emerald-500 text-white animate-check-pop'
            : todo.priority === 'high'
              ? 'border-rose-400 dark:border-rose-500/80 hover:border-rose-500'
              : todo.priority === 'medium'
                ? 'border-amber-400 dark:border-amber-500/80 hover:border-amber-500'
                : 'border-slate-300 dark:border-zinc-600 hover:border-indigo-500'
        "
        :title="todo.is_completed ? 'Tandai belum selesai' : 'Tandai selesai'"
      >
        <Check v-if="todo.is_completed" class="w-3 h-3 stroke-[3]" />
      </button>

      <!-- Main Content (Tap to Expand Sub-Checklists) -->
      <div class="flex-1 min-w-0">
        <div
          class="cursor-pointer select-none"
          @click="expanded = !expanded"
        >
          <div class="flex items-start justify-between gap-2">
            <BaseHeading
              as="h4"
              size="sm"
              weight="medium"
              class="leading-snug transition-colors"
              :class="
                todo.is_completed
                  ? 'line-through text-slate-400 dark:text-zinc-500'
                  : 'text-slate-900 dark:text-zinc-100'
              "
            >
              {{ todo.title }}
            </BaseHeading>
          </div>

          <BaseText
            v-if="todo.description"
            size="xs"
            variant="muted"
            class="mt-1 line-clamp-2"
          >
            {{ todo.description }}
          </BaseText>

          <!-- Badges Row: Priority, Due Date/Time, Sub-Checklist Progress -->
          <div class="flex flex-wrap items-center gap-1.5 mt-2.5">
            <TodoPriorityBadge :priority="todo.priority" />

            <TodoDueBadge
              v-if="todo.due_date"
              :due-date="todo.due_date"
              :due-time="todo.due_time"
              :is-completed="todo.is_completed"
              :is-overdue="todo.is_overdue"
            />

            <!-- Sub-Checklist Counter Pill -->
            <button
              type="button"
              @click.stop="expanded = !expanded"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer tabular-nums"
              :class="
                subtasksTotal > 0 && subtasksCompleted === subtasksTotal
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200/60 dark:border-zinc-700/60 hover:border-indigo-300'
              "
            >
              <CheckSquare class="w-2.5 h-2.5" />
              <span v-if="subtasksTotal > 0">{{ subtasksCompleted }}/{{ subtasksTotal }}</span>
              <span v-else class="flex items-center gap-0.5">
                <Plus class="w-2.5 h-2.5" /> Sub-checklist
              </span>
              <NavArrowUp v-if="expanded" class="w-2.5 h-2.5" />
              <NavArrowDown v-else class="w-2.5 h-2.5" />
            </button>

            <!-- Offline Pending Sync Pill -->
            <span
              v-if="todo.is_pending_sync"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60"
              title="Perubahan tersimpan di perangkat, menunggu koneksi internet untuk disinkronkan"
            >
              <CloudUpload class="w-2.5 h-2.5" />
              <span>Menunggu sync</span>
            </span>
          </div>

          <!-- Subtle Progress Bar when Sub-Checklists exist -->
          <div
            v-if="subtasksTotal > 0"
            class="mt-2.5 w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-md overflow-hidden"
          >
            <div
              class="h-full rounded-md transition-all duration-300"
              :class="progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <!-- Expandable Sub-Checklist Section -->
        <Transition name="slide-fade">
          <TodoSubtaskList
            v-if="expanded"
            :todo-id="todo.id"
            :items="todo.items || []"
            @toggle-item="emit('toggle-item', $event)"
            @add-item="emit('add-item', $event)"
            @delete-item="emit('delete-item', $event)"
          />
        </Transition>
      </div>

      <!-- Action Buttons (Edit & Delete) -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          type="button"
          @click.stop="emit('edit', todo)"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
          title="Edit tugas"
        >
          <EditPencil class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          @click.stop="emit('delete', todo.id)"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 btn-press cursor-pointer"
          title="Hapus tugas"
        >
          <Trash class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </BaseCard>
</template>
