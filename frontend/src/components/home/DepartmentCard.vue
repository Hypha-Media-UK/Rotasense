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
            <div class="staff-info">
              <button
                class="staff-name clickable-staff"
                @click="openStaffReassignmentModal(staffStatus.staff)"
                :title="'Click to reassign ' + staffStatus.staff.name"
              >
                {{ staffStatus.staff.name }}
              </button>
              <span
                v-if="isTemporaryAssignment(staffStatus)"
                class="temporary-badge"
                title="Temporarily assigned from runner pool"
              >
                Temporary
              </span>
            </div>
            <span
              class="status-badge"
              :class="{
                'status-active': staffStatus.isActive,
                'status-scheduled': staffStatus.isScheduled && !staffStatus.isActive,
                'status-off-duty': staffStatus.isOffDuty,
                'status-absent': staffStatus.isAbsent
              }"
            >
              <span v-if="staffStatus.isAbsent">Absent</span>
              <span v-else-if="staffStatus.isOffDuty">Off Duty</span>
              <span v-else>{{ staffStatus.staff.defaultStartTime }} - {{ staffStatus.staff.defaultEndTime }}</span>
            </span>
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
            <div class="staff-info">
              <button
                class="staff-name clickable-staff"
                @click="openStaffReassignmentModal(staffStatus.staff)"
                :title="'Click to reassign ' + staffStatus.staff.name"
              >
                {{ staffStatus.staff.name }}
              </button>
              <span
                v-if="isTemporaryAssignment(staffStatus)"
                class="temporary-badge"
                title="Temporarily assigned from runner pool"
              >
                Temporary
              </span>
            </div>
            <span
              class="status-badge"
              :class="{
                'status-active': staffStatus.isActive,
                'status-scheduled': staffStatus.isScheduled && !staffStatus.isActive,
                'status-off-duty': staffStatus.isOffDuty,
                'status-absent': staffStatus.isAbsent
              }"
            >
              <span v-if="staffStatus.isAbsent">Absent</span>
              <span v-else-if="staffStatus.isOffDuty">Off Duty</span>
              <span v-else>{{ staffStatus.staff.defaultStartTime }} - {{ staffStatus.staff.defaultEndTime }}</span>
            </span>
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
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 0.125rem 0.25rem;
  margin: -0.125rem -0.25rem;
}

.clickable-staff:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  transform: translateY(-1px);
}

.clickable-staff:active {
  transform: translateY(0);
}

/* Temporary assignment styling */
.staff-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.staff-item.staff-temporary {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-left: 4px solid #10b981;
}

.temporary-badge {
  font-size: 0.625rem;
  color: #065f46;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
}
</style>


