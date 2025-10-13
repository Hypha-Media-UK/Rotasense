<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DayOfWeek, MinimumStaffPeriod, CreateMinimumStaffPeriodForm } from '@/types'

interface DayConfig {
  day: DayOfWeek
  isOperational: boolean
  startTime: string
  endTime: string
  periods: MinimumStaffPeriod[]
}

interface Props {
  operationalDays: DayOfWeek[]
  defaultStartTime: string
  defaultEndTime: string
  is24x7: boolean
  periods: MinimumStaffPeriod[]
  departmentId?: number
  serviceId?: number
}

interface Emits {
  (e: 'update:operationalDays', days: DayOfWeek[]): void
  (e: 'update:defaultStartTime', time: string): void
  (e: 'update:defaultEndTime', time: string): void
  (e: 'addPeriod', period: CreateMinimumStaffPeriodForm): void
  (e: 'updatePeriod', id: number, period: Partial<CreateMinimumStaffPeriodForm>): void
  (e: 'deletePeriod', id: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const selectedDay = ref<DayOfWeek | null>(null)
const showDayPanel = ref(false)
const showAddPeriodForm = ref(false)

// Day configuration
const dayTimes = ref<Record<DayOfWeek, { startTime: string; endTime: string }>>({})

// Add period form state
const newPeriodForm = ref({
  startTime: '09:00',
  endTime: '17:00',
  minStaff: 1
})

const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Computed
const dayConfigs = computed((): DayConfig[] => {
  return daysOfWeek.map(day => ({
    day,
    isOperational: props.operationalDays.includes(day),
    startTime: dayTimes.value[day]?.startTime || props.defaultStartTime,
    endTime: dayTimes.value[day]?.endTime || props.defaultEndTime,
    periods: props.periods.filter(p => p.daysOfWeek.includes(day))
  }))
})

const selectedDayConfig = computed(() => {
  if (!selectedDay.value) return null
  return dayConfigs.value.find(config => config.day === selectedDay.value)
})

const selectedDayPeriods = computed(() => {
  if (!selectedDay.value) return []
  return props.periods.filter(p => p.daysOfWeek.includes(selectedDay.value!))
})

// Methods
function formatDayName(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1)
}

function formatDayShort(day: DayOfWeek): string {
  return day.slice(0, 3).toUpperCase()
}

function toggleDay(day: DayOfWeek) {
  const newDays = [...props.operationalDays]
  const index = newDays.indexOf(day)

  if (index > -1) {
    newDays.splice(index, 1)
  } else {
    newDays.push(day)
  }

  emit('update:operationalDays', newDays)
}

function handleDayClick(day: DayOfWeek, event: Event) {
  event.preventDefault()
  event.stopPropagation()

  const isOperational = props.operationalDays.includes(day)

  if (isOperational) {
    // If day is operational, open configuration panel
    openDayPanel(day)
  } else {
    // If day is not operational, make it operational
    toggleDay(day)
  }
}

function makeNonOperational(day: DayOfWeek, event: Event) {
  event.preventDefault()
  event.stopPropagation()

  // Remove day from operational days
  const newDays = props.operationalDays.filter(d => d !== day)
  emit('update:operationalDays', newDays)
}

function openDayPanel(day: DayOfWeek) {
  selectedDay.value = day
  showDayPanel.value = true

  // Initialize day times if not set
  if (!dayTimes.value[day]) {
    dayTimes.value[day] = {
      startTime: props.defaultStartTime,
      endTime: props.defaultEndTime
    }
  }
}

function closeDayPanel() {
  selectedDay.value = null
  showDayPanel.value = false
  showAddPeriodForm.value = false
  newPeriodForm.value = {
    startTime: '09:00',
    endTime: '17:00',
    minStaff: 1
  }
}

function updateDayTimes(startTime: string, endTime: string) {
  if (!selectedDay.value) return

  dayTimes.value[selectedDay.value] = { startTime, endTime }

  // Update default times if this affects multiple days
  emit('update:defaultStartTime', startTime)
  emit('update:defaultEndTime', endTime)
}

function showAddPeriodFormForDay() {
  if (!selectedDay.value || !selectedDayConfig.value) return

  // Reset form with default values
  newPeriodForm.value = {
    startTime: selectedDayConfig.value.startTime,
    endTime: selectedDayConfig.value.endTime,
    minStaff: 1
  }

  showAddPeriodForm.value = true
}

function saveNewPeriod() {
  if (!selectedDay.value) return

  const newPeriod: CreateMinimumStaffPeriodForm = {
    departmentId: props.departmentId,
    serviceId: props.serviceId,
    startTime: newPeriodForm.value.startTime,
    endTime: newPeriodForm.value.endTime,
    minStaff: newPeriodForm.value.minStaff,
    daysOfWeek: [selectedDay.value]
  }

  emit('addPeriod', newPeriod)
  showAddPeriodForm.value = false
}

function cancelAddPeriod() {
  showAddPeriodForm.value = false
  newPeriodForm.value = {
    startTime: '09:00',
    endTime: '17:00',
    minStaff: 1
  }
}

function updatePeriod(period: MinimumStaffPeriod, updates: Partial<CreateMinimumStaffPeriodForm>) {
  emit('updatePeriod', period.id, updates)
}

function deletePeriod(period: MinimumStaffPeriod) {
  if (confirm(`Delete this staffing requirement?`)) {
    emit('deletePeriod', period.id)
  }
}

function getDayStatus(day: DayOfWeek): 'operational' | 'closed' | 'configured' {
  const config = dayConfigs.value.find(c => c.day === day)
  if (!config?.isOperational) return 'closed'
  if (config.periods.length > 0) return 'configured'
  return 'operational'
}

function getDayStatusText(day: DayOfWeek): string {
  const config = dayConfigs.value.find(c => c.day === day)
  if (!config?.isOperational) return 'Click to open'
  if (config.periods.length === 0) return `${config.startTime} - ${config.endTime}`
  return `${config.periods.length} period${config.periods.length !== 1 ? 's' : ''}`
}



// Watch for 24x7 changes
watch(() => props.is24x7, (is24x7) => {
  if (is24x7) {
    emit('update:operationalDays', [...daysOfWeek])
    emit('update:defaultStartTime', '00:00')
    emit('update:defaultEndTime', '23:59')
  }
})
</script>

<template>
  <div class="day-configuration">
    <div class="section-header">
      <h4>Operational Schedule & Staffing</h4>
      <div class="header-info">
        <span v-if="is24x7" class="badge badge-24x7">24/7 Operation</span>
        <span v-else class="operation-summary">
          {{ operationalDays.length }} day{{ operationalDays.length !== 1 ? 's' : '' }} operational
        </span>
      </div>
    </div>

    <div class="section-help">
      <p v-if="!is24x7" class="help-text">
        <strong>Click closed days</strong> to make them operational.
        <strong>Click operational days</strong> to configure hours and staffing.
        <strong>Use the × button</strong> to close operational days.
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
          { 'day-selected': selectedDay === day }
        ]"
        @click="!is24x7 ? handleDayClick(day, $event) : null"
      >
        <!-- Close button positioned at top-right -->
        <button
          v-if="getDayStatus(day) !== 'closed'"
          @click.stop="makeNonOperational(day, $event)"
          type="button"
          class="close-day-btn"
          :title="`Close ${formatDayName(day)}`"
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
            <svg v-if="getDayStatus(day) !== 'closed'" class="config-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Configuration Panel -->
    <div v-if="showDayPanel && selectedDay && selectedDayConfig" class="day-panel">
      <div class="panel-header">
        <h4>{{ formatDayName(selectedDay) }} Configuration</h4>
        <button @click="closeDayPanel" type="button" class="close-btn">&times;</button>
      </div>

      <div class="panel-content">
        <!-- Operating Hours -->
        <div class="config-section">
          <h5>Operating Hours</h5>
          <div class="time-inputs">
            <div class="form-group">
              <label>Start Time</label>
              <input
                :value="selectedDayConfig.startTime"
                @input="updateDayTimes(($event.target as HTMLInputElement).value, selectedDayConfig.endTime)"
                type="time"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>End Time</label>
              <input
                :value="selectedDayConfig.endTime"
                @input="updateDayTimes(selectedDayConfig.startTime, ($event.target as HTMLInputElement).value)"
                type="time"
                class="form-input"
              >
            </div>
          </div>
        </div>



        <!-- Current Staffing Periods -->
        <div class="config-section">
          <div class="section-header-small">
            <h5>Staffing Requirements</h5>
            <button
              v-if="!showAddPeriodForm"
              @click="showAddPeriodFormForDay"
              type="button"
              class="btn btn-sm"
            >
              Add Period
            </button>
          </div>

          <!-- Add Period Form -->
          <div v-if="showAddPeriodForm" class="add-period-form">
            <div class="form-header">
              <h6>Add New Staffing Period</h6>
            </div>
            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">From</label>
                <input
                  v-model="newPeriodForm.startTime"
                  type="time"
                  class="form-input"
                  required
                >
              </div>
              <div class="form-group">
                <label class="form-label">To</label>
                <input
                  v-model="newPeriodForm.endTime"
                  type="time"
                  class="form-input"
                  required
                >
              </div>
              <div class="form-group">
                <label class="form-label">Staff No.</label>
                <input
                  v-model.number="newPeriodForm.minStaff"
                  type="number"
                  min="1"
                  class="form-input"
                  required
                >
              </div>
            </div>
            <div class="form-actions">
              <button @click="cancelAddPeriod" type="button" class="btn btn-secondary">Cancel</button>
              <button @click="saveNewPeriod" type="button" class="btn btn-primary">Save Period</button>
            </div>
          </div>

          <div v-if="selectedDayPeriods.length === 0 && !showAddPeriodForm" class="empty-periods">
            <p>No specific staffing requirements configured for this day.</p>
          </div>

          <div v-if="selectedDayPeriods.length > 0" class="periods-list">
            <div
              v-for="period in selectedDayPeriods"
              :key="period.id"
              class="period-item"
            >
              <div class="period-info">
                <div class="period-time">{{ period.startTime }} - {{ period.endTime }}</div>
                <div class="period-staff">{{ period.minStaff }} staff minimum</div>
              </div>
              <div class="period-actions">
                <button @click="deletePeriod(period)" type="button" class="delete-btn" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.day-configuration {
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

.header-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-24x7 {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.operation-summary {
  font-size: 0.875rem;
  color: #6b7280;
}

.section-help {
  margin-bottom: 1rem;
}

.help-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
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
  min-width: 0; /* Prevents flex items from overflowing */
  overflow: hidden;
  position: relative; /* For absolute positioning of close button */
}

.day-card:hover {
  border-color: #d1d5db;
}

.day-operational {
  background: #f0f9ff;
  border-color: #3b82f6;
  cursor: pointer;
}

.day-operational:hover {
  background: #dbeafe;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.day-configured {
  background: #f0fdf4;
  border-color: #10b981;
  cursor: pointer;
}

.day-configured:hover {
  background: #dcfce7;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.day-closed {
  background: #f9fafb;
  border-color: #e5e7eb;
  opacity: 0.6;
  cursor: pointer;
}

.day-closed:hover {
  opacity: 0.8;
  border-color: #d1d5db;
}

.day-selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
}

.close-day-btn:hover {
  background: #374151;
  transform: scale(1.1);
}

.day-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: 1.5rem; /* Space for close button */
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

.config-arrow {
  opacity: 0.6;
  transition: all 0.2s;
  flex-shrink: 0;
}

.day-card:hover .config-arrow {
  opacity: 1;
  transform: translateX(2px);
}

.day-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.panel-content {
  padding: 1rem;
}

.config-section {
  margin-bottom: 1.5rem;
}

.config-section:last-child {
  margin-bottom: 0;
}

.config-section h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.form-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.add-period-form {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.form-header h6 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-secondary {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #3b82f6;
  border: 1px solid #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.section-header-small {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-header-small h5 {
  margin: 0;
}

.btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: all 0.2s;
}

.btn:hover {
  background: #f9fafb;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.empty-periods {
  text-align: center;
  padding: 1rem;
  color: #6b7280;
  background: white;
  border: 1px dashed #d1d5db;
  border-radius: 0.375rem;
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
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.period-info {
  flex: 1;
}

.period-time {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
}

.period-staff {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.period-actions {
  display: flex;
  gap: 0.25rem;
}

.delete-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}
</style>
