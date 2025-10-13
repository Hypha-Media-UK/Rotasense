<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DayOfWeek } from '@/types'

interface Props {
  contractedDays: DayOfWeek[]
  disabled?: boolean
}

interface Emits {
  (e: 'update:contractedDays', days: DayOfWeek[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Helper functions
function formatDayShort(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3)
}

function formatDayName(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1)
}

function getDayStatus(day: DayOfWeek): 'selected' | 'available' {
  return props.contractedDays.includes(day) ? 'selected' : 'available'
}

function getDayStatusText(day: DayOfWeek): string {
  return props.contractedDays.includes(day) ? 'Working day' : 'Click to add'
}

function handleDayClick(day: DayOfWeek, event: Event) {
  if (props.disabled) return
  
  event.preventDefault()
  event.stopPropagation()
  
  const isSelected = props.contractedDays.includes(day)
  
  if (isSelected) {
    // Remove day from contracted days
    const newDays = props.contractedDays.filter(d => d !== day)
    emit('update:contractedDays', newDays)
  } else {
    // Add day to contracted days
    const newDays = [...props.contractedDays, day]
    emit('update:contractedDays', newDays)
  }
}

function removeDay(day: DayOfWeek, event: Event) {
  if (props.disabled) return
  
  event.preventDefault()
  event.stopPropagation()
  
  const newDays = props.contractedDays.filter(d => d !== day)
  emit('update:contractedDays', newDays)
}
</script>

<template>
  <div class="staff-day-selection">
    <div class="section-header">
      <h4>Working Days</h4>
      <div class="header-info">
        <span class="working-summary">
          {{ contractedDays.length }} day{{ contractedDays.length !== 1 ? 's' : '' }} selected
        </span>
      </div>
    </div>

    <div class="section-help">
      <p class="help-text">
        <strong>Click days</strong> to add or remove them from the staff member's working schedule.
        <strong>Use the × button</strong> to remove working days.
      </p>
    </div>

    <!-- Days Grid -->
    <div class="days-grid">
      <div
        v-for="day in daysOfWeek"
        :key="day"
        :class="[
          'day-card',
          `day-${getDayStatus(day)}`,
          { 'day-disabled': disabled }
        ]"
        @click="!disabled ? handleDayClick(day, $event) : null"
      >
        <!-- Close button for selected days -->
        <button
          v-if="getDayStatus(day) === 'selected' && !disabled"
          @click.stop="removeDay(day, $event)"
          type="button"
          class="close-day-btn"
          :title="`Remove ${formatDayName(day)}`"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="day-content">
          <div class="day-name">{{ formatDayShort(day) }}</div>
          <div class="day-status">
            {{ getDayStatusText(day) }}
            <svg v-if="getDayStatus(day) === 'available'" class="add-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staff-day-selection {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.working-summary {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.section-help {
  margin-bottom: 1rem;
}

.help-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
  width: 100%;
  overflow: hidden;
}

.day-card {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.day-card:hover:not(.day-disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Available days (not selected) */
.day-available {
  background: #f9fafb;
  border-color: #d1d5db;
}

.day-available:hover:not(.day-disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

/* Selected days (working days) */
.day-selected {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}

.day-selected:hover:not(.day-disabled) {
  background: #bfdbfe;
  border-color: #2563eb;
}

/* Disabled state */
.day-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-day-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: #4b5563;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
  max-width: 18px;
  max-height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
  z-index: 10;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  flex-shrink: 0;
}

.close-day-btn:hover {
  background: #374151;
  transform: scale(1.1);
}

.day-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: 1.5rem;
}

.day-name {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.day-status {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.add-arrow {
  opacity: 0.6;
  transition: all 0.2s;
  flex-shrink: 0;
}

.day-card:hover .add-arrow {
  opacity: 1;
  transform: scale(1.1);
}

.day-selected .day-status {
  color: #1e40af;
}
</style>
