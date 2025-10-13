<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Modal from '@/components/Modal.vue'
import StaffDaySelection from '@/components/config/StaffDaySelection.vue'
import type { CreateStaffForm, Staff, StaffCategory, ScheduleType, ShiftPattern, DayOfWeek, CreateAllocationForm, StaffAllocation, ZeroStartDate } from '@/types'

const configStore = useConfigStore()
const activeTab = ref<'regular' | 'relief' | 'supervisor'>('regular')
const showCreateForm = ref(false)
const editingStaff = ref<Staff | null>(null)
const staffModalTab = ref<'details' | 'allocations'>('details')
const loading = ref(false)
const error = ref<string | null>(null)

// Form data
const newStaff = ref<CreateStaffForm>({
  name: '',
  category: 'REGULAR',
  isNightStaff: false,
  scheduleType: 'DAILY',
  daysOn: 4,
  daysOff: 4,
  shiftOffset: 0,
  zeroStartDateId: undefined,
  defaultStartTime: '08:00',
  defaultEndTime: '20:00',
  contractedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  runnerPoolId: null
})

// Day-based time scheduling (simplified)
const selectedDay = ref<DayOfWeek | null>(null)



// Allocation form state
const newAllocation = ref<CreateAllocationForm>({
  staffId: 0,
  departmentId: undefined,
  serviceId: undefined
})

const allocationType = ref<'department' | 'service'>('department')

const tabs = computed(() => [
  { key: 'regular', label: 'Regular', staff: configStore.regularStaff },
  { key: 'relief', label: 'Relief', staff: configStore.reliefStaff },
  { key: 'supervisor', label: 'Supervisors', staff: configStore.supervisorStaff }
])

const isEditing = computed(() => editingStaff.value !== null)
const formTitle = computed(() => isEditing.value ? 'Edit Staff Member' : 'Add Staff Member')

// Allocation computed properties
const currentStaffAllocations = computed(() => {
  if (!editingStaff.value) return []
  return configStore.allocations.filter(a => a.staffId === editingStaff.value?.id)
})

// Check if staff already has an allocation (for restricting to one allocation)
const hasExistingAllocation = computed(() => {
  return currentStaffAllocations.value.length > 0
})

// Computed properties for schedule type
const isShiftCycleSelected = computed(() => {
  return newStaff.value.scheduleType === 'SHIFT_CYCLE'
})

const availableZeroStartDates = computed(() => {
  return configStore.settings?.zeroStartDates || []
})

// Get the first available zero start date ID for defaults
const defaultZeroStartDateId = computed(() => {
  const dates = availableZeroStartDates.value
  return dates.length > 0 ? dates[0]?.id : undefined
})

// Helper function for day formatting (kept for compatibility)
function formatDayName(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3)
}



function getStaffScheduleDisplay(staff: Staff): string {
  if (staff.scheduleType === 'SHIFT_CYCLE') {
    if (staff.shiftPattern === 'ROTATING_DAY_NIGHT') {
      return `${staff.daysOn}/${staff.daysOff} Rotating Day/Night Shifts`
    } else {
      const shiftType = staff.isNightStaff ? 'Night' : 'Day'
      return `${staff.daysOn}/${staff.daysOff} ${shiftType} Shift Cycle (Group ${String.fromCharCode(65 + (staff.shiftOffset || 0) / (staff.daysOn || 4))})`
    }
  } else {
    return `${staff.defaultStartTime} - ${staff.defaultEndTime}`
  }
}

// Methods
function resetFormData() {
  newStaff.value = {
    name: '',
    category: 'REGULAR',
    isNightStaff: false,
    scheduleType: 'DAILY',
    daysOn: 4,
    daysOff: 4,
    shiftOffset: 0,
    zeroStartDateId: defaultZeroStartDateId.value,
    shiftPattern: 'FIXED',
    defaultStartTime: '08:00',
    defaultEndTime: '20:00',
    contractedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    runnerPoolId: null
  }
  selectedDay.value = null
  editingStaff.value = null
  staffModalTab.value = 'details'
  resetAllocationForm()
  error.value = null
}

function resetForm() {
  resetFormData()
  showCreateForm.value = false
}

function resetAllocationForm() {
  newAllocation.value = {
    staffId: 0,
    departmentId: undefined,
    serviceId: undefined
  }
  allocationType.value = 'department'
}

function openCreateForm() {
  resetFormData()
  showCreateForm.value = true
}

function openEditForm(staff: Staff) {
  editingStaff.value = staff
  newStaff.value = {
    name: staff.name,
    category: staff.category,
    isNightStaff: staff.isNightStaff,
    scheduleType: staff.scheduleType,
    daysOn: staff.daysOn,
    daysOff: staff.daysOff,
    shiftOffset: staff.shiftOffset,
    zeroStartDateId: staff.zeroStartDateId,
    shiftPattern: staff.shiftPattern,
    defaultStartTime: staff.defaultStartTime,
    defaultEndTime: staff.defaultEndTime,
    contractedDays: [...staff.contractedDays],
    runnerPoolId: staff.runnerPoolId
  }

  // Reset day selection
  selectedDay.value = null

  showCreateForm.value = true
}

async function saveStaff() {
  if (!newStaff.value.name.trim()) {
    error.value = 'Staff name is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Clean up data based on schedule type
    const staffData = {
      ...newStaff.value
    }

    // For DAILY schedules, remove shift cycle fields
    if (staffData.scheduleType === 'DAILY') {
      delete staffData.daysOn
      delete staffData.daysOff
      delete staffData.shiftOffset
      delete staffData.zeroStartDateId
    }
    // For SHIFT_CYCLE schedules, remove contracted days
    else if (staffData.scheduleType === 'SHIFT_CYCLE') {
      staffData.contractedDays = []
    }



    if (isEditing.value && editingStaff.value) {
      await configStore.updateStaff(editingStaff.value.id, staffData)
    } else {
      await configStore.createStaff(staffData)
    }
    resetForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save staff member'
  } finally {
    loading.value = false
  }
}

async function deleteStaff(staff: Staff) {
  if (!confirm(`Are you sure you want to delete ${staff.name}?`)) {
    return
  }

  try {
    await configStore.deleteStaff(staff.id)
    // Clean up localStorage for this staff member
    try {
      localStorage.removeItem(getStaffTimesStorageKey(staff.id))
    } catch (error) {
      console.warn('Failed to clean up staff times from localStorage:', error)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete staff member'
  }
}

// Simplified day click handler (no longer needed with new component)
function handleDayClick(day: string) {
  // This function is kept for compatibility but may be removed
  // The new StaffDaySelection component handles day selection
}



async function createAllocation() {
  if (!editingStaff.value) {
    error.value = 'No staff member selected'
    return
  }

  // Check if staff already has an allocation
  if (hasExistingAllocation.value) {
    error.value = 'Staff member already has an allocation. Remove the existing allocation first.'
    return
  }

  const selectedId = allocationType.value === 'department'
    ? newAllocation.value.departmentId
    : newAllocation.value.serviceId

  if (!selectedId) {
    error.value = `Please select a ${allocationType.value}`
    return
  }

  loading.value = true
  error.value = null

  try {
    newAllocation.value.staffId = editingStaff.value.id
    await configStore.createAllocation(newAllocation.value)
    resetAllocationForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create allocation'
  } finally {
    loading.value = false
  }
}

async function deleteAllocation(id: number) {
  if (!confirm('Are you sure you want to delete this allocation?')) {
    return
  }

  try {
    await configStore.deleteAllocation(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete allocation'
  }
}



// Schedule type change handler
function onScheduleTypeChange() {
  if (newStaff.value.scheduleType === 'DAILY') {
    // Reset shift cycle fields
    newStaff.value.daysOn = undefined
    newStaff.value.daysOff = undefined
    newStaff.value.shiftOffset = undefined
    newStaff.value.zeroStartDateId = undefined
  } else if (newStaff.value.scheduleType === 'SHIFT_CYCLE') {
    // Set default shift cycle values and clear contracted days
    newStaff.value.daysOn = 4
    newStaff.value.daysOff = 4
    newStaff.value.shiftOffset = 0
    newStaff.value.zeroStartDateId = defaultZeroStartDateId.value
    newStaff.value.contractedDays = []
  }
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Watch for category changes to set appropriate defaults
watch(() => newStaff.value.category, (newCategory) => {
  if (newCategory === 'SUPERVISOR') {
    // Default supervisors to shift cycle with rotating pattern
    newStaff.value.scheduleType = 'SHIFT_CYCLE'
    newStaff.value.shiftPattern = 'ROTATING_DAY_NIGHT'
    newStaff.value.isNightStaff = false // Not relevant for rotating
  } else {
    // Reset to defaults for regular/relief staff
    newStaff.value.shiftPattern = 'FIXED'
  }
})

// Initialize data on component mount
onMounted(() => {
  configStore.fetchAllData()
})
</script>

<template>
  <article class="config-content">
    <header class="content-header">
      <h2>Staff Management</h2>
    </header>

    <!-- Staff Form Modal -->
    <Modal :show="showCreateForm" :title="formTitle" size="lg" @close="resetForm">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Modal Tabs -->
      <div class="modal-tabs">
        <button
          type="button"
          @click="staffModalTab = 'details'"
          class="tab"
          :class="{ active: staffModalTab === 'details' }"
        >
          Staff Details
        </button>
        <button
          type="button"
          @click="staffModalTab = 'allocations'"
          class="tab"
          :class="{ active: staffModalTab === 'allocations' }"
          :disabled="!isEditing"
        >
          Allocations
        </button>
      </div>

      <!-- Staff Details Tab -->
      <div v-if="staffModalTab === 'details'" class="staff-details-content">
        <form @submit.prevent="saveStaff" class="staff-form">

          <!-- Basic Information Section -->
          <div class="form-section">
            <h3 class="section-title">Basic Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Staff Name</label>
                <input
                  v-model="newStaff.name"
                  type="text"
                  class="form-input"
                  placeholder="Enter full name"
                  required
                >
              </div>

              <div class="form-group">
                <label class="form-label">Category</label>
                <select v-model="newStaff.category" class="form-select" required>
                  <option value="REGULAR">Regular Staff</option>
                  <option value="RELIEF">Relief Staff</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="newStaff.isNightStaff"
                  type="checkbox"
                  class="checkbox"
                >
                <span class="checkbox-text">Night Shift Worker</span>
              </label>
              <p class="form-help">Enable this for staff members who primarily work night shifts</p>
            </div>
          </div>

          <!-- Schedule Configuration Section -->
          <div class="form-section">
            <h3 class="section-title">Schedule Configuration</h3>

            <div class="form-group">
              <label class="form-label">Schedule Type</label>
              <div class="schedule-type-options">
                <label class="radio-option">
                  <input
                    v-model="newStaff.scheduleType"
                    type="radio"
                    value="DAILY"
                    @change="onScheduleTypeChange"
                  >
                  <div class="radio-content">
                    <span class="radio-title">Daily Schedule</span>
                    <span class="radio-description">Fixed days each week</span>
                  </div>
                </label>
                <label class="radio-option">
                  <input
                    v-model="newStaff.scheduleType"
                    type="radio"
                    value="SHIFT_CYCLE"
                    @change="onScheduleTypeChange"
                  >
                  <div class="radio-content">
                    <span class="radio-title">Shift Cycle</span>
                    <span class="radio-description">Rotating pattern (e.g., 4 on / 4 off)</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- Supervisor Shift Pattern Configuration -->
            <div v-if="newStaff.category === 'SUPERVISOR'" class="form-section">
              <h4 class="subsection-title">Supervisor Shift Pattern</h4>
              <div class="form-group">
                <label class="form-label">Shift Pattern</label>
                <select v-model="newStaff.shiftPattern" class="form-select" required>
                  <option value="FIXED">Fixed Day/Night Shift</option>
                  <option value="ROTATING_DAY_NIGHT">Rotating Day/Night Shifts</option>
                </select>
                <p class="form-help">
                  <strong>Fixed:</strong> Works either day shifts OR night shifts only<br>
                  <strong>Rotating:</strong> Alternates between day and night shifts (4 day → 4 off → 4 night → 4 off)
                </p>
              </div>

              <!-- Show isNightStaff only for FIXED pattern -->
              <div v-if="newStaff.shiftPattern === 'FIXED'" class="form-group">
                <label class="checkbox-label">
                  <input
                    v-model="newStaff.isNightStaff"
                    type="checkbox"
                    class="form-checkbox"
                  >
                  Night Staff
                </label>
                <p class="form-help">Check if this supervisor works night shifts only</p>
              </div>

              <!-- Show rotation info for ROTATING pattern -->
              <div v-if="newStaff.shiftPattern === 'ROTATING_DAY_NIGHT'" class="rotation-info">
                <div class="info-card">
                  <h5>Rotation Pattern</h5>
                  <div class="pattern-display">
                    <div class="pattern-step day-shift">4 Days (Day Shift)</div>
                    <div class="pattern-arrow">→</div>
                    <div class="pattern-step off-duty">4 Days Off</div>
                    <div class="pattern-arrow">→</div>
                    <div class="pattern-step night-shift">4 Nights (Night Shift)</div>
                    <div class="pattern-arrow">→</div>
                    <div class="pattern-step off-duty">4 Days Off</div>
                    <div class="pattern-arrow">→</div>
                    <div class="pattern-repeat">Repeat...</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shift Cycle Configuration -->
            <div v-if="isShiftCycleSelected" class="shift-cycle-section">
              <h4 class="subsection-title">Rotation Pattern</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Days On Duty</label>
                  <input v-model.number="newStaff.daysOn" type="number" min="1" max="14" class="form-input" required>
                  <p class="form-help">Number of consecutive working days</p>
                </div>
                <div class="form-group">
                  <label class="form-label">Days Off Duty</label>
                  <input v-model.number="newStaff.daysOff" type="number" min="1" max="14" class="form-input" required>
                  <p class="form-help">Number of consecutive days off</p>
                </div>
              </div>

              <h4 class="subsection-title">Group Assignment</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Group Offset</label>
                  <input v-model.number="newStaff.shiftOffset" type="number" min="0" class="form-input" required>
                  <p class="form-help">0 = Group A, {{ newStaff.daysOn }} = Group B, etc.</p>
                </div>
                <div class="form-group">
                  <label class="form-label">Zero Start Date</label>
                  <select v-model="newStaff.zeroStartDateId" class="form-select" required>
                    <option v-if="availableZeroStartDates.length === 0" value="" disabled>
                      No zero start dates configured
                    </option>
                    <option v-for="zsd in availableZeroStartDates" :key="zsd.id" :value="zsd.id">
                      {{ zsd.name }} ({{ zsd.date }})
                    </option>
                  </select>
                  <p v-if="availableZeroStartDates.length === 0" class="form-help text-error">
                    Configure zero start dates in Settings first
                  </p>
                </div>
              </div>

              <h4 class="subsection-title">Default Shift Times</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Start Time</label>
                  <input v-model="newStaff.defaultStartTime" type="time" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">End Time</label>
                  <input v-model="newStaff.defaultEndTime" type="time" class="form-input" required>
                </div>
              </div>
            </div>

            <!-- Daily Schedule Configuration -->
            <div v-if="!isShiftCycleSelected" class="daily-schedule-section">
              <!-- Staff Day Selection Component -->
              <StaffDaySelection
                v-model:contracted-days="newStaff.contractedDays"
                :disabled="loading"
              />

              <h4 class="subsection-title">Default Working Hours</h4>
              <p class="form-help">Set default times for all working days</p>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Default Start Time</label>
                  <input v-model="newStaff.defaultStartTime" type="time" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Default End Time</label>
                  <input v-model="newStaff.defaultEndTime" type="time" class="form-input" required>
                </div>
              </div>
            </div>
          </div>



          <!-- Runner Pool Assignment Section -->
          <div class="form-section">
            <h3 class="section-title">Runner Pool Assignment</h3>
            <p class="form-help">Assign this staff member to a runner pool for hospital-wide duties</p>

            <div class="form-group">
              <label class="form-label">Runner Pool</label>
              <select v-model="newStaff.runnerPoolId" class="form-select">
                <option :value="null">No runner pool assignment</option>
                <option v-for="pool in configStore.runnerPools" :key="pool.id" :value="pool.id">
                  {{ pool.name }}
                  <span v-if="pool.description"> - {{ pool.description }}</span>
                </option>
              </select>
              <p class="form-help">
                Runner pool staff are available hospital-wide for patient transfers, sample delivery, and general support.
                They can be temporarily allocated to specific departments or services as needed.
              </p>
            </div>
          </div>
        </form>
      </div>

      <!-- Staff Allocations Tab -->
      <div v-if="staffModalTab === 'allocations'" class="allocations-tab">
        <div class="allocations-section">
          <h3>Current Allocation</h3>
          <div v-if="currentStaffAllocations.length === 0" class="empty-state">
            <p>No allocation set for this staff member.</p>
            <p class="form-help">Staff members must be allocated to either a department or service to appear on the homepage.</p>
          </div>
          <div v-else class="current-allocation">
            <div class="allocation-card">
              <div class="allocation-info">
                <h4 v-if="currentStaffAllocations[0].departments">{{ currentStaffAllocations[0].departments.name }}</h4>
                <h4 v-else-if="currentStaffAllocations[0].services">{{ currentStaffAllocations[0].services.name }}</h4>
                <p class="allocation-type">
                  {{ currentStaffAllocations[0].departments ? 'Department' : 'Service' }} allocation - schedule configured in staff details
                </p>
              </div>
              <button @click="deleteAllocation(currentStaffAllocations[0].id)" class="btn btn-danger btn-sm">
                Change Allocation
              </button>
            </div>
          </div>
        </div>

        <div v-if="!hasExistingAllocation" class="add-allocation-section">
          <h3>Set Allocation</h3>
          <p class="form-help">Allocate this staff member to either a department or service. Staff can only be allocated to one location at a time.</p>
          <form @submit.prevent="createAllocation" class="form">
            <div class="form-group">
              <label class="form-label">Allocation Type</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input
                    type="radio"
                    v-model="allocationType"
                    value="department"
                    @change="newAllocation.serviceId = undefined"
                  />
                  <span>Department</span>
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    v-model="allocationType"
                    value="service"
                    @change="newAllocation.departmentId = undefined"
                  />
                  <span>Service</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                {{ allocationType === 'department' ? 'Department' : 'Service' }}
              </label>
              <select
                v-if="allocationType === 'department'"
                v-model="newAllocation.departmentId"
                class="form-select"
                required
              >
                <option :value="undefined">Select department...</option>
                <option v-for="dept in configStore.departments" :key="dept.id" :value="dept.id">
                  {{ dept.name }}
                </option>
              </select>
              <select
                v-else
                v-model="newAllocation.serviceId"
                class="form-select"
                required
              >
                <option :value="undefined">Select service...</option>
                <option v-for="service in configStore.services" :key="service.id" :value="service.id">
                  {{ service.name }}
                </option>
              </select>
              <p class="form-help">Staff can only be allocated to one location at a time.</p>
            </div>



            <button type="submit" :disabled="loading" class="btn btn-primary">
              <LoadingSpinner v-if="loading" size="sm" />
              {{ loading ? 'Adding...' : 'Add Allocation' }}
            </button>
          </form>
        </div>
      </div>

      <template #footer>
        <button type="button" @click="resetForm" class="btn">Cancel</button>
        <button
          v-if="staffModalTab === 'details'"
          @click="saveStaff"
          :disabled="loading"
          class="btn btn-primary"
        >
          <LoadingSpinner v-if="loading" size="sm" />
          {{ loading ? 'Saving...' : (isEditing ? 'Update Staff' : 'Create Staff') }}
        </button>
        <button
          v-if="staffModalTab === 'allocations' && isEditing"
          @click="saveStaff"
          :disabled="loading"
          class="btn btn-primary"
        >
          <LoadingSpinner v-if="loading" size="sm" />
          {{ loading ? 'Updating...' : 'Update Staff' }}
        </button>
      </template>
    </Modal>

    <div class="staff-header">
      <div class="staff-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="{ active: activeTab === tab.key }"
          class="tab-button"
        >
          {{ tab.label }} ({{ tab.staff.length }})
        </button>
      </div>
      <div class="staff-header-actions">
        <button @click="openCreateForm" class="btn-primary">Add Staff Member</button>
      </div>
    </div>

    <div v-if="configStore.loading">
      <p>Loading staff...</p>
    </div>

    <div v-else-if="configStore.error">
      <p>{{ configStore.error }}</p>
    </div>

    <section v-else>
      <section
        v-for="tab in tabs"
        :key="tab.key"
        v-show="activeTab === tab.key"
      >
        <div v-if="tab.staff.length === 0">
          <p>No {{ tab.label.toLowerCase() }} staff members yet.</p>
          <button @click="openCreateForm">Add {{ tab.label }} Staff Member</button>
        </div>

        <div v-else class="staff-grid">
          <div
            v-for="staff in tab.staff"
            :key="staff.id"
            class="staff-card"
          >
            <div class="staff-info">
              <h3>{{ staff.name }}</h3>
              <div v-if="staff.allocations && staff.allocations.length > 0" class="staff-allocations">
                <template v-for="(allocation, index) in staff.allocations" :key="allocation.id">
                  <span v-if="allocation.departments">{{ allocation.departments.name }}</span>
                  <span v-else-if="allocation.services">{{ allocation.services.name }}</span>
                  <span v-if="index < staff.allocations.length - 1">, </span>
                </template>
              </div>
            </div>
            <div class="staff-actions">
              <button @click="openEditForm(staff)" class="icon-btn edit-btn" title="Edit Staff">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button @click="deleteStaff(staff)" class="icon-btn delete-btn" title="Delete Staff">
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
    </section>
  </article>
</template>

<style scoped>

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.staff-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.staff-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.staff-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.staff-actions button {
  border-radius: 4px;
}

.staff-actions button svg {
  color: #9ca3af;
}

.staff-allocations {
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

.staff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.staff-tabs {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.staff-header-actions {
  flex-shrink: 0;
}

.tab-button {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.tab-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.tab-button.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* Staff Modal Styling */
.staff-details-content {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.modal-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
}

.modal-tabs .tab {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.875rem;
}

.modal-tabs .tab:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.modal-tabs .tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.modal-tabs .tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f3f4f6;
}

/* Enhanced Form Styling */
.staff-form {
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

/* Schedule Type Options */
.schedule-type-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.5rem;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.radio-option:hover {
  border-color: #3b82f6;
  background: #f8faff;
}

.radio-option input[type="radio"] {
  margin-top: 0.125rem;
  accent-color: #3b82f6;
}

.radio-option input[type="radio"]:checked + .radio-content {
  color: #3b82f6;
}

.radio-option:has(input:checked) {
  border-color: #3b82f6;
  background: #f0f7ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.radio-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.radio-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}

.radio-description {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.3;
}

/* Shift Cycle Section */
.shift-cycle-section {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

/* Daily Schedule Section */
.daily-schedule-section {
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

.text-error {
  color: #dc2626 !important;
}

/* Allocation Section */
.allocation-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.allocation-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.allocation-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.allocation-item {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.allocation-info {
  flex: 1;
}

.allocation-info h4 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #374151;
}

.allocation-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.allocation-actions {
  display: flex;
  gap: 0.5rem;
}

/* Radio button styling */
.radio-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.radio-option input[type="radio"] {
  margin: 0;
}

.radio-option:hover {
  color: var(--color-primary);
}

/* Current allocation styling */
.current-allocation .allocation-card {
  background: #f0f9ff;
  border-color: #0ea5e9;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-state p {
  margin: 0.5rem 0;
}

/* Supervisor shift pattern styles */
.rotation-info {
  margin-top: 1rem;
}

.info-card {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
}

.pattern-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.pattern-step {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  min-width: 80px;
}

.pattern-step.day-shift {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  color: #92400e;
}

.pattern-step.night-shift {
  background: #e0e7ff;
  border: 1px solid #6366f1;
  color: #3730a3;
}

.pattern-step.off-duty {
  background: #f3f4f6;
  border: 1px solid #9ca3af;
  color: #374151;
}

.pattern-arrow {
  font-size: 1.25rem;
  color: #6b7280;
  font-weight: bold;
}

.pattern-repeat {
  font-style: italic;
  color: #6b7280;
  font-size: 0.875rem;
}
</style>



