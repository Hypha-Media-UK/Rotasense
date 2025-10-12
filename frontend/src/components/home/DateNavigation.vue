<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { useHomeStore } from '@/stores/home'

const homeStore = useHomeStore()

const weekLabel = computed(() => {
  const start = homeStore.selectedWeek[0]
  const end = homeStore.selectedWeek[6]
  if (!start || !end) return ''
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
})

const dayLabels = computed(() => {
  return homeStore.selectedWeek.map(date => ({
    date,
    label: format(date, 'EEE'),
    dayNumber: format(date, 'd'),
    isSelected: format(date, 'yyyy-MM-dd') === homeStore.selectedDateString,
    isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  }))
})
</script>

<template>
  <nav>
    <section>
      <button
        @click="homeStore.goToPreviousWeek()"
        aria-label="Previous week"
      >
        ←
      </button>

      <div>
        <span>{{ weekLabel }}</span>
        <button
          @click="homeStore.goToToday()"
          :class="{ 'btn-primary': !homeStore.isSelectedDateToday }"
        >
          Today
        </button>
      </div>

      <button
        @click="homeStore.goToNextWeek()"
        aria-label="Next week"
      >
        →
      </button>
    </section>

    <section>
      <button
        v-for="day in dayLabels"
        :key="day.date.toISOString()"
        @click="homeStore.setSelectedDate(day.date)"
        :class="{
          'day-selected': day.isSelected,
          'day-today': day.isToday && !day.isSelected
        }"
      >
        <span>{{ day.label }}</span>
        <span>{{ day.dayNumber }}</span>
      </button>
    </section>
  </nav>
</template>


