<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { MinimumStaffPeriod, CreateMinimumStaffPeriodForm, DayOfWeek } from '@/types'

interface Props {
  periods: MinimumStaffPeriod[]
  departmentId?: number
  serviceId?: number
}

interface Emits {
  (e: 'add', period: CreateMinimumStaffPeriodForm): void
  (e: 'update', id: number, period: Partial<CreateMinimumStaffPeriodForm>): void
  (e: 'delete', id: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const showAddForm = ref(false)
const editingPeriod = ref<MinimumStaffPeriod | null>(null)

// Form data
const newPeriod = ref<CreateMinimumStaffPeriodForm>({
  departmentId: props.departmentId,
  serviceId: props.serviceId,
  startTime: '08:00',
  endTime: '12:00',
  minStaff: 1,
  daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
})

const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Computed
const sortedPeriods = computed(() => {
  return [...props.periods].sort((a, b) => {
    // Sort by start time
    return a.startTime.localeCompare(b.startTime)
  })
})

// Methods
function openAddForm(event?: Event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  newPeriod.value = {
    departmentId: props.departmentId,
    serviceId: props.serviceId,
    startTime: '08:00',
    endTime: '12:00',
    minStaff: 1,
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  }
  editingPeriod.value = null
  showAddForm.value = true
}

function openEditForm(period: MinimumStaffPeriod, event?: Event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  newPeriod.value = {
    departmentId: period.departmentId,
    serviceId: period.serviceId,
    startTime: period.startTime,
    endTime: period.endTime,
    minStaff: period.minStaff,
    daysOfWeek: [...period.daysOfWeek]
  }
  editingPeriod.value = period
  showAddForm.value = true
}

function closeForm() {
  showAddForm.value = false
  editingPeriod.value = null
}

function savePeriod() {
  if (editingPeriod.value) {
    emit('update', editingPeriod.value.id, newPeriod.value)
  } else {
    emit('add', newPeriod.value)
  }
  closeForm()
}

function deletePeriod(period: MinimumStaffPeriod) {
  if (confirm(`Are you sure you want to delete the ${period.startTime} - ${period.endTime} period?`)) {
    emit('delete', period.id)
  }
}

function toggleDay(day: DayOfWeek) {
  const index = newPeriod.value.daysOfWeek.indexOf(day)
  if (index > -1) {
    newPeriod.value.daysOfWeek.splice(index, 1)
  } else {
    newPeriod.value.daysOfWeek.push(day)
  }
}

function formatDays(days: DayOfWeek[]): string {
  if (days.length === 7) return 'Every day'
  if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) return 'Weekdays'
  if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) return 'Weekends'
  return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')
}

// Watch for prop changes
watch(() => props.departmentId, (newVal) => {
  newPeriod.value.departmentId = newVal
  newPeriod.value.serviceId = undefined
})

watch(() => props.serviceId, (newVal) => {
  newPeriod.value.serviceId = newVal
  newPeriod.value.departmentId = undefined
})
</script>

<template>
  <div class="minimum-staff-periods">
    <div class="section-header">
      <h4>Time-Based Minimum Staff Requirements</h4>
      <button @click.stop="openAddForm($event)" type="button" class="btn btn-sm">Add Period</button>
    </div>

    <div v-if="sortedPeriods.length === 0" class="empty-state">
      <p>No time-based requirements configured. Using default minimum staff for all operational hours.</p>
    </div>

    <div v-else class="periods-list">
      <div
        v-for="period in sortedPeriods"
        :key="period.id"
        class="period-item"
      >
        <div class="period-info">
          <div class="period-time">
            {{ period.startTime }} - {{ period.endTime }}
          </div>
          <div class="period-details">
            <span class="min-staff">{{ period.minStaff }} staff minimum</span>
            <span class="period-days">{{ formatDays(period.daysOfWeek) }}</span>
          </div>
        </div>
        <div class="period-actions">
          <button @click.stop="openEditForm(period, $event)" type="button" class="icon-btn edit-btn" title="Edit Period">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button @click.stop="deletePeriod(period)" type="button" class="icon-btn delete-btn" title="Delete Period">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Form -->
    <div v-if="showAddForm" class="form-container">
      <div class="form-header">
        <h4>{{ editingPeriod ? 'Edit' : 'Add' }} Minimum Staff Period</h4>
        <button @click="closeForm" class="close-btn" type="button">&times;</button>
      </div>

      <form @submit.prevent="savePeriod" class="period-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Start Time</label>
              <input
                v-model="newPeriod.startTime"
                type="time"
                class="form-input"
                required
              >
            </div>

            <div class="form-group">
              <label class="form-label">End Time</label>
              <input
                v-model="newPeriod.endTime"
                type="time"
                class="form-input"
                required
              >
            </div>

            <div class="form-group">
              <label class="form-label">Minimum Staff</label>
              <input
                v-model.number="newPeriod.minStaff"
                type="number"
                min="1"
                class="form-input"
                required
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Days of Week</label>
            <div class="days-grid">
              <label
                v-for="day in daysOfWeek"
                :key="day"
                class="day-checkbox"
              >
                <input
                  type="checkbox"
                  :checked="newPeriod.daysOfWeek.includes(day)"
                  @change="toggleDay(day)"
                >
                <span>{{ day.charAt(0).toUpperCase() + day.slice(1) }}</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeForm" class="btn">Cancel</button>
            <button type="submit" class="btn btn-primary">
              {{ editingPeriod ? 'Update' : 'Add' }} Period
            </button>
          </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.minimum-staff-periods {
  margin-top: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.empty-state {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 0.375rem;
  border: 1px dashed #d1d5db;
}

.periods-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.period-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.period-info {
  flex: 1;
}

.period-time {
  font-weight: 600;
  color: #111827;
}

.period-details {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.period-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  padding: 0.25rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.25rem;
  color: #6b7280;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.edit-btn:hover {
  color: #3b82f6;
}

.delete-btn:hover {
  color: #ef4444;
}

.form-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  margin-top: 1rem;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.form-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.period-form {
  padding: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.day-checkbox:hover {
  background: #f3f4f6;
}

.day-checkbox input:checked + span {
  font-weight: 600;
  color: #3b82f6;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}
</style>
