import { Droplet, Gym, OpenBook, CoffeeCup, Prohibition, HalfMoon, FireFlame, Heart, Spark } from '@iconoir/vue'

// Pemetaan id ikon habit (disimpan di database) -> komponen Iconoir
export const habitIconMap = {
  droplets: Droplet,
  dumbbell: Gym,
  book: OpenBook,
  coffee: CoffeeCup,
  ban: Prohibition,
  moon: HalfMoon,
  flame: FireFlame,
  heart: Heart,
  sparkles: Spark,
}

export function getHabitIcon(iconId) {
  return habitIconMap[iconId] || Spark
}
