<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Modal from '@/components/Modal.vue'
import type { CreateStaffForm, Staff, StaffCategory, ScheduleType, DayOfWeek, CreateAllocationForm, StaffAllocation, ZeroStartDate } from '@/types'

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
  scheduleType: 'DAILY',
  daysOn: 4,
  daysOff: 4,
  shiftOffset: 0,
  zeroStartDateId: undefined,
  defaultStartTime: '08:00',
  defaultEndTime: '20:00',
  contractedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
})

// Day-based time scheduling
const selectedDay = ref<DayOfWeek | null>(null)
const dayTimes = ref<Record<string, { startTime: string; endTime: string }>>({})
const currentDayTimes = ref({ startTime: '08:00', endTime: '20:00' })

// Allocation form state
const newAllocation = ref<CreateAllocationForm>({
  staffId: 0,
  departmentId: undefined,
  serviceId: undefined
})

const tabs = [
  { key: 'regular', label: 'Regular', staff: configStore.regularStaff },
  { key: 'relief', label: 'Relief', staff: configStore.reliefStaff },
  { key: 'supervisor', label: 'Supervisors', staff: configStore.supervisorStaff }
] as const

const isEditing = computed(() => editingStaff.value !== null)
const formTitle = computed(() => isEditing.value ? 'Edit Staff Member' : 'Add Staff Member')

// Allocation computed properties
const currentStaffAllocations = computed(() => {
  if (!editingStaff.value) return []
  return configStore.allocations.filter(a => a.staffId === editingStaff.value?.id)
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

// Day selection and time management
function selectDay(day: DayOfWeek) {
  if (selectedDay.value === day) {
    // Deactivate if clicking the same day
    selectedDay.value = null
  } else {
    // Activate new day and load its times
    selectedDay.value = day
    const dayTime = dayTimes.value[day]
    if (dayTime) {
      currentDayTimes.value = { ...dayTime }
    } else {
      currentDayTimes.value = {
        startTime: newStaff.value.defaultStartTime || '08:00',
        endTime: newStaff.value.defaultEndTime || '20:00'
      }
    }
  }
}

function updateDayTimes() {
  if (selectedDay.value) {
    dayTimes.value[selectedDay.value] = { ...currentDayTimes.value }
  }
}

function formatDayName(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3)
}

function getStaffScheduleDisplay(staff: Staff): string {
  if (staff.scheduleType === 'SHIFT_CYCLE') {
    return `${staff.daysOn}/${staff.daysOff} Shift Cycle (Group ${String.fromCharCode(65 + (staff.shiftOffset || 0) / (staff.daysOn || 4))})`
  } else {
    return `${staff.defaultStartTime} - ${staff.defaultEndTime}`
  }
}

// Methods
function resetForm() {
  newStaff.value = {
    name: '',
    category: 'REGULAR',
    scheduleType: 'DAILY',
    daysOn: 4,
    daysOff: 4,
    shiftOffset: 0,
    zeroStartDateId: defaultZeroStartDateId.value,
    defaultStartTime: '08:00',
    defaultEndTime: '20:00',
    contractedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  }
  selectedDay.value = null
  dayTimes.value = {}
  currentDayTimes.value = { startTime: '08:00', endTime: '20:00' }
  editingStaff.value = null
  showCreateForm.value = false
  staffModalTab.value = 'details'
  resetAllocationForm()
  error.value = null
}

function resetAllocationForm() {
  newAllocation.value = {
    staffId: 0,
    departmentId: undefined,
    serviceId: undefined
  }
}

function openCreateForm() {
  resetForm()
  showCreateForm.value = true
}

function openEditForm(staff: Staff) {
  editingStaff.value = staff
  newStaff.value = {
    name: staff.name,
    category: staff.category,
    scheduleType: staff.scheduleType,
    daysOn: staff.daysOn,
    daysOff: staff.daysOff,
    shiftOffset: staff.shiftOffset,
    zeroStartDateId: staff.zeroStartDateId,
    defaultStartTime: staff.defaultStartTime,
    defaultEndTime: staff.defaultEndTime,
    contractedDays: [...staff.contractedDays]
  }

  // Reset day selection and times
  selectedDay.value = null
  dayTimes.value = {}
  currentDayTimes.value = { startTime: staff.defaultStartTime || '08:00', endTime: staff.defaultEndTime || '20:00' }

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
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete staff member'
  }
}

function handleDayClick(day: string) {
  const dayOfWeek = day as DayOfWeek
  const isContracted = newStaff.value.contractedDays.includes(dayOfWeek)

  if (isContracted) {
    // If already selected for editing, deactivate the day
    if (selectedDay.value === dayOfWeek) {
      // Second click: deactivate the day
      const index = newStaff.value.contractedDays.indexOf(dayOfWeek)
      if (index > -1) {
        newStaff.value.contractedDays.splice(index, 1)
        selectedDay.value = null
        delete dayTimes.value[dayOfWeek]
      }
    } else {
      // First click: select for time editing
      selectDay(dayOfWeek)
    }
  } else {
    // If not contracted, add to contracted days and select for time editing
    newStaff.value.contractedDays.push(dayOfWeek)
    selectDay(dayOfWeek)
  }
}

async function createAllocation() {
  if (!editingStaff.value) {
    error.value = 'No staff member selected'
    return
  }

  if (!newAllocation.value.departmentId && !newAllocation.value.serviceId) {
    error.value = 'Please select a department or service'
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
</script>

<template>
  <div class="staff-view">
    <div class="staff-header">
      <h2 class="text-xl font-semibold">Staff Management</h2>
      <div class="actions">
        <button @click="openCreateForm" class="btn btn-primary">Add Staff Member</button>
      </div>
    </div>

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
      <div v-if="staffModalTab === 'details'">
        <form @submit.prevent="saveStaff" class="form">
        <!-- Name -->
        <div class="form-group">
          <label class="form-label">Name</label>
          <input
            v-model="newStaff.name"
            type="text"
            class="form-input"
            placeholder="Enter staff member name"
            required
          >
        </div>

        <!-- Category -->
        <div class="form-group">
          <label class="form-label">Category</label>
          <select v-model="newStaff.category" class="form-select" required>
            <option value="REGULAR">Regular</option>
            <option value="RELIEF">Relief</option>
            <option value="SUPERVISOR">Supervisor</option>
          </select>
        </div>

        <!-- Schedule Type -->
        <div class="form-group">
          <label class="form-label">Schedule Type</label>
          <select v-model="newStaff.scheduleType" @change="onScheduleTypeChange" class="form-select" required>
            <option value="DAILY">Daily Schedule (Fixed days each week)</option>
            <option value="SHIFT_CYCLE">Shift Cycle (Rotating pattern)</option>
          </select>
        </div>

        <!-- Shift Cycle Configuration (only for SHIFT_CYCLE) -->
        <div v-if="isShiftCycleSelected" class="shift-cycle-config">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Days On</label>
              <input v-model.number="newStaff.daysOn" type="number" min="1" max="14" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Days Off</label>
              <input v-model.number="newStaff.daysOff" type="number" min="1" max="14" class="form-input" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Group Offset</label>
              <input v-model.number="newStaff.shiftOffset" type="number" min="0" class="form-input" required>
              <p class="form-help">0 = Group A, 4 = Group B (for 4-on/4-off), etc.</p>
            </div>
            <div class="form-group">
              <label class="form-label">Zero Start Date</label>
              <select v-model="newStaff.zeroStartDateId" class="form-select" required>
                <option v-if="availableZeroStartDates.length === 0" value="" disabled>
                  No zero start dates configured - please add one in Settings
                </option>
                <option v-for="zsd in availableZeroStartDates" :key="zsd.id" :value="zsd.id">
                  {{ zsd.name }} ({{ zsd.date }})
                </option>
              </select>
              <p v-if="availableZeroStartDates.length === 0" class="form-help text-error">
                Please configure zero start dates in Settings before creating shift cycle staff.
              </p>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Shift Start Time</label>
              <input v-model="newStaff.defaultStartTime" type="time" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Shift End Time</label>
              <input v-model="newStaff.defaultEndTime" type="time" class="form-input" required>
            </div>
          </div>
        </div>

        <!-- Contracted Days (only for DAILY schedule) -->
        <div v-if="!isShiftCycleSelected" class="form-group">
          <label class="form-label">Contracted Days</label>
          <p class="form-help">Click to activate/select days. Click again to deactivate.</p>
          <div class="days-grid">
            <button
              v-for="day in daysOfWeek"
              :key="day"
              type="button"
              @click="handleDayClick(day)"
              class="day-button"
              :class="{
                active: newStaff.contractedDays.includes(day as any),
                selected: selectedDay === day && newStaff.contractedDays.includes(day as any)
              }"
            >
              {{ day.charAt(0).toUpperCase() + day.slice(1, 3) }}
            </button>
          </div>
        </div>

        <!-- Default Time Inputs for DAILY schedule -->
        <div v-if="!isShiftCycleSelected" class="form-group">
          <label class="form-label">Default Working Hours</label>
          <p class="form-help">Default times for all contracted days (can be customized per day below).</p>
          <div class="time-inputs">
            <div class="time-input">
              <label class="form-label">Default Start Time</label>
              <input v-model="newStaff.defaultStartTime" type="time" class="form-input" required>
            </div>
            <div class="time-input">
              <label class="form-label">Default End Time</label>
              <input v-model="newStaff.defaultEndTime" type="time" class="form-input" required>
            </div>
          </div>
        </div>

        <!-- Time Inputs for Selected Day -->
        <div v-if="selectedDay && newStaff.contractedDays.includes(selectedDay)" class="form-group">
          <label class="form-label">{{ formatDayName(selectedDay) }} Working Hours</label>
          <div class="time-inputs">
            <div class="time-input">
              <label class="form-label">Start Time</label>
              <input
                v-model="currentDayTimes.startTime"
                @input="updateDayTimes"
                type="time"
                class="form-input"
                required
              >
            </div>
            <div class="time-input">
              <label class="form-label">End Time</label>
              <input
                v-model="currentDayTimes.endTime"
                @input="updateDayTimes"
                type="time"
                class="form-input"
                required
              >
            </div>
          </div>
        </div>
        </form>
      </div>

      <!-- Staff Allocations Tab -->
      <div v-if="staffModalTab === 'allocations'" class="allocations-tab">
        <div class="allocations-section">
          <h3>Current Allocations</h3>
          <div v-if="currentStaffAllocations.length === 0" class="empty-state">
            No allocations for this staff member yet.
          </div>
          <div v-else class="allocations-list">
            <div v-for="allocation in currentStaffAllocations" :key="allocation.id" class="allocation-card">
              <div class="allocation-info">
                <h4 v-if="allocation.department">{{ allocation.department.name }}</h4>
                <h4 v-else-if="allocation.service">{{ allocation.service.name }}</h4>
                <p class="allocation-type">Assignment only - schedule configured in staff details</p>
              </div>
              <button @click="deleteAllocation(allocation.id)" class="btn btn-danger btn-sm">
                Remove
              </button>
            </div>
          </div>
        </div>

        <div class="add-allocation-section">
          <h3>Add New Allocation</h3>
          <p class="form-help">Allocate this staff member to a department, service, or shift type.</p>
          <form @submit.prevent="createAllocation" class="form">
            <div class="form-group">
              <label class="form-label">Allocate To</label>
              <div class="allocation-type-selector">
                <div class="form-group">
                  <label class="form-label">Department</label>
                  <select v-model="newAllocation.departmentId" class="form-select">
                    <option :value="undefined">Select department...</option>
                    <option v-for="dept in configStore.departments" :key="dept.id" :value="dept.id">
                      {{ dept.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Service</label>
                  <select v-model="newAllocation.serviceId" class="form-select">
                    <option :value="undefined">Select service...</option>
                    <option v-for="service in configStore.services" :key="service.id" :value="service.id">
                      {{ service.name }}
                    </option>
                  </select>
                </div>
              </div>
              <p class="form-help">Select either a department or service to assign this staff member to.</p>
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

    <!-- Staff Category Tabs -->
    <div class="staff-tabs">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="tab"
          :class="{ active: activeTab === tab.key }"
        >
          {{ tab.label }} ({{ tab.staff.length }})
        </button>
      </div>
    </div>

    <div v-if="configStore.loading" class="loading-state">
      <p>Loading staff...</p>
    </div>

    <div v-else-if="configStore.error" class="error-state">
      <p class="text-error">{{ configStore.error }}</p>
    </div>

    <div v-else class="staff-content">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        v-show="activeTab === tab.key"
        class="staff-list"
      >
        <div v-if="tab.staff.length === 0" class="empty-state">
          <p class="text-muted">No {{ tab.label.toLowerCase() }} staff members yet.</p>
          <button @click="openCreateForm" class="btn btn-primary">Add {{ tab.label }} Staff Member</button>
        </div>

        <div v-else class="staff-grid">
          <div
            v-for="staff in tab.staff"
            :key="staff.id"
            class="staff-card card"
          >
            <div class="staff-header">
              <h3 class="staff-name">{{ staff.name }}</h3>
              <div class="staff-actions">
                <button @click="openEditForm(staff)" class="btn btn-sm">Edit</button>
                <button @click="deleteStaff(staff)" class="btn btn-sm btn-danger">Delete</button>
              </div>
            </div>

            <div class="staff-details">
              <div class="staff-info">
                <span class="staff-hours">
                  {{ getStaffScheduleDisplay(staff) }}
                </span>
                <span class="staff-days">
                  {{ staff.scheduleType === 'SHIFT_CYCLE' ? 'Rotating Schedule' : `${staff.contractedDays.length} days/week` }}
                </span>
                <span class="staff-category">
                  {{ staff.category }}
                </span>
              </div>

              <div class="staff-allocations">
                <div v-if="!staff.allocations || staff.allocations.length === 0" class="no-allocations">
                  No allocations
                </div>
                <div v-else class="allocations-list">
                  <div v-for="allocation in staff.allocations" :key="allocation.id" class="allocation-item">
                    <div class="allocation-location">
                      <strong v-if="allocation.department">{{ allocation.department.name }}</strong>
                      <strong v-else-if="allocation.service">{{ allocation.service.name }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staff-view {
  display: grid;
  gap: var(--space-lg);
}

.staff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.actions {
  display: flex;
  gap: var(--space-sm);
}

.staff-tabs {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tabs {
  display: flex;
}

.tab {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  font-weight: 500;
}

.tab:hover {
  color: var(--color-text);
  background-color: var(--color-background);
}

.tab.active {
  color: var(--color-text);
  border-bottom-color: var(--color-primary);
  background-color: var(--color-background);
}

.loading-state,
.error-state {
  text-align: center;
  padding: var(--space-xl);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.staff-content {
  min-height: 200px;
}

.staff-list {
  display: grid;
  gap: var(--space-lg);
}



.staff-grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.staff-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.staff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.staff-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.staff-actions {
  display: flex;
  gap: var(--space-sm);
}

.staff-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.staff-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.staff-hours,
.staff-days,
.staff-category {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.staff-allocations {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
}

.no-allocations {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: var(--font-size-sm);
}

.allocations-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.allocation-item {
  padding: var(--space-xs);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.allocation-location {
  font-weight: 500;
  margin-bottom: var(--space-xs);
}

.allocation-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.allocation-days {
  text-transform: capitalize;
}

.allocation-time {
  font-family: var(--font-mono);
}

.allocation-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-md);
}

@media (max-width: 768px) {
  .allocation-type-selector {
    grid-template-columns: 1fr;
  }
}

.shift-type-info {
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin: var(--space-md) 0;
}

.shift-type-info .info-text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.btn-sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .staff-grid {
    grid-template-columns: 1fr;
  }

  .staff-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .staff-header .staff-actions {
    justify-content: center;
  }

  .staff-details {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .tabs {
    flex-direction: column;
  }

  .tab {
    text-align: center;
  }
}

/* Modal Form Styles */
.error-message {
  padding: var(--space-sm);
  background-color: var(--color-error-bg);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-md);
}

.form {
  display: grid;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-label {
  font-weight: 500;
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

.form-input,
.form-select {
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.time-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.time-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

/* Shift cycle configuration */
.shift-cycle-config {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-top: var(--space-sm);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.btn-danger {
  background-color: var(--color-error);
  color: var(--color-text-inverse);
}

.btn-danger:hover {
  background-color: var(--color-error-hover);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .time-range {
    grid-template-columns: 1fr;
  }
}
</style>
