<script setup>
import { ref } from 'vue'
import { Check, Plus, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  todoId: {
    type: Number,
    required: true,
  },
  items: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['toggle-item', 'add-item', 'delete-item'])

const newSubtaskTitle = ref('')
const submitting = ref(false)

async function handleAddSubtask() {
  const title = newSubtaskTitle.value.trim()
  if (!title || submitting.value) return

  submitting.value = true
  emit('add-item', { todoId: props.todoId, title })
  newSubtaskTitle.value = ''
  submitting.value = false
}
</script>

<template>
  <div class="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
    <!-- Existing Sub-Checklist Items -->
    <div v-if="items.length > 0" class="space-y-1.5">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center justify-between gap-2.5 py-1.5 px-2.5 rounded-lg bg-slate-50/80 dark:bg-zinc-800/40 hover:bg-slate-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
      >
        <button
          type="button"
          @click="emit('toggle-item', { todoId, itemId: item.id })"
          class="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
        >
          <span
            class="w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0"
            :class="
              item.is_completed
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 group-hover:border-indigo-400'
            "
          >
            <Check v-if="item.is_completed" class="w-3 h-3 stroke-[3]" />
          </span>

          <span
            class="text-xs sm:text-sm truncate transition-all"
            :class="
              item.is_completed
                ? 'line-through text-slate-400 dark:text-zinc-500'
                : 'text-slate-700 dark:text-zinc-200'
            "
          >
            {{ item.title }}
          </span>
        </button>

        <button
          type="button"
          @click="emit('delete-item', { todoId, itemId: item.id })"
          class="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
          title="Hapus sub-checklist"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Quick Inline Add Sub-Checklist -->
    <form @submit.prevent="handleAddSubtask" class="flex items-center gap-2 pt-0.5">
      <div class="relative flex-1">
        <input
          v-model="newSubtaskTitle"
          type="text"
          placeholder="Tambah item sub-checklist..."
          class="w-full pl-3 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
        />
      </div>
      <button
        type="submit"
        :disabled="!newSubtaskTitle.trim()"
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Tambah</span>
      </button>
    </form>
  </div>
</template>
