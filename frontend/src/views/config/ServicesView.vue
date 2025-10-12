<script setup lang="ts">
import { ref, computed } from 'vue'
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
  }
}

function formatDayName(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3)
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

  // Reset day selection and times
  selectedServiceDay.value = null
  serviceDayTimes.value = {}
  currentServiceDayTimes.value = { startTime: service.startTime || '08:00', endTime: service.endTime || '20:00' }

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
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete service'
  }
}

function handleServiceDayClick(day: string) {
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



const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
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
              <h4 class="subsection-title">Operating Days</h4>
              <p class="form-help">Select the days this service operates</p>
              <div class="days-grid">
                <button
                  v-for="day in daysOfWeek"
                  :key="day"
                  type="button"
                  @click="handleServiceDayClick(day)"
                  class="day-button"
                  :class="{
                    active: newService.operationalDays.includes(day),
                    selected: selectedServiceDay === day && newService.operationalDays.includes(day)
                  }"
                >
                  <span class="day-short">{{ day.charAt(0).toUpperCase() + day.slice(1, 3) }}</span>
                  <span class="day-full">{{ day.charAt(0).toUpperCase() + day.slice(1) }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Time Customization Section -->
          <div v-if="!newService.is24x7 && selectedServiceDay && newService.operationalDays.includes(selectedServiceDay)" class="form-section">
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

/* Enhanced Days Grid */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.day-button {
  padding: 1rem 0.5rem;
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
  min-height: 4rem;
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

/* Time Customization */
.time-customization {
  background: #fffbeb;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
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
