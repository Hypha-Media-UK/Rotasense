<script setup lang="ts">
import type { ServiceStatus, Staff } from '@/types'
import { computed, ref } from 'vue'
import StaffReassignmentModal from './StaffReassignmentModal.vue'

interface Props {
  serviceStatus: ServiceStatus
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
  if (props.serviceStatus.isUnderstaffed) return 'status-understaffed'
  if (props.serviceStatus.isOperational) return 'status-operational'
  return 'status-closed'
})

const statusText = computed(() => {
  if (props.serviceStatus.isUnderstaffed) return 'Understaffed'
  if (props.serviceStatus.isOperational) return 'Operational'
  return 'Closed'
})

// Helper function to get display hours based on shift type
function getDisplayHours(staffStatus: any): string {
  const staff = staffStatus.staff

  // For rotating supervisors, show hours based on current shift type
  if (staffStatus.isRotatingSchedule && staffStatus.currentShiftType === 'night') {
    return '20:00 - 08:00'
  }

  // For fixed night staff, show night hours
  if (staff.isNightStaff) {
    return '20:00 - 08:00'
  }

  // Default to day hours
  return `${staff.defaultStartTime} - ${staff.defaultEndTime}`
}

// Helper function to sort staff with supervisors first
function sortStaffWithSupervisorsFirst(staff: any[]): any[] {
  return staff.sort((a, b) => {
    // Sort supervisors to the top
    if (a.staff.category === 'SUPERVISOR' && b.staff.category !== 'SUPERVISOR') return -1
    if (a.staff.category !== 'SUPERVISOR' && b.staff.category === 'SUPERVISOR') return 1
    // Then sort by name
    return a.staff.name.localeCompare(b.staff.name)
  })
}

// Organize staff by shift start time and day/night
const organizedStaff = computed(() => {
  const staffByTime = new Map()

  props.serviceStatus.assignedStaff.forEach(staffStatus => {
    const startTime = staffStatus.staff.defaultStartTime

    if (!staffByTime.has(startTime)) {
      staffByTime.set(startTime, { dayStaff: [], nightStaff: [] })
    }

    // Use currentShiftType for rotating supervisors, fallback to isNightStaff
    const isCurrentlyNightShift = staffStatus.currentShiftType === 'night'

    if (isCurrentlyNightShift) {
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
      dayStaff: sortStaffWithSupervisorsFirst(staff.dayStaff),
      nightStaff: sortStaffWithSupervisorsFirst(staff.nightStaff)
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
        <h3>{{ serviceStatus.service.name }}</h3>
        <span class="capacity-text">{{ serviceStatus.activeStaff }}/{{ serviceStatus.requiredStaff }} Staff</span>
      </div>
    </header>

    <section v-if="serviceStatus.assignedStaff.length > 0">
      <div v-for="(timeGroup, index) in organizedStaff" :key="timeGroup.startTime">
        <!-- Time divider (except for first group) -->
        <div v-if="index > 0" class="shift-divider"></div>

        <!-- Day Staff -->
        <ul v-if="timeGroup.dayStaff.length > 0">
          <li
            v-for="staffStatus in timeGroup.dayStaff"
            :key="staffStatus.staff.id"
            class="staff-item"
            :class="{
              'staff-temporary': isTemporaryAssignment(staffStatus),
              'staff-supervisor': staffStatus.staff.category === 'SUPERVISOR'
            }"
            @click="openStaffReassignmentModal(staffStatus.staff)"
            :title="'Click to reassign ' + staffStatus.staff.name"
          >
            <div class="staff-layout">
              <div class="staff-main">
                <!-- Name -->
                <span class="staff-name">
                  {{ staffStatus.staff.name }}
                </span>

                <!-- Contracted hours -->
                <span class="contracted-hours">
                  {{ getDisplayHours(staffStatus) }}
                </span>
              </div>

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
            :class="{
              'staff-temporary': isTemporaryAssignment(staffStatus),
              'staff-supervisor': staffStatus.staff.category === 'SUPERVISOR'
            }"
            @click="openStaffReassignmentModal(staffStatus.staff)"
            :title="'Click to reassign ' + staffStatus.staff.name"
          >
            <div class="staff-layout">
              <div class="staff-main">
                <!-- Name -->
                <span class="staff-name">
                  {{ staffStatus.staff.name }}
                </span>

                <!-- Contracted hours -->
                <span class="contracted-hours">
                  {{ getDisplayHours(staffStatus) }}
                </span>
              </div>

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
/* New layout: Name | Contracted hours [Cover | Time frame] */
.staff-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.staff-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.staff-name {
  font-weight: 600;
  flex-shrink: 0;
  text-align: left;
}

.contracted-hours {
  color: #6b7280;
  font-size: 0.875rem;
  flex-shrink: 0;
}

/* Section styling */
section {
  gap: 0;
}

/* Base staff item styling */
.staff-item {
  padding: 0.375rem 0.5rem;
  background: #f8f9fa;
  margin-bottom: 0.125rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

/* Supervisor styling - darker grey */
.staff-item.staff-supervisor {
  background: #e5e7eb;
}

.staff-item:hover {
  background: rgba(59, 130, 246, 0.1);
}

.staff-item:active {
  transform: translateY(1px);
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


