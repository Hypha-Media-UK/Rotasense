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
function resetForm() {
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
  showServiceForm.value = false
  error.value = null
}

function openCreateForm() {
  resetForm()
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

      <form @submit.prevent="saveService" class="form">
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
          <label class="checkbox-label">
            <input
              v-model="newService.is24x7"
              type="checkbox"
              class="checkbox"
            >
            24/7 Operation
          </label>
          <p class="form-help">Check this if the service operates 24 hours a day, 7 days a week.</p>
        </div>

        <div v-if="!newService.is24x7" class="form-group">
          <label class="form-label">Operational Days</label>
          <p class="form-help">Click to activate/select days. Click again to deactivate.</p>
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
              {{ day.charAt(0).toUpperCase() + day.slice(1, 3) }}
            </button>
          </div>
        </div>

        <!-- Time Inputs for Selected Day -->
        <div v-if="!newService.is24x7 && selectedServiceDay && newService.operationalDays.includes(selectedServiceDay)" class="form-group">
          <label class="form-label">{{ formatDayName(selectedServiceDay) }} Service Hours</label>
          <div class="time-inputs">
            <div class="time-input">
              <label class="form-label">Start Time</label>
              <input
                v-model="currentServiceDayTimes.startTime"
                @input="updateServiceDayTimes"
                type="time"
                class="form-input"
                required
              >
            </div>
            <div class="time-input">
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



        <div class="form-group">
          <label class="form-label">Minimum Staff</label>
          <input v-model.number="newService.minStaff" type="number" min="1" class="form-input" required>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="newService.displayOnHome" type="checkbox" class="checkbox">
            Display on homepage (show even without staff)
          </label>
        </div>
      </form>

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

      <article
        v-for="service in configStore.services"
        :key="service.id"
      >
        <header>
          <h3>{{ service.name }}</h3>
          <div>
            <button @click="openEditForm(service)">Edit</button>
            <button @click="deleteService(service)">Delete</button>
          </div>
        </header>

        <div>
          <time>{{ getServiceScheduleDisplay(service) }}</time>
          <span>{{ service.operationalDays.length }} days/week</span>
          <span>Min {{ service.minStaff }} staff required</span>

          <span :class="service.displayOnHome ? 'status-active' : 'status-off-duty'">
            {{ service.displayOnHome ? 'Visible on Home' : 'Hidden from Home' }}
          </span>
        </div>
      </article>
    </section>
  </article>
</template>




