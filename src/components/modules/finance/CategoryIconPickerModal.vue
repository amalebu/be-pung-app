<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Xmark } from '@iconoir/vue'
import { CATEGORY_ICONS, CATEGORY_ICON_GROUPS } from '@/utils/categoryIcons'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'cutlery',
  },
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'select', 'close'])

const searchQuery = ref('')
const selectedGroup = ref('Semua')

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      searchQuery.value = ''
      selectedGroup.value = 'Semua'
    }
  }
)

const filteredIcons = computed(() => {
  return CATEGORY_ICONS.filter((item) => {
    const matchesGroup = selectedGroup.value === 'Semua' || item.group === selectedGroup.value
    const matchesSearch =
      !searchQuery.value.trim() ||
      item.label.toLowerCase().includes(searchQuery.value.toLowerCase().trim()) ||
      item.key.toLowerCase().includes(searchQuery.value.toLowerCase().trim())
    return matchesGroup && matchesSearch
  })
})

function selectIcon(iconKey) {
  emit('update:modelValue', iconKey)
  emit('select', iconKey)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-[#e2e2e5] dark:border-zinc-800 p-5 shadow-floating flex flex-col max-h-[85vh]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-[#e2e2e5] dark:border-zinc-800">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
              Pilih Ikon Kategori
            </h3>
            <p class="text-xs text-slate-400 dark:text-zinc-500">
              Pilih ikon unik yang sesuai untuk kategori transaksi kamu.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            @click="emit('close')"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Xmark class="w-4 h-4" />
          </button>
        </div>

        <!-- Search Input -->
        <div class="pt-3 pb-2">
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Cari ikon (misal: kopi, mobil, belanja, gaji)..."
              class="w-full h-9 pl-9 pr-3 rounded-xl border border-[#e2e2e5] dark:border-zinc-700 bg-[#f9f9fc] dark:bg-zinc-800/60 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-[#144229] dark:focus:border-[#a1d2af]"
            />
          </div>
        </div>

        <!-- Group Tabs Filter -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          <button
            v-for="grp in CATEGORY_ICON_GROUPS"
            :key="grp"
            type="button"
            @click="selectedGroup = grp"
            class="px-3 py-1 rounded-full shrink-0 font-semibold transition-colors cursor-pointer"
            :class="
              selectedGroup === grp
                ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] shadow-2xs'
                : 'bg-[#f3f3f6] dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            "
          >
            {{ grp }}
          </button>
        </div>

        <!-- Grid of Icons (Scrollable) -->
        <div class="overflow-y-auto flex-1 py-3 -mx-1 px-1">
          <div
            v-if="filteredIcons.length === 0"
            class="py-12 text-center text-xs text-slate-400 dark:text-zinc-500"
          >
            Tidak ada ikon yang sesuai dengan pencarian "{{ searchQuery }}".
          </div>

          <div v-else class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-2.5">
            <button
              v-for="item in filteredIcons"
              :key="item.key"
              type="button"
              @click="selectIcon(item.key)"
              class="p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border group"
              :class="
                modelValue === item.key
                  ? 'bg-[#d3e4d8]/40 dark:bg-[#144229]/40 border-[#144229] dark:border-[#a1d2af] text-[#144229] dark:text-[#a1d2af] shadow-xs'
                  : 'bg-[#f9f9fc] dark:bg-zinc-800/40 border-[#e2e2e5] dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800'
              "
            >
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                :class="
                  modelValue === item.key
                    ? 'bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110]'
                    : 'bg-white dark:bg-zinc-900 border border-[#e2e2e5] dark:border-zinc-700/80'
                "
              >
                <component :is="item.icon" class="w-5 h-5 stroke-[2]" />
              </div>
              <span class="mt-1.5 text-[11px] font-semibold truncate w-full tracking-tight">
                {{ item.label }}
              </span>
            </button>
          </div>
        </div>

        <!-- Footer Info -->
        <div class="pt-3 border-t border-[#e2e2e5] dark:border-zinc-800 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500">
          <span>Tersedia {{ CATEGORY_ICONS.length }} pilihan ikon</span>
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-1.5 rounded-full font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
