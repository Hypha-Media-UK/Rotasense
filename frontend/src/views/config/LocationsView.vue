<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Modal from '@/components/Modal.vue'
import DayConfiguration from '@/components/config/DayConfiguration.vue'
import type { CreateBuildingForm, CreateDepartmentForm, Building, Department, DayOfWeek, CreateMinimumStaffPeriodForm } from '@/types'

const configStore = useConfigStore()

const buildingsWithDepartments = computed(() => configStore.departmentsByBuilding)

// Form state
const showBuildingForm = ref(false)
const showBuildingView = ref(false)
const showDepartmentForm = ref(false)
const editingBuilding = ref<Building | null>(null)
const viewingBuilding = ref<Building | null>(null)
const editingDepartment = ref<Department | null>(null)
const selectedBuildingForDept = ref<number | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Form data
const newBuilding = ref<CreateBuildingForm>({
  name: ''
})

const newDepartment = ref<CreateDepartmentForm>({
  name: '',
  buildingId: 0,
  is24x7: false,
  operationalDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startTime: '08:00',
  endTime: '20:00',
  minStaff: 2,
  displayOnHome: false
})

// Day-based time scheduling for departments
const selectedDeptDay = ref<DayOfWeek | null>(null)
const deptDayTimes = ref<Record<string, { startTime: string; endTime: string }>>({})
const currentDeptDayTimes = ref({ startTime: '08:00', endTime: '20:00' })

// Bulk day selection for operating hours
const selectedDaysForBulk = ref<Set<DayOfWeek>>(new Set())
const bulkTimeMode = ref(false)
const bulkStartTime = ref('08:00')
const bulkEndTime = ref('20:00')

// Helper functions for localStorage persistence
function getDeptTimesStorageKey(departmentId: number): string {
  return `rotasense_dept_times_${departmentId}`
}

function saveDeptTimesToStorage(departmentId: number, times: Record<string, { startTime: string; endTime: string }>) {
  try {
    localStorage.setItem(getDeptTimesStorageKey(departmentId), JSON.stringify(times))
  } catch (error) {
    console.warn('Failed to save department times to localStorage:', error)
  }
}

function loadDeptTimesFromStorage(departmentId: number): Record<string, { startTime: string; endTime: string }> {
  try {
    const stored = localStorage.getItem(getDeptTimesStorageKey(departmentId))
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.warn('Failed to load department times from localStorage:', error)
    return {}
  }
}



const isBuildingEditing = computed(() => editingBuilding.value !== null)
const isDepartmentEditing = computed(() => editingDepartment.value !== null)
const buildingFormTitle = computed(() => isBuildingEditing.value ? 'Edit Building' : 'Add Building')
const departmentFormTitle = computed(() => isDepartmentEditing.value ? 'Edit Department' : 'Add Department')



// Department day selection and time management
function selectDeptDay(day: DayOfWeek) {
  if (selectedDeptDay.value === day) {
    selectedDeptDay.value = null
  } else {
    selectedDeptDay.value = day
    const dayTime = deptDayTimes.value[day]
    if (dayTime) {
      currentDeptDayTimes.value = { ...dayTime }
    } else {
      currentDeptDayTimes.value = {
        startTime: newDepartment.value.startTime || '08:00',
        endTime: newDepartment.value.endTime || '20:00'
      }
    }
  }
}

function updateDeptDayTimes() {
  if (selectedDeptDay.value) {
    deptDayTimes.value[selectedDeptDay.value] = { ...currentDeptDayTimes.value }

    // Update the department's base times to match the current day's times
    // This ensures the changes persist when saved
    newDepartment.value.startTime = currentDeptDayTimes.value.startTime
    newDepartment.value.endTime = currentDeptDayTimes.value.endTime

    // Save to localStorage if editing an existing department
    if (editingDepartment.value) {
      saveDeptTimesToStorage(editingDepartment.value.id, deptDayTimes.value)
    }
  }
}

function formatDayName(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3)
}

function getDayTimeDisplay(day: DayOfWeek): string {
  // Check if there's a specific time set for this day
  const dayTime = deptDayTimes.value[day]
  if (dayTime) {
    return `${dayTime.startTime}-${dayTime.endTime}`
  }

  // Fall back to department default times
  const startTime = newDepartment.value.startTime || '08:00'
  const endTime = newDepartment.value.endTime || '20:00'
  return `${startTime}-${endTime}`
}

function hasDaySpecificTime(day: DayOfWeek): boolean {
  return !!deptDayTimes.value[day]
}

function getDepartmentScheduleDisplay(department: Department): string {
  return `${department.startTime} - ${department.endTime}`
}

// Building methods
function resetBuildingFormData() {
  newBuilding.value = { name: '' }
  editingBuilding.value = null
  error.value = null
}

function resetBuildingForm() {
  resetBuildingFormData()
  showBuildingForm.value = false
}

function openBuildingForm() {
  resetBuildingFormData()
  showBuildingForm.value = true
}

function openEditBuildingForm(building: Building) {
  editingBuilding.value = building
  newBuilding.value = { name: building.name }
  showBuildingForm.value = true
}

function openBuildingModal(building: Building) {
  viewingBuilding.value = building
  showBuildingView.value = true
}

function closeBuildingView() {
  viewingBuilding.value = null
  showBuildingView.value = false
}

function openDepartmentFormFromBuilding() {
  if (viewingBuilding.value) {
    openDepartmentForm(viewingBuilding.value.id)
  }
}

function editBuildingFromView() {
  if (viewingBuilding.value) {
    closeBuildingView()
    openEditBuildingForm(viewingBuilding.value)
  }
}

async function deleteBuildingFromView() {
  if (viewingBuilding.value && confirm(`Are you sure you want to delete "${viewingBuilding.value.name}"? This will also delete all departments in this building.`)) {
    await deleteBuilding(viewingBuilding.value)
    closeBuildingView()
  }
}

async function saveBuilding() {
  if (!newBuilding.value.name.trim()) {
    error.value = 'Building name is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    if (isBuildingEditing.value && editingBuilding.value) {
      await configStore.updateBuilding(editingBuilding.value.id, newBuilding.value)
    } else {
      await configStore.createBuilding(newBuilding.value)
    }
    resetBuildingForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save building'
  } finally {
    loading.value = false
  }
}

async function deleteBuilding(building: Building) {
  if (building.departments.length > 0) {
    error.value = 'Cannot delete building with departments. Please delete departments first.'
    return
  }

  if (!confirm(`Are you sure you want to delete ${building.name}?`)) {
    return
  }

  try {
    await configStore.deleteBuilding(building.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete building'
  }
}

// Department methods
function resetDepartmentFormData() {
  newDepartment.value = {
    name: '',
    buildingId: 0,
    is24x7: false,
    operationalDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '08:00',
    endTime: '20:00',
    minStaff: 2,
    displayOnHome: false
  }
  selectedDeptDay.value = null
  deptDayTimes.value = {}
  currentDeptDayTimes.value = { startTime: '08:00', endTime: '20:00' }
  editingDepartment.value = null
  selectedBuildingForDept.value = null
  error.value = null

  // Reset bulk selection state
  selectedDaysForBulk.value.clear()
  bulkTimeMode.value = false
  bulkStartTime.value = '08:00'
  bulkEndTime.value = '20:00'
}

function resetDepartmentForm() {
  resetDepartmentFormData()
  showDepartmentForm.value = false
}

function openDepartmentForm(buildingId?: number) {
  resetDepartmentFormData()
  if (buildingId) {
    newDepartment.value.buildingId = buildingId
    selectedBuildingForDept.value = buildingId
  }
  showDepartmentForm.value = true
}

function openEditDepartmentForm(department: Department) {
  editingDepartment.value = department
  newDepartment.value = {
    name: department.name,
    buildingId: department.buildingId,
    is24x7: department.is24x7,
    operationalDays: [...department.operationalDays],
    startTime: department.startTime,
    endTime: department.endTime,
    minStaff: department.minStaff,
    displayOnHome: department.displayOnHome
  }

  // Load saved per-day times from localStorage
  deptDayTimes.value = loadDeptTimesFromStorage(department.id)

  // Reset day selection
  selectedDeptDay.value = null
  currentDeptDayTimes.value = { startTime: department.startTime || '08:00', endTime: department.endTime || '20:00' }

  // Reset bulk selection state
  selectedDaysForBulk.value.clear()
  bulkTimeMode.value = false
  bulkStartTime.value = department.startTime || '08:00'
  bulkEndTime.value = department.endTime || '20:00'

  showDepartmentForm.value = true
}

async function saveDepartment() {
  if (!newDepartment.value.name.trim()) {
    error.value = 'Department name is required'
    return
  }

  if (!newDepartment.value.buildingId) {
    error.value = 'Please select a building'
    return
  }

  loading.value = true
  error.value = null

  try {
    // For now, just use the default times (per-day scheduling can be added later)
    const departmentData = {
      ...newDepartment.value
    }

    if (isDepartmentEditing.value && editingDepartment.value) {
      await configStore.updateDepartment(editingDepartment.value.id, departmentData)
    } else {
      await configStore.createDepartment(departmentData)
    }
    resetDepartmentForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save department'
  } finally {
    loading.value = false
  }
}

async function deleteDepartment(department: Department) {
  if (!confirm(`Are you sure you want to delete ${department.name}?`)) {
    return
  }

  try {
    await configStore.deleteDepartment(department.id)
    // Clean up localStorage for this department
    try {
      localStorage.removeItem(getDeptTimesStorageKey(department.id))
    } catch (error) {
      console.warn('Failed to clean up department times from localStorage:', error)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete department'
  }
}

// Minimum Staff Period handlers
async function handleAddMinimumStaffPeriod(periodData: CreateMinimumStaffPeriodForm) {
  try {
    await configStore.createMinimumStaffPeriod(periodData)
    // Refresh the department data to get updated periods
    await configStore.fetchAllData()
    // Update the editingDepartment ref with fresh data
    if (editingDepartment.value) {
      const updatedDept = configStore.departments.find(d => d.id === editingDepartment.value!.id)
      if (updatedDept) {
        editingDepartment.value = updatedDept
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to add minimum staff period'
  }
}

async function handleUpdateMinimumStaffPeriod(id: number, periodData: Partial<CreateMinimumStaffPeriodForm>) {
  try {
    await configStore.updateMinimumStaffPeriod(id, periodData)
    // Refresh the department data to get updated periods
    await configStore.fetchAllData()
    // Update the editingDepartment ref with fresh data
    if (editingDepartment.value) {
      const updatedDept = configStore.departments.find(d => d.id === editingDepartment.value!.id)
      if (updatedDept) {
        editingDepartment.value = updatedDept
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update minimum staff period'
  }
}

async function handleDeleteMinimumStaffPeriod(id: number) {
  try {
    await configStore.deleteMinimumStaffPeriod(id)
    // Refresh the department data to get updated periods
    await configStore.fetchAllData()
    // Update the editingDepartment ref with fresh data
    if (editingDepartment.value) {
      const updatedDept = configStore.departments.find(d => d.id === editingDepartment.value!.id)
      if (updatedDept) {
        editingDepartment.value = updatedDept
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete minimum staff period'
  }
}

function handleDeptDayClick(day: string) {
  // If in bulk mode, don't use the old single-day logic
  if (bulkTimeMode.value) {
    return
  }

  const dayOfWeek = day as DayOfWeek
  const isOperational = newDepartment.value.operationalDays.includes(dayOfWeek)

  if (isOperational) {
    // If already selected for editing, deactivate the day
    if (selectedDeptDay.value === dayOfWeek) {
      // Second click: deactivate the day
      const index = newDepartment.value.operationalDays.indexOf(dayOfWeek)
      if (index > -1) {
        newDepartment.value.operationalDays.splice(index, 1)
        selectedDeptDay.value = null
        delete deptDayTimes.value[dayOfWeek]
      }
    } else {
      // First click: select for time editing
      selectDeptDay(dayOfWeek)
    }
  } else {
    // If not operational, add to operational days and select for time editing
    newDepartment.value.operationalDays.push(dayOfWeek)
    selectDeptDay(dayOfWeek)
  }
}

// Bulk day selection functions
function toggleBulkMode() {
  bulkTimeMode.value = !bulkTimeMode.value
  if (bulkTimeMode.value) {
    // When entering bulk mode, clear single day selection
    selectedDeptDay.value = null
    // Initialize bulk times with current default
    bulkStartTime.value = newDepartment.value.startTime || '08:00'
    bulkEndTime.value = newDepartment.value.endTime || '20:00'
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
    if (!newDepartment.value.operationalDays.includes(day)) {
      newDepartment.value.operationalDays.push(day)
    }

    // Set the specific times for this day
    deptDayTimes.value[day] = {
      startTime: bulkStartTime.value,
      endTime: bulkEndTime.value
    }
  })

  // Update the department's base times to match the bulk times
  // This ensures the changes persist when saved
  newDepartment.value.startTime = bulkStartTime.value
  newDepartment.value.endTime = bulkEndTime.value

  // Save to localStorage if editing an existing department
  if (editingDepartment.value) {
    saveDeptTimesToStorage(editingDepartment.value.id, deptDayTimes.value)
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
      <h2>Buildings & Departments</h2>
      <div class="header-actions">
        <button @click="openDepartmentForm()" class="btn-primary">Add Department</button>
        <button @click="openBuildingForm">Add Building</button>
      </div>
    </header>

    <!-- Building Form Modal -->
    <Modal :show="showBuildingForm" :title="buildingFormTitle" size="sm" @close="resetBuildingForm">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="saveBuilding" class="form">
        <div class="form-group">
          <label class="form-label">Building Name</label>
          <input
            v-model="newBuilding.name"
            type="text"
            class="form-input"
            placeholder="Enter building name"
            required
          >
        </div>
      </form>

      <template #footer>
        <button type="button" @click="resetBuildingForm" class="btn">Cancel</button>
        <button @click="saveBuilding" :disabled="loading" class="btn btn-primary">
          <LoadingSpinner v-if="loading" size="sm" />
          {{ loading ? 'Saving...' : (isBuildingEditing ? 'Update Building' : 'Create Building') }}
        </button>
      </template>
    </Modal>

    <!-- Building View Modal -->
    <Modal :show="showBuildingView" :title="viewingBuilding?.name || 'Building Details'" size="lg" @close="closeBuildingView">
      <div v-if="viewingBuilding">
        <div class="building-view-header">
          <div class="building-view-info">
            <h3>{{ viewingBuilding.name }}</h3>
            <p>{{ viewingBuilding.departments.length }} department{{ viewingBuilding.departments.length !== 1 ? 's' : '' }}</p>
          </div>
          <div class="building-view-actions">
            <button @click="editBuildingFromView" class="icon-btn edit-btn" title="Edit Building">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button @click="deleteBuildingFromView" class="icon-btn delete-btn" title="Delete Building">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="departments-section">
          <div class="departments-header">
            <h4>Departments</h4>
            <button @click="openDepartmentFormFromBuilding" class="icon-btn add-btn" title="Add Department">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <div v-if="viewingBuilding.departments.length === 0" class="no-departments">
            <p>No departments in this building yet.</p>
            <button @click="openDepartmentFormFromBuilding" class="icon-btn add-btn" title="Add First Department">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <div v-else class="departments-list">
            <div
              v-for="department in viewingBuilding.departments"
              :key="department.id"
              class="department-item"
            >
              <div class="department-info">
                <h5>{{ department.name }}</h5>
                <div class="department-details">
                  <span>{{ getDepartmentScheduleDisplay(department) }}</span>
                  <span>{{ department.operationalDays.length }} days/week</span>
                  <span>Min {{ department.minStaff }} staff</span>
                  <span :class="department.displayOnHome ? 'status-active' : 'status-inactive'">
                    {{ department.displayOnHome ? 'Visible on Home' : 'Hidden from Home' }}
                  </span>
                </div>
              </div>
              <div class="department-actions">
                <button @click="openEditDepartmentForm(department)" class="icon-btn edit-btn" title="Edit Department">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button @click="deleteDepartment(department)" class="icon-btn delete-btn" title="Delete Department">
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
        </div>
      </div>

      <template #footer>
        <button @click="closeBuildingView" class="btn">Close</button>
      </template>
    </Modal>

    <!-- Department Form Modal -->
    <Modal :show="showDepartmentForm" :title="departmentFormTitle" size="lg" @close="resetDepartmentForm">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="department-form-content">
        <form @submit.prevent="saveDepartment" class="department-form">

          <!-- Basic Information Section -->
          <div class="form-section">
            <h3 class="section-title">Basic Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Department Name</label>
                <input
                  v-model="newDepartment.name"
                  type="text"
                  class="form-input"
                  placeholder="Enter department name"
                  required
                >
              </div>

              <div class="form-group">
                <label class="form-label">Building</label>
                <select v-model="newDepartment.buildingId" class="form-select" required>
                  <option value="0">Select building...</option>
                  <option v-for="building in configStore.buildings" :key="building.id" :value="building.id">
                    {{ building.name }}
                  </option>
                </select>
              </div>

              <div class="form-group form-group-checkbox">
                <label class="checkbox-label">
                  <input v-model="newDepartment.displayOnHome" type="checkbox" class="checkbox">
                  Display on homepage
                </label>
                <p class="form-help">Show this department on the homepage even when no staff are allocated</p>
              </div>
            </div>
          </div>

          <!-- Operating Hours Section -->
          <div class="form-section">
            <h3 class="section-title">Operating Hours</h3>
            <div class="form-group form-group-checkbox">
              <label class="checkbox-label">
                <input
                  v-model="newDepartment.is24x7"
                  type="checkbox"
                  class="checkbox"
                >
                24/7 Operation
              </label>
              <p class="form-help">Check this if the department operates 24 hours a day, 7 days a week.</p>
            </div>

            <!-- Day Configuration Component -->
            <DayConfiguration
              v-model:operational-days="newDepartment.operationalDays"
              v-model:default-start-time="newDepartment.startTime"
              v-model:default-end-time="newDepartment.endTime"
              :is24x7="newDepartment.is24x7"
              :periods="editingDepartment?.minimum_staff_periods || []"
              :department-id="editingDepartment?.id"
              @addPeriod="handleAddMinimumStaffPeriod"
              @updatePeriod="handleUpdateMinimumStaffPeriod"
              @deletePeriod="handleDeleteMinimumStaffPeriod"
            />
          </div>






        </form>
      </div>

      <template #footer>
        <button type="button" @click="resetDepartmentForm" class="btn">Cancel</button>
        <button @click="saveDepartment" :disabled="loading" class="btn btn-primary">
          <LoadingSpinner v-if="loading" size="sm" />
          {{ loading ? 'Saving...' : (isDepartmentEditing ? 'Update Department' : 'Create Department') }}
        </button>
      </template>
    </Modal>

    <div v-if="configStore.loading">
      <p>Loading locations...</p>
    </div>

    <div v-else-if="configStore.error">
      <p>{{ configStore.error }}</p>
    </div>

    <section v-else>
      <div v-if="buildingsWithDepartments.length === 0">
        <p>No buildings configured yet.</p>
        <button @click="openBuildingForm">Create Your First Building</button>
      </div>

      <div v-else class="buildings-grid">
        <div
          v-for="building in buildingsWithDepartments"
          :key="building.id"
          class="building-card"
        >
          <div class="building-info">
            <h3>{{ building.name }}</h3>
            <div class="building-details">
              {{ building.departments.length }} department{{ building.departments.length !== 1 ? 's' : '' }}
            </div>
          </div>
          <div class="building-actions">
            <button @click="openBuildingModal(building)" class="icon-btn view-btn" title="View Building">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
.buildings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.building-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.building-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.building-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.building-actions button {
  border-radius: 4px;
}

.building-actions button svg {
  color: #9ca3af;
}

.building-details {
  color: #9ca3af;
}

/* Icon button styles for modal */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.icon-btn.edit-btn:hover {
  color: #3b82f6;
  border-color: #3b82f6;
}

.icon-btn.delete-btn:hover {
  color: #ef4444;
  border-color: #ef4444;
}

.icon-btn.add-btn:hover {
  color: #059669;
  border-color: #059669;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

/* Building View Modal Styles */
.building-view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.building-view-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.building-view-info p {
  margin: 0;
  color: #6b7280;
}

.building-view-actions {
  display: flex;
  gap: 0.5rem;
}

.departments-section {
  margin-top: 1rem;
}

.departments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.departments-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.no-departments {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.departments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.department-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.department-info {
  flex: 1;
}

.department-info h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.department-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.department-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.status-active {
  color: #059669 !important;
  font-weight: 500;
}

.status-inactive {
  color: #dc2626 !important;
  font-weight: 500;
}

/* Department Modal Styling */
.department-form-content {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.department-form {
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group-checkbox {
  align-items: flex-start;
}

.form-group-checkbox .checkbox-label {
  align-self: flex-start;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.form-input,
.form-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
}

.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox:checked {
  background: #3b82f6;
  border-color: #3b82f6;
}

.form-help {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  line-height: 1.4;
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

/* Enhanced Days Grid Styling (matching staff modal) */
.daily-schedule-section {
  margin-top: 1.5rem;
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

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subsection-title::before {
  content: '';
  width: 3px;
  height: 1rem;
  background: #059669;
  border-radius: 2px;
}

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

/* Time Customization Styling (matching staff modal) */
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

.content-header h2 {
  text-align: left;
}

/* Override global article hover effects for config content */
.config-content:hover {
  transform: none !important;
  box-shadow: none !important;
  border-color: initial !important;
}
</style>




