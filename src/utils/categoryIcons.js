import {
  Cutlery,
  PizzaSlice,
  CoffeeCup,
  Apple,
  Fish,
  Car,
  Motorcycle,
  Bus,
  Train,
  Airplane,
  Bicycle,
  DeliveryTruck,
  ShoppingBag,
  Cart,
  Shop,
  Package,
  Gift,
  Glasses,
  Home,
  HomeSimple,
  Flash,
  Wifi,
  LightBulb,
  Phone,
  StatsReport,
  Hospital,
  Heart,
  Activity,
  Gym,
  Trophy,
  Medal,
  Gamepad,
  Movie,
  Tv,
  MusicDoubleNote,
  Headset,
  Camera,
  Palette,
  GraduationCap,
  Book,
  Notes,
  Suitcase,
  Building,
  Tools,
  Wallet,
  Bank,
  Coins,
  CreditCard,
  DollarCircle,
  GraphUp,
  PiggyBank,
  Percentage,
  User,
  Group,
  ShieldCheck,
  Spark,
  HelpCircle,
  Settings,
  Archive,
  Shuffle,
} from '@iconoir/vue'

/**
 * Daftar ikon kategori terorganisir untuk dipilih pengguna
 */
export const CATEGORY_ICONS = [
  // 1. Makanan & Minuman
  { key: 'cutlery', label: 'Makan & Resto', icon: Cutlery, group: 'Makanan' },
  { key: 'coffee', label: 'Kopi & Minuman', icon: CoffeeCup, group: 'Makanan' },
  { key: 'pizza', label: 'Cepat Saji', icon: PizzaSlice, group: 'Makanan' },
  { key: 'apple', label: 'Buah & Sayur', icon: Apple, group: 'Makanan' },
  { key: 'fish', label: 'Lauk & Seafood', icon: Fish, group: 'Makanan' },

  // 2. Transportasi & Perjalanan
  { key: 'car', label: 'Mobil', icon: Car, group: 'Transport' },
  { key: 'motorcycle', label: 'Motor', icon: Motorcycle, group: 'Transport' },
  { key: 'bus', label: 'Bus / Angkutan', icon: Bus, group: 'Transport' },
  { key: 'train', label: 'Kereta Api', icon: Train, group: 'Transport' },
  { key: 'airplane', label: 'Pesawat / Travel', icon: Airplane, group: 'Transport' },
  { key: 'bicycle', label: 'Sepeda', icon: Bicycle, group: 'Transport' },
  { key: 'delivery', label: 'Kurir / Paket', icon: DeliveryTruck, group: 'Transport' },

  // 3. Belanja & Kebutuhan
  { key: 'shopping-bag', label: 'Belanja', icon: ShoppingBag, group: 'Belanja' },
  { key: 'cart', label: 'Supermarket', icon: Cart, group: 'Belanja' },
  { key: 'shop', label: 'Toko Retail', icon: Shop, group: 'Belanja' },
  { key: 'package', label: 'Online Shopping', icon: Package, group: 'Belanja' },
  { key: 'gift', label: 'Hadiah / Kado', icon: Gift, group: 'Belanja' },
  { key: 'glasses', label: 'Fashion & Gaya', icon: Glasses, group: 'Belanja' },

  // 4. Tagihan & Tempat Tinggal
  { key: 'home', label: 'Rumah & Sewa', icon: Home, group: 'Tagihan & Rumah' },
  { key: 'flash', label: 'Listrik / PLN', icon: Flash, group: 'Tagihan & Rumah' },
  { key: 'wifi', label: 'Internet / Wi-Fi', icon: Wifi, group: 'Tagihan & Rumah' },
  { key: 'lightbulb', label: 'Utilitas', icon: LightBulb, group: 'Tagihan & Rumah' },
  { key: 'phone', label: 'Pulsa & Paket Data', icon: Phone, group: 'Tagihan & Rumah' },
  { key: 'bill', label: 'Tagihan Rutin', icon: StatsReport, group: 'Tagihan & Rumah' },

  // 5. Kesehatan & Olahraga
  { key: 'hospital', label: 'Dokter & RS', icon: Hospital, group: 'Kesehatan' },
  { key: 'heart', label: 'Kesehatan Umum', icon: Heart, group: 'Kesehatan' },
  { key: 'activity', label: 'Medis / Obat', icon: Activity, group: 'Kesehatan' },
  { key: 'gym', label: 'Gym & Kebugaran', icon: Gym, group: 'Kesehatan' },
  { key: 'trophy', label: 'Olahraga / Lomba', icon: Trophy, group: 'Kesehatan' },
  { key: 'medal', label: 'Prestasi', icon: Medal, group: 'Kesehatan' },

  // 6. Hiburan & Hobi
  { key: 'gamepad', label: 'Gaming & Game', icon: Gamepad, group: 'Hiburan' },
  { key: 'movie', label: 'Bioskop / Film', icon: Movie, group: 'Hiburan' },
  { key: 'tv', label: 'Streaming / TV', icon: Tv, group: 'Hiburan' },
  { key: 'music', label: 'Musik & Konser', icon: MusicDoubleNote, group: 'Hiburan' },
  { key: 'headset', label: 'Audio / Podcast', icon: Headset, group: 'Hiburan' },
  { key: 'camera', label: 'Fotografi', icon: Camera, group: 'Hiburan' },
  { key: 'palette', label: 'Seni & Hobi', icon: Palette, group: 'Hiburan' },

  // 7. Pendidikan & Karier
  { key: 'graduation', label: 'Pendidikan / Kuliah', icon: GraduationCap, group: 'Karier & Edukasi' },
  { key: 'book', label: 'Buku & Bacaan', icon: Book, group: 'Karier & Edukasi' },
  { key: 'notes', label: 'Kursus / Catatan', icon: Notes, group: 'Karier & Edukasi' },
  { key: 'suitcase', label: 'Pekerjaan / Bisnis', icon: Suitcase, group: 'Karier & Edukasi' },
  { key: 'building', label: 'Kantor', icon: Building, group: 'Karier & Edukasi' },
  { key: 'tools', label: 'Servis & Alat', icon: Tools, group: 'Karier & Edukasi' },

  // 8. Keuangan & Investasi
  { key: 'wallet', label: 'Dompet / Gaji', icon: Wallet, group: 'Keuangan' },
  { key: 'bank', label: 'Bank', icon: Bank, group: 'Keuangan' },
  { key: 'coins', label: 'Uang Tunai', icon: Coins, group: 'Keuangan' },
  { key: 'credit-card', label: 'Kartu Kredit / Fee', icon: CreditCard, group: 'Keuangan' },
  { key: 'dollar-circle', label: 'Penghasilan', icon: DollarCircle, group: 'Keuangan' },
  { key: 'graph-up', label: 'Investasi / Saham', icon: GraphUp, group: 'Keuangan' },
  { key: 'piggy-bank', label: 'Tabungan', icon: PiggyBank, group: 'Keuangan' },
  { key: 'percentage', label: 'Pajak / Diskon', icon: Percentage, group: 'Keuangan' },

  // 9. Sosial & Lainnya
  { key: 'user', label: 'Pribadi', icon: User, group: 'Lainnya' },
  { key: 'group', label: 'Sosial / Teman', icon: Group, group: 'Lainnya' },
  { key: 'shield-check', label: 'Asuransi', icon: ShieldCheck, group: 'Lainnya' },
  { key: 'spark', label: 'Bonus / Spesial', icon: Spark, group: 'Lainnya' },
  { key: 'help-circle', label: 'Belum Kategori', icon: HelpCircle, group: 'Lainnya' },
]

/**
 * Pemetaan cepat key ikon ke komponen Iconoir (termasuk sinonim/alias dari backend)
 */
export const CATEGORY_ICON_MAP = {
  // Alias bawaan backend
  food: Cutlery,
  transport: Car,
  shopping: ShoppingBag,
  home: Home,
  entertainment: Gamepad,
  medical: Hospital,
  bill: StatsReport,
  fee: CreditCard,
  salary: Wallet,
  invest: GraphUp,
  other: Coins,
  help: HelpCircle,
  category: Cutlery,

  // Alias umum lainnya
  makanan: Cutlery,
  minuman: CoffeeCup,
  mobil: Car,
  motor: Motorcycle,
  belanja: ShoppingBag,
  hiburan: Gamepad,
  kesehatan: Hospital,
  gaji: Wallet,
  investasi: GraphUp,
  tagihan: StatsReport,
  transfer: Shuffle,
}

// Daftarkan semua dari CATEGORY_ICONS ke CATEGORY_ICON_MAP
for (const item of CATEGORY_ICONS) {
  CATEGORY_ICON_MAP[item.key] = item.icon
  CATEGORY_ICON_MAP[item.key.replace(/-/g, '')] = item.icon
  CATEGORY_ICON_MAP[item.key.replace(/-/g, '_')] = item.icon
}

/**
 * Fungsi helper untuk mendapatkan komponen ikon kategori
 * @param {string} iconKey
 * @returns {Component}
 */
export function getCategoryIcon(iconKey) {
  if (!iconKey) return Coins
  const normalized = String(iconKey).toLowerCase().trim()
  return CATEGORY_ICON_MAP[normalized] || CATEGORY_ICON_MAP[normalized.replace(/[^a-z0-9]/g, '')] || Coins
}

/**
 * Daftar grup kategori untuk tab filter di Icon Picker
 */
export const CATEGORY_ICON_GROUPS = [
  'Semua',
  'Makanan',
  'Transport',
  'Belanja',
  'Tagihan & Rumah',
  'Kesehatan',
  'Hiburan',
  'Karier & Edukasi',
  'Keuangan',
  'Lainnya',
]
