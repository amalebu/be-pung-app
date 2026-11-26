<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ShoppingBag,
  Plus,
  EditPencil,
  Trash,
  NavArrowLeft,
  Check,
} from '@iconoir/vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseHeading from '@/components/ui/BaseHeading.vue'
import BaseText from '@/components/ui/BaseText.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import { useFinanceStore } from '@/stores/financeStore'

const router = useRouter()
const financeStore = useFinanceStore()

const isFormSheetOpen = ref(false)
const isActionSheetOpen = ref(false)
const isDeleteSheetOpen = ref(false)
const selectedItem = ref(null)
const formError = ref('')

// Add / Edit Form
const editingItemId = ref(null)
const itemName = ref('')
const itemCategory = ref('Kebutuhan')
const itemTargetAmount = ref(0)
const itemSavedAmount = ref(0)
const itemPriority = ref('medium')
const itemNotes = ref('')

// Action Form ('buy' | 'save')
const actionMode = ref('buy')
const actionAmount = ref(0)
const actionRecordToWallet = ref(true)
const actionWalletId = ref(null)
const actionCategoryId = ref(null)

onMounted(async () => {
  await Promise.all([
    financeStore.fetchWishlists(),
    financeStore.fetchWallets(),
    financeStore.fetchCategories(),
  ])
  if (financeStore.wallets.length > 0) {
    actionWalletId.value = financeStore.wallets[0].id
  }
  if (financeStore.expenseCategories.length > 0) {
    actionCategoryId.value = financeStore.expenseCategories[0].id
  }
})

// Metrik hanya menghitung item yang belum dibeli agar akurat
const activeWishlist = computed(() =>
  financeStore.wishlists.filter((w) => !w.is_purchased)
)

const totalNeeded = computed(() =>
  activeWishlist.value.reduce((acc, w) => acc + Number(w.target_amount || 0), 0)
)
const totalSaved = computed(() =>
  activeWishlist.value.reduce((acc, w) => acc + Number(w.saved_amount || 0), 0)
)
const totalShortfall = computed(() => Math.max(0, totalNeeded.value - totalSaved.value))

function getProgress(item) {
  const target = Number(item.target_amount || 0)
  if (!target) return 0
  return Math.min(100, Math.round((Number(item.saved_amount || 0) / target) * 100))
}

function getPriorityVariant(priority) {
  if (priority === 'high') return 'rose'
  if (priority === 'medium') return 'amber'
  return 'neutral'
}

function getPriorityLabel(priority) {
  if (priority === 'high') return 'Prioritas Tinggi'
  if (priority === 'medium') return 'Prioritas Menengah'
  return 'Prioritas Rendah'
}

function openCreateItem() {
  formError.value = ''
  editingItemId.value = null
  itemName.value = ''
  itemCategory.value = 'Kebutuhan'
  itemTargetAmount.value = 0
  itemSavedAmount.value = 0
  itemPriority.value = 'medium'
  itemNotes.value = ''
  isFormSheetOpen.value = true
}

function openEditItem(item) {
  formError.value = ''
  editingItemId.value = item.id
  itemName.value = item.name || ''
  itemCategory.value = item.category_name || 'Kebutuhan'
  itemTargetAmount.value = Number(item.target_amount || 0)
  itemSavedAmount.value = Number(item.saved_amount || 0)
  itemPriority.value = item.priority || 'medium'
  itemNotes.value = item.notes || ''
  isFormSheetOpen.value = true
}

async function handleSaveItem() {
  formError.value = ''
  if (!itemName.value.trim() || Number(itemTargetAmount.value) <= 0) {
    formError.value = 'Nama barang dan harga estimasi wajib diisi.'
    return
  }
  const payload = {
    name: itemName.value.trim(),
    category_name: itemCategory.value.trim() || 'Umum',
    target_amount: parseFloat(itemTargetAmount.value),
    saved_amount: parseFloat(itemSavedAmount.value) || 0,
    priority: itemPriority.value,
    notes: itemNotes.value.trim() || null,
  }
  try {
    if (editingItemId.value) {
      await financeStore.editWishlist(editingItemId.value, payload)
    } else {
      await financeStore.saveWishlist(payload)
    }
    isFormSheetOpen.value = false
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan item To Buy.'
  }
}

function openActionSheet(item, mode = 'buy') {
  formError.value = ''
  selectedItem.value = item
  actionMode.value = mode
  actionAmount.value =
    mode === 'buy'
      ? Number(item.target_amount || 0)
      : Math.max(0, Number(item.target_amount || 0) - Number(item.saved_amount || 0))
  actionRecordToWallet.value = true
  actionWalletId.value = financeStore.wallets[0]?.id || null
  actionCategoryId.value = financeStore.expenseCategories[0]?.id || null
  isActionSheetOpen.value = true
}

async function handleConfirmAction() {
  if (!selectedItem.value) return
  formError.value = ''
  try {
    await financeStore.actionWishlist(selectedItem.value.id, {
      action: actionMode.value,
      amount: parseFloat(actionAmount.value) || 0,
      record_to_wallet: actionRecordToWallet.value,
      wallet_id: actionRecordToWallet.value ? actionWalletId.value : null,
      finance_category_id: actionCategoryId.value,
    })
    isActionSheetOpen.value = false
    selectedItem.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal memperbarui status item.'
  }
}

async function handleUnbuy(item) {
  await financeStore.actionWishlist(item.id, { action: 'unbuy' })
}

function openDeleteItem(item) {
  formError.value = ''
  selectedItem.value = item
  isDeleteSheetOpen.value = true
}

async function handleConfirmDelete() {
  if (!selectedItem.value) return
  formError.value = ''
  try {
    await financeStore.removeWishlist(selectedItem.value.id)
    isDeleteSheetOpen.value = false
    selectedItem.value = null
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menghapus item.'
  }
}
</script>

<template>
  <div class="space-y-4 md:space-y-5">
    <!-- Navigasi Kembali & Header -->
    <div>
      <button
        type="button"
        @click="router.push('/finance')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-[#144229] dark:text-[#a1d2af] hover:underline cursor-pointer mb-2"
      >
        <NavArrowLeft class="w-4 h-4 stroke-[2.2]" />
        <span>Kembali ke Ringkasan</span>
      </button>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <BaseHeading as="h2" size="xl" weight="semibold">To Buy List & Kebutuhan Dana</BaseHeading>
          <BaseText size="sm" variant="muted" class="mt-0.5">
            Daftar barang yang ingin dibeli beserta estimasi anggaran dan kekurangan dananya.
          </BaseText>
        </div>

        <button
          type="button"
          @click="openCreateItem"
          class="h-9 px-4 rounded-full flex items-center gap-1.5 bg-[#144229] hover:bg-[#1f5637] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus class="w-4 h-4 stroke-[2.2]" />
          <span>Tambah Item</span>
        </button>
      </div>
    </div>

    <!-- Summary Metrics (Hanya item yang belum dibeli) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Total Dana Dibutuhkan
        </span>
        <div class="text-xl font-extrabold tabular-nums text-slate-900 dark:text-zinc-100">
          {{ financeStore.formatMoney(totalNeeded) }}
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Dana Sudah Siap
        </span>
        <div class="text-xl font-extrabold tabular-nums text-[#144229] dark:text-[#a1d2af]">
          {{ financeStore.formatMoney(totalSaved) }}
        </div>
      </BaseCard>

      <BaseCard padding="p-4" class="space-y-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Kekurangan Dana
        </span>
        <div class="text-xl font-extrabold tabular-nums text-[#ba1a1a] dark:text-rose-400">
          {{ financeStore.formatMoney(totalShortfall) }}
        </div>
      </BaseCard>
    </div>

    <!-- Empty State -->
    <BaseCard
      v-if="financeStore.wishlists.length === 0"
      padding="p-8"
      class="text-center"
    >
      <ShoppingBag class="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
      <BaseHeading as="h3" size="md" weight="semibold">Belum ada daftar To Buy List</BaseHeading>
      <BaseText size="xs" variant="muted" class="mt-1 max-w-sm mx-auto">
        Rencanakan pembelian barang kebutuhan atau wishlist impianmu agar tidak mengganggu arus kas utama.
      </BaseText>
      <div class="mt-4">
        <button
          type="button"
          @click="openCreateItem"
          class="h-9 px-5 rounded-full bg-[#144229] text-white dark:bg-[#a1d2af] dark:text-[#002110] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          + Tambah Item Pertama
        </button>
      </div>
    </BaseCard>

    <!-- Daftar Item To Buy List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      <BaseCard
        v-for="item in financeStore.wishlists"
        :key="item.id"
        padding="p-4 sm:p-5"
        class="space-y-3 transition-opacity flex flex-col justify-between"
        :class="{ 'opacity-65': item.is_purchased }"
      >
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3
                  class="text-sm font-bold text-slate-900 dark:text-zinc-100"
                  :class="{ 'line-through text-slate-400': item.is_purchased }"
                >
                  {{ item.name }}
                </h3>
                <BaseBadge :variant="getPriorityVariant(item.priority)" size="xs">
                  {{ getPriorityLabel(item.priority) }}
                </BaseBadge>
              </div>
              <p class="text-xs text-slate-400 dark:text-zinc-500">
                Kategori: <strong class="text-slate-600 dark:text-zinc-300">{{ item.category_name }}</strong>
              </p>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                @click="openEditItem(item)"
                aria-label="Edit Item"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <EditPencil class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="openDeleteItem(item)"
                aria-label="Hapus Item"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#ba1a1a] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <Trash class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between text-xs tabular-nums">
              <span class="text-slate-500 dark:text-zinc-400">
                Terkumpul: <strong class="text-slate-900 dark:text-zinc-100">{{ financeStore.formatMoney(item.saved_amount) }}</strong>
              </span>
              <span class="font-extrabold text-slate-900 dark:text-zinc-100">
                Harga: {{ financeStore.formatMoney(item.target_amount) }}
              </span>
            </div>

            <div class="w-full h-2 rounded-full bg-[#f3f3f6] dark:bg-zinc-800 overflow-hidden">
              <div
                class="h-full rounded-full bg-[#144229] dark:bg-[#a1d2af] transition-all"
                :style="{ width: `${getProgress(item)}%` }"
              />
            </div>

            <div class="flex justify-between text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
              <span>{{ getProgress(item) }}% Siap</span>
              <span>
                Kurang: {{ financeStore.formatMoney(Math.max(0, item.target_amount - item.saved_amount)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tombol Aksi -->
        <div class="pt-2.5 border-t border-[#e2e2e5] dark:border-zinc-800 flex items-center gap-2">
          <template v-if="!item.is_purchased">
            <button
              type="button"
              @click="openActionSheet(item, 'save')"
              class="flex-1 py-2 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-[#d3e4d8]/45 hover:text-[#144229] transition-colors cursor-pointer"
            >
              + Alokasi Dana
            </button>
            <button
              type="button"
              @click="openActionSheet(item, 'buy')"
              class="flex-1 py-2 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
            >
              <Check class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tandai Dibeli</span>
            </button>
          </template>
          <template v-else>
            <BaseBadge variant="emerald" size="xs">✓ Sudah Dibeli</BaseBadge>
            <button
              type="button"
              @click="handleUnbuy(item)"
              class="ml-auto text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 underline cursor-pointer"
            >
              Batalkan Status Dibeli
            </button>
          </template>
        </div>
      </BaseCard>
    </div>

    <!-- BottomSheet: Tambah / Edit Item To Buy -->
    <BottomSheet
      :show="isFormSheetOpen"
      :title="editingItemId ? 'Edit Item To Buy' : 'Tambah Item To Buy Baru'"
      @close="isFormSheetOpen = false"
    >
      <form @submit.prevent="handleSaveItem" class="space-y-3.5 text-xs">
        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            Nama Barang / Kebutuhan
          </label>
          <input
            v-model="itemName"
            type="text"
            required
            placeholder="Contoh: Monitor 4K, Sepatu Lari..."
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Kategori / Label
            </label>
            <input
              v-model="itemCategory"
              type="text"
              placeholder="Contoh: Elektronik, Kesehatan..."
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Tingkat Prioritas
            </label>
            <select
              v-model="itemPriority"
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-semibold text-slate-900 dark:text-zinc-100 outline-none"
            >
              <option value="high">Prioritas Tinggi</option>
              <option value="medium">Prioritas Menengah</option>
              <option value="low">Prioritas Rendah</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Harga Estimasi (IDR)
            </label>
            <input
              v-model="itemTargetAmount"
              type="number"
              min="1"
              required
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Dana Sudah Siap (IDR)
            </label>
            <input
              v-model="itemSavedAmount"
              type="number"
              min="0"
              class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
            />
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            @click="isFormSheetOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="financeStore.isSaving"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Menyimpan...' : 'Simpan Item' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Alokasi Dana / Tandai Dibeli (+ Catat ke Dompet) -->
    <BottomSheet
      :show="isActionSheetOpen"
      :title="actionMode === 'buy' ? 'Konfirmasi Pembelian Item' : 'Alokasi Dana To Buy'"
      @close="isActionSheetOpen = false"
    >
      <form v-if="selectedItem" @submit.prevent="handleConfirmAction" class="space-y-3.5 text-xs">
        <div class="p-3.5 rounded-2xl bg-[#f3f3f6] dark:bg-zinc-800/70">
          <p class="font-bold text-slate-900 dark:text-zinc-100">{{ selectedItem.name }}</p>
          <p class="text-[11px] text-slate-500 dark:text-zinc-400">
            Estimasi Harga: {{ financeStore.formatMoney(selectedItem.target_amount) }}
          </p>
        </div>

        <div
          v-if="formError"
          class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 font-semibold text-[#ba1a1a] dark:text-rose-400"
        >
          {{ formError }}
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
            {{ actionMode === 'buy' ? 'Harga Pembelian Aktual (IDR)' : 'Nominal Alokasi Dana (IDR)' }}
          </label>
          <input
            v-model="actionAmount"
            type="number"
            min="1"
            required
            class="w-full p-2.5 rounded-xl bg-[#f9f9fc] dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-extrabold text-sm tabular-nums text-slate-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <div class="p-3 rounded-2xl bg-[#f9f9fc] dark:bg-zinc-800/50 border border-[#e2e2e5] dark:border-zinc-800 space-y-2.5">
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <span class="font-bold text-slate-800 dark:text-zinc-200 block">
                Catat pengeluaran ke dompet
              </span>
              <span class="text-[11px] text-slate-400 dark:text-zinc-500">
                Otomatis memotong saldo dompet dan mencatat transaksi pengeluaran
              </span>
            </div>
            <input
              type="checkbox"
              v-model="actionRecordToWallet"
              class="w-4 h-4 accent-[#144229] rounded cursor-pointer"
            />
          </label>

          <div v-if="actionRecordToWallet" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Dompet</label>
              <select
                v-model="actionWalletId"
                class="w-full p-2 rounded-xl bg-white dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200 outline-none"
              >
                <option v-for="w in financeStore.wallets" :key="w.id" :value="w.id">
                  {{ w.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Kategori</label>
              <select
                v-model="actionCategoryId"
                class="w-full p-2 rounded-xl bg-white dark:bg-zinc-800 border border-[#e2e2e5] dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200 outline-none"
              >
                <option v-for="c in financeStore.expenseCategories" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="isActionSheetOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="financeStore.isSaving"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#144229] dark:bg-[#a1d2af] text-white dark:text-[#002110] hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Memproses...' : 'Konfirmasi' }}
          </button>
        </div>
      </form>
    </BottomSheet>

    <!-- BottomSheet: Konfirmasi Hapus -->
    <BottomSheet
      :show="isDeleteSheetOpen"
      title="Hapus Item To Buy?"
      @close="isDeleteSheetOpen = false"
    >
      <div class="space-y-4 text-xs">
        <p class="text-slate-600 dark:text-zinc-400 leading-relaxed">
          Apakah kamu yakin ingin menghapus item
          <strong class="text-slate-900 dark:text-zinc-100">{{ selectedItem?.name }}</strong>?
        </p>

        <div class="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            @click="isDeleteSheetOpen = false"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#f3f3f6] dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="financeStore.isSaving"
            @click="handleConfirmDelete"
            class="flex-1 py-2.5 rounded-full text-xs font-bold bg-[#ba1a1a] text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {{ financeStore.isSaving ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
