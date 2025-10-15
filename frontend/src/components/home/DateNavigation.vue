<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import { useHomeStore } from '@/stores/home'

const homeStore = useHomeStore()

const monthYearLabel = computed(() => {
  const selectedDate = homeStore.selectedDate
  if (!selectedDate) return ''
  return format(selectedDate, 'MMM yyyy')
})

const dayLabels = computed(() => {
  const labels = homeStore.selectedWeek.map(date => ({
    date,
    dayNumber: format(date, 'd'),
    fullDate: format(date, 'EEEE, MMMM d, yyyy'),
    isSelected: format(date, 'yyyy-MM-dd') === homeStore.selectedDateString,
    isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
    isWeekend: date.getDay() === 0 || date.getDay() === 6 // Sunday or Saturday
  }))

  return labels
})

// Keyboard navigation
function handleKeydown(event: KeyboardEvent) {
  const currentIndex = homeStore.selectedWeek.findIndex(date =>
    format(date, 'yyyy-MM-dd') === homeStore.selectedDateString
  )

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      if (currentIndex > 0) {
        const prevDate = homeStore.selectedWeek[currentIndex - 1]
        if (prevDate) homeStore.setSelectedDate(prevDate)
      } else {
        homeStore.goToPreviousWeek()
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      if (currentIndex < 6) {
        const nextDate = homeStore.selectedWeek[currentIndex + 1]
        if (nextDate) homeStore.setSelectedDate(nextDate)
      } else {
        homeStore.goToNextWeek()
      }
      break
    case 'Home':
      event.preventDefault()
      homeStore.goToToday()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <nav class="calendar-nav">
    <!-- Top Controls Row -->
    <section class="nav-controls">
      <button
        @click="homeStore.goToPreviousWeek()"
        aria-label="Previous week"
        class="nav-arrow"
      >
        ←
      </button>

      <span class="month-year">{{ monthYearLabel }}</span>

      <button
        @click="homeStore.goToToday()"
        :class="{ 'btn-primary': !homeStore.isSelectedDateToday }"
        class="today-btn"
      >
        Today
      </button>

      <button
        @click="homeStore.goToNextWeek()"
        aria-label="Next week"
        class="nav-arrow"
      >
        →
      </button>
    </section>

    <!-- Unified Week Bar -->
    <section class="week-bar">
      <button
        v-for="day in dayLabels"
        :key="day.date.toISOString()"
        @click="homeStore.setSelectedDate(day.date)"
        :class="{
          'day-selected': day.isSelected,
          'day-today': day.isToday && !day.isSelected,
          'day-weekend': day.isWeekend
        }"
        :aria-label="day.fullDate"
        :title="day.fullDate"
        class="day-button"
      >
        {{ day.dayNumber }}
      </button>
    </section>
  </nav>
</template>


