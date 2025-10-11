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
  <div class="date-navigation">
    <!-- Week Navigation -->
    <div class="week-nav">
      <button
        @click="homeStore.goToPreviousWeek()"
        class="btn week-nav-btn"
        aria-label="Previous week"
      >
        ←
      </button>

      <div class="week-label">
        <span class="week-text">{{ weekLabel }}</span>
        <button
          @click="homeStore.goToToday()"
          class="btn btn-sm today-btn"
          :class="{ 'btn-primary': !homeStore.isSelectedDateToday }"
        >
          Today
        </button>
      </div>

      <button
        @click="homeStore.goToNextWeek()"
        class="btn week-nav-btn"
        aria-label="Next week"
      >
        →
      </button>
    </div>

    <!-- Day Navigation -->
    <div class="day-nav">
      <button
        v-for="day in dayLabels"
        :key="day.date.toISOString()"
        @click="homeStore.setSelectedDate(day.date)"
        class="day-btn"
        :class="{
          'day-btn-selected': day.isSelected,
          'day-btn-today': day.isToday && !day.isSelected
        }"
      >
        <span class="day-label">{{ day.label }}</span>
        <span class="day-number">{{ day.dayNumber }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.date-navigation {
  display: grid;
  gap: var(--space-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.week-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.week-nav-btn {
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.week-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  flex: 1;
}

.week-text {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.today-btn {
  font-size: var(--font-size-xs);
  padding: var(--space-xs) var(--space-sm);
}

.btn-sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
}

.day-nav {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-xs);
}

.day-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 60px;
}

.day-btn:hover {
  border-color: var(--color-border-hover);
  background-color: var(--color-background);
}

.day-btn-selected {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.day-btn-today {
  border-color: var(--color-accent);
  background-color: oklch(0.95 0.05 150);
}

.day-label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.day-number {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .date-navigation {
    padding: var(--space-md);
  }

  .week-nav {
    gap: var(--space-sm);
  }

  .week-nav-btn {
    min-width: 36px;
    height: 36px;
    font-size: var(--font-size-base);
  }

  .week-text {
    font-size: var(--font-size-base);
  }

  .day-nav {
    gap: 2px;
  }

  .day-btn {
    padding: var(--space-xs);
    min-height: 50px;
  }

  .day-label {
    font-size: 10px;
  }

  .day-number {
    font-size: var(--font-size-base);
  }
}

@media (max-width: 480px) {
  .week-label {
    gap: 2px;
  }

  .week-text {
    font-size: var(--font-size-sm);
  }

  .day-btn {
    min-height: 44px;
  }

  .day-number {
    font-size: var(--font-size-sm);
  }
}
</style>
