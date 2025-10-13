<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Modal from '@/components/Modal.vue'
import type { CreateServiceForm, Service, DayOfWeek } from '@/types'

const configStore = useConfigStore()

// Form state
const showServiceForm = ref(false)
const editingService = ref<Service | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Form data
const newService = ref<CreateServiceForm>({
  name: '',
  is24x7: false,
  operationalDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startTime: '08:00',
  endTime: '20:00',
  minStaff: 1,
  displayOnHome: false
})

// Day-based time scheduling for services
const selectedServiceDay = ref<DayOfWeek | null>(null)
const serviceDayTimes = ref<Record<string, { startTime: string; endTime: string }>>({})
const currentServiceDayTimes = ref({ startTime: '08:00', endTime: '20:00' })

// Bulk day selection for operating hours
const selectedDaysForBulk = ref<Set<DayOfWeek>>(new Set())
const bulkTimeMode = ref(false)
const bulkStartTime = ref('08:00')
const bulkEndTime = ref('20:00')

// Helper functions for localStorage persistence
function getServiceTimesStorageKey(serviceId: number): string {
  return `rotasense_service_times_${serviceId}`
}

function saveServiceTimesToStorage(serviceId: number, times: Record<string, { startTime: string; endTime: string }>) {
  try {
    localStorage.setItem(getServiceTimesStorageKey(serviceId), JSON.stringify(times))
  } catch (error) {
    console.warn('Failed to save service times to localStorage:', error)
  }
}

function loadServiceTimesFromStorage(serviceId: number): Record<string, { startTime: string; endTime: string }> {
  try {
    const stored = localStorage.getItem(getServiceTimesStorageKey(serviceId))
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.warn('Failed to load service times from localStorage:', error)
    return {}
  }
}



const isEditing = computed(() => editingService.value !== null)
const formTitle = computed(() => isEditing.value ? 'Edit Service' : 'Add Service')



// Service day selection and time management
function selectServiceDay(day: DayOfWeek) {
  if (selectedServiceDay.value === day) {
    selectedServiceDay.value = null
  } else {
    selectedServiceDay.value = day
    const dayTime = serviceDayTimes.value[day]
    if (dayTime) {
      currentServiceDayTimes.value = { ...dayTime }
    } else {
      currentServiceDayTimes.value = {
        startTime: newService.value.startTime || '08:00',
        endTime: newService.value.endTime || '20:00'
      }
    }
  }
}

function updateServiceDayTimes() {
  if (selectedServiceDay.value) {
    serviceDayTimes.value[selectedServiceDay.value] = { ...currentServiceDayTimes.value }

    // Update the service's base times to match the current day's times
    newService.value.startTime = currentServiceDayTimes.value.startTime
    newService.value.endTime = currentServiceDayTimes.value.endTime

    // Save to localStorage if editing an existing service
    if (editingService.value) {
      saveServiceTimesToStorage(editingService.value.id, serviceDayTimes.value)
    }
  }
}

function formatDayName(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3)
}

function getServiceDayTimeDisplay(day: DayOfWeek): string {
  // Check if there's a specific time set for this day
  const dayTime = serviceDayTimes.value[day]
  if (dayTime) {
    return `${dayTime.startTime}-${dayTime.endTime}`
  }

  // Fall back to service default times
  const startTime = newService.value.startTime || '08:00'
  const endTime = newService.value.endTime || '20:00'
  return `${startTime}-${endTime}`
}

function hasServiceDaySpecificTime(day: DayOfWeek): boolean {
  return !!serviceDayTimes.value[day]
}

function getServiceScheduleDisplay(service: Service): string {
  return `${service.startTime} - ${service.endTime}`
}

// Methods
function resetFormData() {
  newService.value = {
    name: '',
    is24x7: false,
    operationalDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '08:00',
    endTime: '20:00',
    minStaff: 1,
    displayOnHome: false
  }
  selectedServiceDay.value = null
  serviceDayTimes.value = {}
  currentServiceDayTimes.value = { startTime: '08:00', endTime: '20:00' }
  editingService.value = null
  error.value = null

  // Reset bulk selection state
  selectedDaysForBulk.value.clear()
  bulkTimeMode.value = false
  bulkStartTime.value = '08:00'
  bulkEndTime.value = '20:00'
}

function resetForm() {
  resetFormData()
  showServiceForm.value = false
}

function openCreateForm() {
  resetFormData()
  showServiceForm.value = true
}

function openEditForm(service: Service) {
  editingService.value = service
  newService.value = {
    name: service.name,
    is24x7: service.is24x7,
    operationalDays: [...service.operationalDays],
    startTime: service.startTime,
    endTime: service.endTime,
    minStaff: service.minStaff,
    displayOnHome: service.displayOnHome
  }

  // Load saved per-day times from localStorage
  serviceDayTimes.value = loadServiceTimesFromStorage(service.id)

  // Reset day selection
  selectedServiceDay.value = null
  currentServiceDayTimes.value = { startTime: service.startTime || '08:00', endTime: service.endTime || '20:00' }

  // Reset bulk selection state
  selectedDaysForBulk.value.clear()
  bulkTimeMode.value = false
  bulkStartTime.value = service.startTime || '08:00'
  bulkEndTime.value = service.endTime || '20:00'

  showServiceForm.value = true
}

async function saveService() {
  if (!newService.value.name.trim()) {
    error.value = 'Service name is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    // For now, just use the default times (per-day scheduling can be added later)
    const serviceData = {
      ...newService.value
    }

    if (isEditing.value && editingService.value) {
      await configStore.updateService(editingService.value.id, serviceData)
    } else {
      await configStore.createService(serviceData)
    }
    resetForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save service'
  } finally {
    loading.value = false
  }
}

async function deleteService(service: Service) {
  if (!confirm(`Are you sure you want to delete ${service.name}?`)) {
    return
  }

  try {
    await configStore.deleteService(service.id)
    // Clean up localStorage for this service
    try {
      localStorage.removeItem(getServiceTimesStorageKey(service.id))
    } catch (error) {
      console.warn('Failed to clean up service times from localStorage:', error)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete service'
  }
}

function handleServiceDayClick(day: string) {
  // If in bulk mode, don't use the old single-day logic
  if (bulkTimeMode.value) {
    return
  }

  const dayOfWeek = day as DayOfWeek
  const isOperational = newService.value.operationalDays.includes(dayOfWeek)

  if (isOperational) {
    // If already selected for editing, deactivate the day
    if (selectedServiceDay.value === dayOfWeek) {
      // Second click: deactivate the day
      const index = newService.value.operationalDays.indexOf(dayOfWeek)
      if (index > -1) {
        newService.value.operationalDays.splice(index, 1)
        selectedServiceDay.value = null
        delete serviceDayTimes.value[dayOfWeek]
      }
    } else {
      // First click: select for time editing
      selectServiceDay(dayOfWeek)
    }
  } else {
    // If not operational, add to operational days and select for time editing
    newService.value.operationalDays.push(dayOfWeek)
    selectServiceDay(dayOfWeek)
  }
}

// Bulk day selection functions
function toggleBulkMode() {
  bulkTimeMode.value = !bulkTimeMode.value
  if (bulkTimeMode.value) {
    // When entering bulk mode, clear single day selection
    selectedServiceDay.value = null
    // Initialize bulk times with current default
    bulkStartTime.value = newService.value.startTime || '08:00'
    bulkEndTime.value = newService.value.endTime || '20:00'
  } else {
    // When exiting bulk mode, clear bulk selection
    selectedDaysForBulk.value.clear()
  }
}

function toggleDayForBulk(day: DayOfWeek) {
  if (selectedDaysForBulk.value.has(day)) {
    selectedDaysForBulk.value.delete(day)
  } else {
    selectedDaysForBulk.value.add(day)
  }
}

function selectQuickPattern(pattern: 'weekdays' | 'weekend' | 'all' | 'none') {
  selectedDaysForBulk.value.clear()

  switch (pattern) {
    case 'weekdays':
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        selectedDaysForBulk.value.add(day as DayOfWeek)
      })
      break
    case 'weekend':
      ['saturday', 'sunday'].forEach(day => {
        selectedDaysForBulk.value.add(day as DayOfWeek)
      })
      break
    case 'all':
      daysOfWeek.forEach(day => {
        selectedDaysForBulk.value.add(day)
      })
      break
    case 'none':
      // Already cleared above
      break
  }
}

function applyBulkTimes() {
  if (selectedDaysForBulk.value.size === 0) {
    error.value = 'Please select at least one day to apply bulk times'
    return
  }

  // Apply times to all selected days
  selectedDaysForBulk.value.forEach(day => {
    // Add to operational days if not already there
    if (!newService.value.operationalDays.includes(day)) {
      newService.value.operationalDays.push(day)
    }

    // Set the specific times for this day
    serviceDayTimes.value[day] = {
      startTime: bulkStartTime.value,
      endTime: bulkEndTime.value
    }
  })

  // Update the service's base times to match the bulk times
  newService.value.startTime = bulkStartTime.value
  newService.value.endTime = bulkEndTime.value

  // Save to localStorage if editing an existing service
  if (editingService.value) {
    saveServiceTimesToStorage(editingService.value.id, serviceDayTimes.value)
  }

  // Clear selection and exit bulk mode
  selectedDaysForBulk.value.clear()
  bulkTimeMode.value = false
  error.value = null
}



const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Initialize data on component mount
onMounted(() => {
  configStore.fetchAllData()
})
</script>

<template>
  <article class="config-content">
    <header class="content-header">
      <h2>Services</h2>
      <button @click="openCreateForm" class="btn-primary">Add Service</button>
    </header>

    <!-- Service Form Modal -->
    <Modal :show="showServiceForm" :title="formTitle" size="lg" @close="resetForm">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="service-modal-content">
        <form @submit.prevent="saveService" class="service-form">

          <!-- Basic Information Section -->
          <div class="form-section">
            <h3 class="section-title">Basic Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Service Name</label>
                <input
                  v-model="newService.name"
                  type="text"
                  class="form-input"
                  placeholder="Enter service name"
                  required
                >
              </div>

              <div class="form-group">
                <label class="form-label">Minimum Staff Required</label>
                <input
                  v-model.number="newService.minStaff"
                  type="number"
                  min="1"
                  class="form-input"
                  placeholder="e.g., 2"
                  required
                >
                <p class="form-help">Minimum number of staff needed for this service</p>
              </div>
            </div>
          </div>

          <!-- Operation Schedule Section -->
          <div class="form-section">
            <h3 class="section-title">Operation Schedule</h3>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="newService.is24x7"
                  type="checkbox"
                  class="checkbox"
                >
                <span class="checkbox-text">24/7 Operation</span>
              </label>
              <p class="form-help">Enable this if the service operates 24 hours a day, 7 days a week</p>
            </div>

            <!-- Operational Days Configuration -->
            <div v-if="!newService.is24x7" class="operational-days-section">
              <div class="schedule-header">
                <div>
                  <h4 class="subsection-title">Operating Days</h4>
                  <p class="form-help">Select the days this service operates. Times shown below each day.</p>
                  <p class="form-help-note">
                    <strong>Note:</strong> Per-day times are displayed for reference but the service's base hours will be updated to match your most recent time setting.
                    Individual day times are temporarily stored and will be preserved while editing this service.
                  </p>
                </div>
                <div class="schedule-mode-toggle">
                  <button
                    type="button"
                    @click="toggleBulkMode"
                    class="bulk-mode-btn"
                    :class="{ active: bulkTimeMode }"
                  >
                    {{ bulkTimeMode ? 'Exit Bulk Mode' : 'Bulk Time Setting' }}
                  </button>
                </div>
              </div>

              <!-- Quick Selection Patterns (only in bulk mode) -->
              <div v-if="bulkTimeMode" class="quick-patterns">
                <span class="quick-patterns-label">Quick select:</span>
                <button type="button" @click="selectQuickPattern('weekdays')" class="quick-pattern-btn">
                  Weekdays
                </button>
                <button type="button" @click="selectQuickPattern('weekend')" class="quick-pattern-btn">
                  Weekend
                </button>
                <button type="button" @click="selectQuickPattern('all')" class="quick-pattern-btn">
                  All Days
                </button>
                <button type="button" @click="selectQuickPattern('none')" class="quick-pattern-btn">
                  Clear All
                </button>
              </div>

              <!-- Days Grid -->
              <div class="days-grid">
                <div
                  v-for="day in daysOfWeek"
                  :key="day"
                  class="day-container"
                  :class="{
                    'bulk-mode': bulkTimeMode
                  }"
                >
                  <!-- Bulk Mode: Checkbox + Day Button -->
                  <template v-if="bulkTimeMode">
                    <label class="day-checkbox-label">
                      <input
                        type="checkbox"
                        :checked="selectedDaysForBulk.has(day)"
                        @change="toggleDayForBulk(day)"
                        class="day-checkbox"
                      >
                      <div
                        class="day-button bulk-day-button"
                        :class="{
                          active: newService.operationalDays.includes(day),
                          'bulk-selected': selectedDaysForBulk.has(day),
                          'has-custom-time': hasServiceDaySpecificTime(day)
                        }"
                      >
                        <span class="day-short">{{ day.charAt(0).toUpperCase() + day.slice(1, 3) }}</span>
                        <span class="day-full">{{ day.charAt(0).toUpperCase() + day.slice(1) }}</span>
                        <span v-if="newService.operationalDays.includes(day)" class="day-time">
                          {{ getServiceDayTimeDisplay(day) }}
                        </span>
                      </div>
                    </label>
                  </template>

                  <!-- Single Mode: Clickable Day Button -->
                  <template v-else>
                    <button
                      type="button"
                      @click="handleServiceDayClick(day)"
                      class="day-button"
                      :class="{
                        active: newService.operationalDays.includes(day),
                        selected: selectedServiceDay === day && newService.operationalDays.includes(day),
                        'has-custom-time': hasServiceDaySpecificTime(day)
                      }"
                    >
                      <span class="day-short">{{ day.charAt(0).toUpperCase() + day.slice(1, 3) }}</span>
                      <span class="day-full">{{ day.charAt(0).toUpperCase() + day.slice(1) }}</span>
                      <span v-if="newService.operationalDays.includes(day)" class="day-time">
                        {{ getServiceDayTimeDisplay(day) }}
                      </span>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Bulk Time Setting Section -->
          <div v-if="!newService.is24x7 && bulkTimeMode && selectedDaysForBulk.size > 0" class="form-section">
            <h3 class="section-title">Bulk Time Setting</h3>
            <p class="form-help">
              Set operating hours for {{ selectedDaysForBulk.size }} selected day{{ selectedDaysForBulk.size !== 1 ? 's' : '' }}:
              <strong>{{ Array.from(selectedDaysForBulk).map(d => formatDayName(d)).join(', ') }}</strong>
            </p>

            <div class="time-customization bulk-time-customization">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Start Time</label>
                  <input
                    v-model="bulkStartTime"
                    type="time"
                    class="form-input"
                    required
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">End Time</label>
                  <input
                    v-model="bulkEndTime"
                    type="time"
                    class="form-input"
                    required
                  >
                </div>
              </div>
              <div class="bulk-actions">
                <button type="button" @click="applyBulkTimes" class="btn btn-primary">
                  Apply to Selected Days
                </button>
                <button type="button" @click="selectedDaysForBulk.clear()" class="btn">
                  Clear Selection
                </button>
              </div>
            </div>
          </div>

          <!-- Single Day Time Customization Section -->
          <div v-if="!newService.is24x7 && !bulkTimeMode && selectedServiceDay && newService.operationalDays.includes(selectedServiceDay)" class="form-section">
            <h3 class="section-title">{{ formatDayName(selectedServiceDay) }} Service Hours</h3>
            <p class="form-help">Set operating hours for {{ formatDayName(selectedServiceDay) }}</p>

            <div class="time-customization">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Start Time</label>
                  <input
                    v-model="currentServiceDayTimes.startTime"
                    @input="updateServiceDayTimes"
                    type="time"
                    class="form-input"
                    required
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">End Time</label>
                  <input
                    v-model="currentServiceDayTimes.endTime"
                    @input="updateServiceDayTimes"
                    type="time"
                    class="form-input"
                    required
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Display Settings Section -->
          <div class="form-section">
            <h3 class="section-title">Display Settings</h3>

            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="newService.displayOnHome" type="checkbox" class="checkbox">
                <span class="checkbox-text">Display on Homepage</span>
              </label>
              <p class="form-help">Show this service on the homepage even when no staff are allocated</p>
            </div>
          </div>
        </form>
      </div>

      <template #footer>
        <button type="button" @click="resetForm" class="btn">Cancel</button>
        <button @click="saveService" :disabled="loading" class="btn btn-primary">
          <LoadingSpinner v-if="loading" size="sm" />
          {{ loading ? 'Saving...' : (isEditing ? 'Update Service' : 'Create Service') }}
        </button>
      </template>
    </Modal>

    <div v-if="configStore.loading">
      <p>Loading services...</p>
    </div>

    <div v-else-if="configStore.error">
      <p>{{ configStore.error }}</p>
    </div>

    <section v-else>
      <div v-if="configStore.services.length === 0">
        <p>No services configured yet.</p>
        <button @click="openCreateForm">Create Your First Service</button>
      </div>

      <div v-else class="services-grid">
        <div
          v-for="service in configStore.services"
          :key="service.id"
          class="service-card"
        >
        <div class="service-info">
          <h3>{{ service.name }}</h3>
          <div class="service-details">
            Min {{ service.minStaff }} staff required
          </div>
        </div>
        <div class="service-actions">
          <button @click="openEditForm(service)" class="icon-btn edit-btn" title="Edit Service">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button @click="deleteService(service)" class="icon-btn delete-btn" title="Delete Service">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.service-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.service-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.service-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.service-actions button {
  border-radius: 4px;
}

.service-actions button svg {
  color: #9ca3af;
}

.service-details {
  color: #9ca3af;
}

.content-header h2 {
  text-align: left;
}

/* Override global article hover effects for config content */
.config-content:hover {
  transform: none !important;
  box-shadow: none !important;
  border-color: initial !important;
}

/* Service Modal Styling */
.service-modal-content {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.service-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  position: relative;
}

.section-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 1.5rem;
  background: #3b82f6;
  border-radius: 2px;
}

.subsection-title {
  margin: 1.5rem 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-input,
.form-select {
  padding: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.form-help {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0;
  border-radius: 6px;
  transition: background-color 0.2s;
  justify-content: flex-start;
  width: fit-content;
  flex-direction: row;
}

.checkbox-label:hover {
  background: #f3f4f6;
  padding: 0.5rem;
  margin: -0.5rem 0;
}

.checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #3b82f6;
  margin: 0;
  flex-shrink: 0;
  order: 1;
}

.checkbox-text {
  font-size: 0.875rem;
  color: #374151;
  margin: 0;
  order: 2;
  white-space: nowrap;
}

/* Operational Days Section */
.operational-days-section {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.schedule-mode-toggle {
  flex-shrink: 0;
}

.bulk-mode-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #3b82f6;
  background: white;
  color: #3b82f6;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.bulk-mode-btn:hover {
  background: #eff6ff;
}

.bulk-mode-btn.active {
  background: #3b82f6;
  color: white;
}

.quick-patterns {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  flex-wrap: wrap;
}

.quick-patterns-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #0369a1;
  margin-right: 0.5rem;
}

.quick-pattern-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #0ea5e9;
  background: white;
  color: #0ea5e9;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-pattern-btn:hover {
  background: #0ea5e9;
  color: white;
}

.form-help-note {
  font-size: 0.75rem;
  color: #d97706;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fffbeb;
  border: 1px solid #fed7aa;
  border-radius: 4px;
  line-height: 1.4;
}

/* Enhanced Days Grid */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.day-container {
  position: relative;
}

.day-container.bulk-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.day-checkbox-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 100%;
}

.day-checkbox {
  width: 1rem;
  height: 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  accent-color: #3b82f6;
}

.bulk-day-button {
  cursor: pointer;
  width: 100%;
}

.bulk-day-button.bulk-selected {
  background: #fef3c7 !important;
  border-color: #f59e0b !important;
  color: #92400e;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.day-button {
  padding: 0.75rem 0.5rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  text-align: center;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-height: 5rem;
}

.day-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.day-button.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.day-button.selected {
  background: #059669;
  border-color: #059669;
  color: white;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.day-short {
  font-size: 0.75rem;
  font-weight: 600;
}

.day-full {
  font-size: 0.625rem;
  opacity: 0.8;
}

.day-time {
  font-size: 0.625rem;
  font-weight: 600;
  color: #6b7280;
  margin-top: 0.125rem;
  padding: 0.125rem 0.25rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  line-height: 1;
}

.day-button.active .day-time {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.2);
}

.day-button.selected .day-time {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.2);
}

.day-button.bulk-selected .day-time {
  color: #92400e;
  background: rgba(146, 64, 14, 0.1);
}

.day-button.has-custom-time {
  border-color: #f59e0b;
}

.day-button.has-custom-time .day-time {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  font-weight: 700;
}

/* Time Customization */
.time-customization {
  background: #fffbeb;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.bulk-time-customization {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.bulk-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-start;
}

.bulk-actions .btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #d1d5db;
  background: white;
}

.bulk-actions .btn-primary {
  background: #059669;
  border-color: #059669;
  color: white;
}

.bulk-actions .btn-primary:hover {
  background: #047857;
  border-color: #047857;
}

.bulk-actions .btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

/* Error States */
.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}
</style>
