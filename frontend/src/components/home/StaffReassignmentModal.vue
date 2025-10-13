<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format, addDays } from 'date-fns'
import Modal from '@/components/Modal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useConfigStore } from '@/stores/config'
import { useHomeStore } from '@/stores/home'
import type { Staff, CreateOverrideForm } from '@/types'

interface Props {
  show: boolean
  staff: Staff | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const configStore = useConfigStore()
const homeStore = useHomeStore()

// Form state
const assignmentType = ref<'department' | 'service'>('department')
const selectedLocationId = ref<number>(0)
const startDate = ref('')
const endDate = ref('')
const startTime = ref('08:00')
const endTime = ref('20:00')
const loading = ref(false)
const error = ref<string | null>(null)

// Computed properties
const availableLocations = computed(() => {
  if (assignmentType.value === 'department') {
    return configStore.departments.map(dept => ({
      id: dept.id,
      name: `${dept.name} (${dept.buildings?.name || 'Unknown Building'})`
    }))
  } else {
    return configStore.services.map(service => ({
      id: service.id,
      name: service.name
    }))
  }
})

const currentOverride = computed(() => {
  if (!props.staff) return null

  return homeStore.todaysOverrides.find(o =>
    o.staffId === props.staff!.id && o.overrideType === 'TEMPORARY_ALLOCATION'
  )
})

const currentLocation = computed(() => {
  if (!props.staff) return 'Unknown'

  // Check for existing temporary allocation
  const override = currentOverride.value

  if (override) {
    if (override.departmentId) {
      const dept = configStore.departments.find(d => d.id === override.departmentId)
      return dept ? `${dept.name} (Temporary)` : 'Temporary Assignment'
    }
    if (override.serviceId) {
      const service = configStore.services.find(s => s.id === override.serviceId)
      return service ? `${service.name} (Temporary)` : 'Temporary Assignment'
    }
  }

  // Check regular allocation
  const allocation = configStore.allocations.find(a => a.staffId === props.staff!.id)
  if (allocation) {
    if (allocation.departmentId) {
      const dept = configStore.departments.find(d => d.id === allocation.departmentId)
      return dept ? dept.name : 'Department'
    }
    if (allocation.serviceId) {
      const service = configStore.services.find(s => s.id === allocation.serviceId)
      return service ? service.name : 'Service'
    }
  }

  // Check runner pool
  if (props.staff.runnerPoolId) {
    const pool = configStore.runnerPools.find(p => p.id === props.staff!.runnerPoolId)
    return pool ? pool.name : 'Runner Pool'
  }

  return 'Unallocated'
})

const hasTemporaryAllocation = computed(() => !!currentOverride.value)

const isFormValid = computed(() => {
  return selectedLocationId.value > 0 &&
         startDate.value &&
         startTime.value &&
         endTime.value
})

// Watch for modal open/close to reset form
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
  }
})

// Watch assignment type to reset location selection
watch(assignmentType, () => {
  selectedLocationId.value = 0
})

function resetForm() {
  assignmentType.value = 'department'
  selectedLocationId.value = 0
  startDate.value = format(new Date(), 'yyyy-MM-dd')
  endDate.value = '' // Leave empty for "today only" default
  // Use staff's contracted hours as default
  startTime.value = props.staff?.defaultStartTime || '08:00'
  endTime.value = props.staff?.defaultEndTime || '20:00'
  error.value = null
}

function closeModal() {
  emit('close')
}

async function removeTemporaryAllocation() {
  if (!props.staff || !currentOverride.value) {
    error.value = 'No temporary allocation to remove'
    return
  }

  loading.value = true
  error.value = null

  try {
    await homeStore.deleteOverride(currentOverride.value.id)
    closeModal()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to remove temporary assignment'
  } finally {
    loading.value = false
  }
}

async function createTemporaryAssignment() {
  if (!props.staff || !isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Convert date strings to datetime format for backend
    const startDateTime = new Date(startDate.value + 'T00:00:00.000Z').toISOString()
    // If no end date specified, default to same day (today only)
    const endDateTime = endDate.value ?
      new Date(endDate.value + 'T23:59:59.999Z').toISOString() :
      new Date(startDate.value + 'T23:59:59.999Z').toISOString()

    const overrideData: CreateOverrideForm = {
      staffId: props.staff.id,
      date: startDateTime,
      endDate: endDateTime,
      overrideType: 'TEMPORARY_ALLOCATION',
      startTime: startTime.value,
      endTime: endTime.value,
      reason: `Temporary assignment to ${availableLocations.value.find(l => l.id === selectedLocationId.value)?.name}`
    }

    if (assignmentType.value === 'department') {
      overrideData.departmentId = selectedLocationId.value
    } else {
      overrideData.serviceId = selectedLocationId.value
    }

    await homeStore.createOverride(overrideData)
    closeModal()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create temporary assignment'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Modal
    :show="show"
    :title="hasTemporaryAllocation ? 'Manage Staff Assignment' : 'Reassign Staff Member'"
    size="lg"
    @close="closeModal"
  >
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="staff" class="reassignment-form">
      <!-- Debug info (remove in production) -->
      <div v-if="false" style="background: #f0f0f0; padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
        <p><strong>Debug:</strong></p>
        <p>Has temporary allocation: {{ hasTemporaryAllocation }}</p>
        <p>Current override: {{ currentOverride ? 'Yes' : 'No' }}</p>
        <p>Overrides count: {{ homeStore.todaysOverrides.length }}</p>
      </div>

      <!-- Staff Information -->
      <div class="form-section">
        <h3 class="section-title">Staff Information</h3>
        <div class="staff-info">
          <div class="staff-detail">
            <label class="form-label">Staff Member</label>
            <p class="staff-name-display">{{ staff.name }}</p>
          </div>
          <div class="staff-detail">
            <label class="form-label">Current Location</label>
            <p class="current-location">{{ currentLocation }}</p>
          </div>
          <div class="staff-detail">
            <label class="form-label">Default Hours</label>
            <p class="staff-hours">{{ staff.defaultStartTime }} - {{ staff.defaultEndTime }}</p>
          </div>
        </div>
      </div>

      <!-- Current Temporary Assignment (if exists) -->
      <div v-if="hasTemporaryAllocation" class="form-section current-assignment">
        <h3 class="section-title">Current Temporary Assignment</h3>
        <div class="current-assignment-info">
          <div class="assignment-details">
            <p><strong>Assigned to:</strong> {{ currentLocation.replace(' (Temporary)', '') }}</p>
            <p v-if="currentOverride"><strong>Start Date:</strong> {{ format(new Date(currentOverride.date), 'PPP') }}</p>
            <p v-if="currentOverride && currentOverride.endDate"><strong>End Date:</strong> {{ format(new Date(currentOverride.endDate), 'PPP') }}</p>
            <p v-if="currentOverride && currentOverride.startTime"><strong>Hours:</strong> {{ currentOverride.startTime }} - {{ currentOverride.endTime }}</p>
          </div>
          <button
            @click="removeTemporaryAllocation"
            :disabled="loading"
            class="btn btn-warning"
          >
            <LoadingSpinner v-if="loading" size="sm" />
            {{ loading ? 'Removing...' : 'Return to Pool' }}
          </button>
        </div>
      </div>

      <!-- Assignment Configuration (only show if no current temporary assignment) -->
      <div v-else class="form-section">
        <h3 class="section-title">Create Temporary Assignment</h3>

        <!-- Assignment Type -->
        <div class="form-group">
          <label class="form-label">Assignment Type</label>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                v-model="assignmentType"
                value="department"
                class="radio-input"
              >
              Department
            </label>
            <label class="radio-label">
              <input
                type="radio"
                v-model="assignmentType"
                value="service"
                class="radio-input"
              >
              Service
            </label>
          </div>
        </div>

        <!-- Location Selection -->
        <div class="form-group">
          <label class="form-label">
            {{ assignmentType === 'department' ? 'Department' : 'Service' }}
          </label>
          <select v-model="selectedLocationId" class="form-select" required>
            <option value="0">Select {{ assignmentType }}...</option>
            <option
              v-for="location in availableLocations"
              :key="location.id"
              :value="location.id"
            >
              {{ location.name }}
            </option>
          </select>
        </div>

        <!-- Time Frame -->
        <div class="form-group">
          <label class="form-label">Assignment Period</label>
          <div class="date-range">
            <div class="date-input">
              <label class="form-label">Start Date</label>
              <input
                type="date"
                v-model="startDate"
                class="form-input"
                required
              >
            </div>
            <div class="date-input">
              <label class="form-label">End Date (Optional)</label>
              <input
                type="date"
                v-model="endDate"
                class="form-input"
                :min="startDate"
                placeholder="Leave empty for today only"
              >
              <small class="form-help">Leave empty for today only</small>
            </div>
          </div>
        </div>

        <!-- Working Hours -->
        <div class="form-group">
          <label class="form-label">Working Hours</label>
          <div class="time-range">
            <div class="time-input">
              <label class="form-label">Start Time</label>
              <input
                type="time"
                v-model="startTime"
                class="form-input"
                required
              >
            </div>
            <div class="time-input">
              <label class="form-label">End Time</label>
              <input
                type="time"
                v-model="endTime"
                class="form-input"
                required
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" @click="closeModal" class="btn">Cancel</button>
      <button
        v-if="!hasTemporaryAllocation"
        @click="createTemporaryAssignment"
        :disabled="!isFormValid || loading"
        class="btn btn-primary"
      >
        <LoadingSpinner v-if="loading" size="sm" />
        {{ loading ? 'Assigning...' : 'Create Assignment' }}
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.reassignment-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.form-section {
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
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

.staff-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.staff-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.staff-name-display {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.current-location {
  color: #059669;
  font-weight: 500;
  margin: 0;
}

.staff-hours {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.radio-group {
  display: flex;
  gap: 1.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
}

.radio-input {
  width: 1rem;
  height: 1rem;
}

.form-select,
.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-range,
.time-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.date-input,
.time-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.current-assignment {
  background: #fef3c7 !important;
  border-color: #f59e0b !important;
}

.current-assignment .section-title::before {
  background: #f59e0b !important;
}

.current-assignment-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.assignment-details {
  flex: 1;
}

.assignment-details p {
  margin: 0 0 0.5rem 0;
  color: #92400e;
}

.assignment-details strong {
  color: #78350f;
}

.btn-warning {
  background: #f59e0b;
  color: white;
  border: 1px solid #f59e0b;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.btn-warning:hover {
  background: #d97706;
  border-color: #d97706;
}

.btn-warning:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-help {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 0.25rem;
}
</style>
