<script setup lang="ts">
import type { DepartmentStatus } from '@/types'
import { computed } from 'vue'

interface Props {
  departmentStatus: DepartmentStatus
}

const props = defineProps<Props>()

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
          >
            <span class="staff-name">{{ staffStatus.staff.name }}</span>
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
          >
            <span class="staff-name">{{ staffStatus.staff.name }}</span>
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
</template>


