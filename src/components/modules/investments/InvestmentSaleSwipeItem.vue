<script setup>
import { ref, computed } from 'vue'
import { Trash } from '@iconoir/vue'
import StockAvatar from '@/components/ui/StockAvatar.vue'
import { formatRupiah, formatSharePrice, formatPercent } from '@/utils/currencyUtils'

const props = defineProps({
  sale: {
    type: Object,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click', 'delete', 'swipe-open', 'swipe-close'])

const currentTranslateX = ref(0)
const isSwiping = ref(false)
const isVerticalScrolling = ref(false)

let startX = 0
let startY = 0
let initialTranslateX = 0
let hasMoved = false

const maxSwipeLeft = -80 // Lebar tombol aksi Batal/Hapus

function plColor(val) {
  const num = Number(val || 0)
  if (num > 0) return 'text-[#144229] dark:text-[#a1d2af]'
  if (num < 0) return 'text-[#ba1a1a] dark:text-rose-400'
  return 'text-slate-500 dark:text-zinc-400'
}

function onTouchStart(e) {
  if (!e.touches || e.touches.length === 0) return
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  initialTranslateX = currentTranslateX.value
  isSwiping.value = false
  isVerticalScrolling.value = false
  hasMoved = false
}

function onTouchMove(e) {
  if (!e.touches || e.touches.length === 0) return
  if (isVerticalScrolling.value) return

  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const deltaX = currentX - startX
  const deltaY = currentY - startY

  if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
    hasMoved = true
  }

  if (!isSwiping.value && !isVerticalScrolling.value) {
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
      isVerticalScrolling.value = true
      return
    }
    if (Math.abs(deltaX) > 8) {
      isSwiping.value = true
    }
  }

  if (isSwiping.value) {
    let nextX = initialTranslateX + deltaX
    // Batasi swipe: tidak bisa swipe ke kanan lebih dari 0, dan max swipe kiri -96px (rubberband)
    if (nextX > 0) nextX = 0
    if (nextX < maxSwipeLeft - 20) {
      nextX = maxSwipeLeft - 20 + (nextX - (maxSwipeLeft - 20)) * 0.2
    }
    currentTranslateX.value = nextX
  }
}

function onTouchEnd() {
  if (isVerticalScrolling.value) {
    isVerticalScrolling.value = false
    return
  }

  if (isSwiping.value) {
    // Threshold snap ke open (-40px)
    if (currentTranslateX.value < -40) {
      currentTranslateX.value = maxSwipeLeft
      emit('swipe-open', props.sale.id)
    } else {
      currentTranslateX.value = 0
      emit('swipe-close', props.sale.id)
    }
  }
  isSwiping.value = false
}

function onContentClick() {
  if (currentTranslateX.value < -10) {
    // Jika sedang terbuka, tap pada baris akan menutup swipe
    currentTranslateX.value = 0
    emit('swipe-close', props.sale.id)
    return
  }
  if (!hasMoved) {
    emit('click', props.sale)
  }
}

function handleActionClick() {
  currentTranslateX.value = 0
  emit('delete', props.sale)
}

function closeSwipe() {
  currentTranslateX.value = 0
}

defineExpose({
  closeSwipe,
})
</script>

<template>
  <div class="relative overflow-hidden bg-white dark:bg-zinc-900 select-none">
    <!-- Action reveal background (underneath on the right) -->
    <div class="absolute inset-y-0 right-0 flex items-stretch z-0">
      <button
        type="button"
        @click.stop="handleActionClick"
        class="flex flex-col items-center justify-center w-20 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs transition-colors px-2 cursor-pointer"
        aria-label="Batalkan Penjualan"
      >
        <Trash class="w-5 h-5 mb-0.5" />
        <span class="text-[11px] font-bold tracking-tight">Batalkan</span>
      </button>
    </div>

    <!-- Foreground Content (slides left when swiped) -->
    <div
      class="relative z-10 flex items-center gap-3 px-3.5 py-3 bg-white dark:bg-zinc-900 border-b border-slate-200/70 dark:border-zinc-800 transition-transform duration-150 ease-out cursor-pointer active:bg-slate-50/80 dark:active:bg-zinc-800/40"
      :style="{ transform: `translateX(${currentTranslateX}px)` }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @click="onContentClick"
    >
      <StockAvatar :ticker="sale.ticker" :alt="sale.company_name" size="md" class="shrink-0" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="font-extrabold text-[#144229] dark:text-[#a1d2af] text-sm">{{ sale.ticker }}</span>
          <span class="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">{{ sale.sold_at }}</span>
        </div>
        <div class="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
          {{ sale.sold_lots }} Lot @ Rp {{ formatSharePrice(sale.sell_price) }} (Avg Beli Rp {{ formatSharePrice(sale.buy_avg_price) }})
        </div>
      </div>
      <div class="text-right text-xs tabular-nums shrink-0">
        <div class="font-extrabold" :class="plColor(sale.realized_pl)">
          {{ formatRupiah(sale.realized_pl, { withSign: true }) }}
        </div>
        <div class="text-[11px]" :class="plColor(sale.realized_pl_percent)">
          {{ formatPercent(sale.realized_pl_percent) }}
        </div>
      </div>
    </div>
  </div>
</template>
