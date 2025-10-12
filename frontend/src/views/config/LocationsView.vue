<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Modal from '@/components/Modal.vue'
import type { CreateBuildingForm, CreateDepartmentForm, Building, Department, DayOfWeek } from '@/types'

const configStore = useConfigStore()

const buildingsWithDepartments = computed(() => configStore.departmentsByBuilding)

// Form state
const showBuildingForm = ref(false)
const showDepartmentForm = ref(false)
const editingBuilding = ref<Building | null>(null)
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
  }
}

function formatDayName(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3)
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

  // Reset day selection and times
  selectedDeptDay.value = null
  deptDayTimes.value = {}
  currentDeptDayTimes.value = { startTime: department.startTime || '08:00', endTime: department.endTime || '20:00' }

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
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete department'
  }
}

function handleDeptDayClick(day: string) {
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



const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
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

    <!-- Department Form Modal -->
    <Modal :show="showDepartmentForm" :title="departmentFormTitle" size="lg" @close="resetDepartmentForm">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="saveDepartment" class="form">
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

        <div class="form-group">
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

        <div v-if="!newDepartment.is24x7" class="form-group">
          <label class="form-label">Operational Days</label>
          <p class="form-help">Click to activate/select days. Click again to deactivate.</p>
          <div class="days-grid">
            <button
              v-for="day in daysOfWeek"
              :key="day"
              type="button"
              @click="handleDeptDayClick(day)"
              class="day-button"
              :class="{
                active: newDepartment.operationalDays.includes(day),
                selected: selectedDeptDay === day && newDepartment.operationalDays.includes(day)
              }"
            >
              {{ day.charAt(0).toUpperCase() + day.slice(1, 3) }}
            </button>
          </div>
        </div>

        <!-- Time Inputs for Selected Day -->
        <div v-if="!newDepartment.is24x7 && selectedDeptDay && newDepartment.operationalDays.includes(selectedDeptDay)" class="form-group">
          <label class="form-label">{{ formatDayName(selectedDeptDay) }} Operating Hours</label>
          <div class="time-inputs">
            <div class="time-input">
              <label class="form-label">Start Time</label>
              <input
                v-model="currentDeptDayTimes.startTime"
                @input="updateDeptDayTimes"
                type="time"
                class="form-input"
                required
              >
            </div>
            <div class="time-input">
              <label class="form-label">End Time</label>
              <input
                v-model="currentDeptDayTimes.endTime"
                @input="updateDeptDayTimes"
                type="time"
                class="form-input"
                required
              >
            </div>
          </div>
        </div>



        <div class="form-group">
          <label class="form-label">Minimum Staff</label>
          <input v-model.number="newDepartment.minStaff" type="number" min="1" class="form-input" required>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="newDepartment.displayOnHome" type="checkbox" class="checkbox">
            Display on homepage (show even without staff)
          </label>
        </div>
      </form>

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

      <article
        v-for="building in buildingsWithDepartments"
        :key="building.id"
      >
        <header>
          <h3>{{ building.name }}</h3>
          <div>
            <button @click="openEditBuildingForm(building)">Edit</button>
            <button @click="openDepartmentForm(building.id)">Add Department</button>
            <button @click="deleteBuilding(building)">Delete</button>
          </div>
        </header>

        <section v-if="building.departments.length > 0">
          <h4>Departments ({{ building.departments.length }})</h4>
          <ul>
            <li
              v-for="department in building.departments"
              :key="department.id"
            >
              <div>
                <span>{{ department.name }}</span>
                <time>{{ getDepartmentScheduleDisplay(department) }}</time>
                <span>{{ department.operationalDays.length }} days/week</span>
              </div>
              <div>
                <button @click="openEditDepartmentForm(department)">Edit</button>
                <button @click="deleteDepartment(department)">Delete</button>
              </div>
            </li>
          </ul>
        </section>

        <div v-else>
          <p>No departments in this building</p>
          <button @click="openDepartmentForm(building.id)">Add First Department</button>
        </div>
      </article>
    </section>
  </article>
</template>




