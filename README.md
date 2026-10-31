# PersonalApp (be-pung-app)

> Modern Minimalist Personal Management & Productivity Dashboard PWA (Vue 3 + Tailwind CSS + Pinia + Vite).

Live Demo on GitHub Pages: **[https://amalebu.github.io/be-pung-app](https://amalebu.github.io/be-pung-app)**

---

## Fitur Utama

- **Offline-First PWA:** Dukungan IndexedDB lokal + Outbox Sync Queue saat offline, status sync toast gaya YouTube, serta Service Worker auto-update.
- **Autentikasi Aman:** Login nomor telepon + 6-digit virtual PIN Pad, integrasi Google OAuth, auto inactivity lock (5 menit).
- **To-Do List Terintegrasi:** Hierarki sub-checklist dinamis, prioritas tugas, filter kategori, due date & time.
- **Habit Tracker:** GitHub-style activity contribution calendar heatmap, streak tracking, pencatatan Good & Bad habit dengan target fleksibel.
- **Finance Tracker:** Arus kas, mutasi transaksi, multi-dompet & kategori budget bulanan.
- **Serene Tactile Design System:** Nuansa *Serene Pod Tactile* dengan dark mode & light mode otomatis.

---

## Tech Stack

- **Framework:** [Vue 3](https://vuejs.org/) (`<script setup>`, JavaScript murni)
- **Build Tool:** [Vite](https://vite.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **CSS:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Routing:** [Vue Router 4](https://router.vuejs.org/) (HTML5 History Mode)
- **Icons & Charts:** `lucide-vue-next` & `chart.js` + `vue-chartjs`
- **Deployment:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)

---

## Menjalankan di Lokal

```bash
# Clone repository
git clone https://github.com/amalebu/be-pung-app.git
cd be-pung-app

# Install dependencies
npm install

# Jalankan server development
npm run dev
```

Server development akan aktif di `http://localhost:5173`.

---

## Build Produksi

```bash
npm run build
```

Hasil build disimpan di direktori `dist/` dengan prefix base path `/be-pung-app/`.
