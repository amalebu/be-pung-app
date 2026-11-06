<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const props = defineProps({
  showSideNav: {
    type: Boolean,
    default: null,
  },
  label: {
    type: String,
    default: '',
  },
})

const { isDark, toggleTheme } = useTheme()

// Unique mask ID agar aman jika ada beberapa toggle di halaman yang sama
const maskId = 'moon-mask-' + Math.random().toString(36).substring(2, 8)

const themeLabel = computed(() => {
  if (props.label) return props.label
  return isDark.value ? 'Mode Gelap' : 'Mode Terang'
})
</script>

<template>
  <button
    type="button"
    @click="toggleTheme()"
    class="theme-toggle flex items-center transition duration-150 cursor-pointer select-none text-slate-700 dark:text-zinc-200"
    :class="[
      showSideNav !== null
        ? 'w-full rounded-xl px-3 py-2.5 gap-3 hover:bg-gray-200 dark:hover:bg-gray-900'
        : 'w-10 h-10 rounded-full border border-[#e2e2e5] dark:border-zinc-800 bg-white/90 dark:bg-zinc-900 justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 shadow-xs',
      { 'justify-center': showSideNav === false }
    ]"
    :title="isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'"
    aria-label="Ubah tema"
  >
    <svg
      class="sun-and-moon w-6 h-6 shrink-0"
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <mask class="moon" :id="maskId">
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="white"
        />
        <circle cx="24" cy="10" r="6" fill="black" />
      </mask>
      <circle
        class="sun"
        cx="12"
        cy="12"
        r="6"
        :mask="`url(#${maskId})`"
        fill="currentColor"
      />
      <g class="sun-beams" stroke="currentColor">
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
    <span
      v-if="showSideNav"
      class="text-sm font-medium text-slate-800 dark:text-zinc-200 truncate text-left"
    >
      {{ themeLabel }}
    </span>
  </button>
</template>

<style>
/* CSS Animasi Sun and Moon (Adam Argyle Smooth SVG morph) */
.sun-and-moon > :is(.moon, .sun, .sun-beams) {
  transform-origin: center;
}

.sun-and-moon > :is(.moon, .sun) {
  fill: var(--icon-fill, currentColor);
}

.theme-toggle:is(:hover, :focus-visible) > .sun-and-moon > :is(.moon, .sun) {
  fill: var(--icon-fill-hover, currentColor);
}

.sun-and-moon > .sun-beams {
  stroke: var(--icon-fill, currentColor);
  stroke-width: 2px;
}

.theme-toggle:is(:hover, :focus-visible) .sun-and-moon > .sun-beams {
  stroke: var(--icon-fill-hover, currentColor);
}

:is([data-theme="dark"], .dark) .sun-and-moon > .sun {
  transform: scale(1.75);
}

:is([data-theme="dark"], .dark) .sun-and-moon > .sun-beams {
  opacity: 0;
}

:is([data-theme="dark"], .dark) .sun-and-moon > .moon > circle {
  transform: translateX(-7px);
}

@supports (cx: 1) {
  :is([data-theme="dark"], .dark) .sun-and-moon > .moon > circle {
    cx: 17;
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .sun-and-moon > .sun {
    transition: transform 0.5s ease-in-out;
  }

  .sun-and-moon > .sun-beams {
    transition:
      transform 0.5s ease-in-out,
      opacity 0.5s ease;
  }

  .sun-and-moon .moon > circle {
    transition: transform 0.25s ease-out;
  }

  @supports (cx: 1) {
    .sun-and-moon .moon > circle {
      transition: cx 0.25s ease-out;
    }
  }

  :is([data-theme="dark"], .dark) .sun-and-moon > .sun {
    transition-timing-function: ease-in-out;
    transition-duration: 0.25s;
    transform: scale(1.75);
  }

  :is([data-theme="dark"], .dark) .sun-and-moon > .sun-beams {
    transition-duration: 0.15s;
    transform: rotateZ(-25deg);
  }

  :is([data-theme="dark"], .dark) .sun-and-moon > .moon > circle {
    transition-duration: 0.5s;
    transition-delay: 0.25s;
  }
}
</style>
