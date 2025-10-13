<script setup lang="ts">
import type { DepartmentStatus, Staff } from '@/types'
import { computed, ref } from 'vue'
import StaffReassignmentModal from './StaffReassignmentModal.vue'

interface Props {
  departmentStatus: DepartmentStatus
}

const props = defineProps<Props>()

// Modal state
const showReassignmentModal = ref(false)
const selectedStaff = ref<Staff | null>(null)

// Methods
function openStaffReassignmentModal(staff: Staff) {
  selectedStaff.value = staff
  showReassignmentModal.value = true
}

function closeReassignmentModal() {
  showReassignmentModal.value = false
  selectedStaff.value = null
}

function isTemporaryAssignment(staffStatus: any) {
  return staffStatus.override?.overrideType === 'TEMPORARY_ALLOCATION'
}

function getDisplayTime(staffStatus: any) {
  if (isTemporaryAssignment(staffStatus) && staffStatus.override) {
    // Show allocation timeframe for temporary assignments
    const startTime = staffStatus.override.startTime || staffStatus.staff.defaultStartTime
    const endTime = staffStatus.override.endTime || staffStatus.staff.defaultEndTime
    return `${startTime} - ${endTime}`
  }
  // Show contracted hours for permanent staff
  return `${staffStatus.staff.defaultStartTime} - ${staffStatus.staff.defaultEndTime}`
}

// Computed properties for enhanced UI
const statusClass = computed(() => {
  if (props.departmentStatus.isUnderstaffed) return 'status-understaffed'
  if (props.departmentStatus.isOperational) return 'status-operational'
  return 'status-closed'
})

const statusText = computed(() => {
  if (props.departmentStatus.isUnderstaffed) return 'Understaffed'
  if (props.departmentStatus.isOperational) return 'Operational'
  return 'Closed'
})

// Organize staff by shift start time and day/night
const organizedStaff = computed(() => {
  const staffByTime = new Map()

  props.departmentStatus.assignedStaff.forEach(staffStatus => {
    const startTime = staffStatus.staff.defaultStartTime

    if (!staffByTime.has(startTime)) {
      staffByTime.set(startTime, { dayStaff: [], nightStaff: [] })
    }

    if (staffStatus.staff.isNightStaff) {
      staffByTime.get(startTime).nightStaff.push(staffStatus)
    } else {
      staffByTime.get(startTime).dayStaff.push(staffStatus)
    }
  })

  // Sort by start time and return as array
  return Array.from(staffByTime.entries())
    .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
    .map(([startTime, staff]) => ({
      startTime,
      dayStaff: staff.dayStaff,
      nightStaff: staff.nightStaff
    }))
})


</script>

<template>
  <article>
    <header>
      <span
        class="status-light"
        :class="statusClass"
        :title="statusText"
        :aria-label="statusText"
      ></span>

      <div class="card-title-row">
        <h3>{{ departmentStatus.department.name }}</h3>
        <span class="capacity-text">{{ departmentStatus.activeStaff }}/{{ departmentStatus.requiredStaff }} Staff</span>
      </div>
    </header>

    <section v-if="departmentStatus.assignedStaff.length > 0">
      <div v-for="(timeGroup, index) in organizedStaff" :key="timeGroup.startTime">
        <!-- Time divider (except for first group) -->
        <div v-if="index > 0" class="shift-divider"></div>

        <!-- Day Staff -->
        <ul v-if="timeGroup.dayStaff.length > 0">
          <li
            v-for="staffStatus in timeGroup.dayStaff"
            :key="staffStatus.staff.id"
            class="staff-item"
            :class="{ 'staff-temporary': isTemporaryAssignment(staffStatus) }"
          >
            <div class="staff-layout">
              <!-- Name -->
              <button
                class="staff-name clickable-staff"
                @click="openStaffReassignmentModal(staffStatus.staff)"
                :title="'Click to reassign ' + staffStatus.staff.name"
              >
                {{ staffStatus.staff.name }}
              </button>

              <!-- Cover info (if temporary assignment) -->
              <div v-if="isTemporaryAssignment(staffStatus)" class="cover-info">
                <span class="cover-label">Cover</span>
                <span class="cover-timeframe">{{ getDisplayTime(staffStatus) }}</span>
              </div>
            </div>
          </li>
        </ul>

        <!-- Night Staff (with divider if both day and night staff exist) -->
        <div v-if="timeGroup.dayStaff.length > 0 && timeGroup.nightStaff.length > 0" class="day-night-divider"></div>
        <ul v-if="timeGroup.nightStaff.length > 0">
          <li
            v-for="staffStatus in timeGroup.nightStaff"
            :key="staffStatus.staff.id"
            class="staff-item night-staff"
            :class="{ 'staff-temporary': isTemporaryAssignment(staffStatus) }"
          >
            <div class="staff-layout">
              <!-- Name -->
              <button
                class="staff-name clickable-staff"
                @click="openStaffReassignmentModal(staffStatus.staff)"
                :title="'Click to reassign ' + staffStatus.staff.name"
              >
                {{ staffStatus.staff.name }}
              </button>

              <!-- Cover info (if temporary assignment) -->
              <div v-if="isTemporaryAssignment(staffStatus)" class="cover-info">
                <span class="cover-label">Cover</span>
                <span class="cover-timeframe">{{ getDisplayTime(staffStatus) }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <div v-else class="empty-state">
      <p>No staff assigned</p>
    </div>
  </article>

  <!-- Staff Reassignment Modal -->
  <StaffReassignmentModal
    :show="showReassignmentModal"
    :staff="selectedStaff"
    @close="closeReassignmentModal"
  />
</template>

<style scoped>
/* Clickable staff names */
.clickable-staff {
  background: none;
  border: none;
  padding: 0.125rem 0.25rem;
  margin: -0.125rem -0.25rem;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  display: inline-block;
  width: auto;
}

.clickable-staff:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  transform: translateY(-1px);
}

.clickable-staff:active {
  transform: translateY(0);
}

/* New layout: Name [Cover | Time frame] */
.staff-layout {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
}

.staff-name {
  font-weight: 600;
  flex-shrink: 0;
  text-align: left;
}

/* Base staff item styling */
.staff-item {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: #f8f9fa;
  margin-bottom: 0.125rem;
  transition: all 0.2s ease;
}

.staff-item:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.cover-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  background: rgba(16, 185, 129, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.cover-label {
  font-size: 0.75rem;
  color: #065f46;
  font-weight: 500;
}

.cover-timeframe {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 500;
}

/* Temporary assignment styling */
.staff-item.staff-temporary {
  background: #ecfdf5;
}
</style>


