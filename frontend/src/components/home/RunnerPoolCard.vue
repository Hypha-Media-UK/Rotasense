<script setup lang="ts">
import type { RunnerPoolStatus } from '@/types'
import { computed } from 'vue'

interface Props {
  runnerPoolStatus: RunnerPoolStatus
}

const props = defineProps<Props>()

// Computed properties for enhanced UI (matching department card style)
const statusClass = computed(() => {
  if (props.runnerPoolStatus.activeStaff === 0) return 'status-closed'
  if (props.runnerPoolStatus.temporarilyAllocatedStaff.length > 0) return 'status-understaffed'
  return 'status-operational'
})

const statusText = computed(() => {
  if (props.runnerPoolStatus.activeStaff === 0) return 'No Staff'
  if (props.runnerPoolStatus.temporarilyAllocatedStaff.length > 0) return 'Staff Allocated'
  return 'Available'
})

// Organize staff by shift start time (simplified like department cards)
const organizedStaff = computed(() => {
  const availableStaff = props.runnerPoolStatus.assignedStaff.filter(staffStatus =>
    !props.runnerPoolStatus.temporarilyAllocatedStaff.includes(staffStatus)
  )

  const staffByTime = new Map()

  availableStaff.forEach(staffStatus => {
    const startTime = staffStatus.staff.defaultStartTime

    if (!staffByTime.has(startTime)) {
      staffByTime.set(startTime, [])
    }

    staffByTime.get(startTime).push(staffStatus)
  })

  // Sort by start time and return as array
  return Array.from(staffByTime.entries())
    .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
    .map(([startTime, staff]) => ({
      startTime,
      staff
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
        <h3>{{ runnerPoolStatus.runnerPool.name }}</h3>
        <span class="capacity-text">{{ runnerPoolStatus.activeStaff }}/{{ runnerPoolStatus.totalStaff }} Staff</span>
      </div>
    </header>

    <section v-if="runnerPoolStatus.assignedStaff.length > 0">
      <div v-for="(timeGroup, index) in organizedStaff" :key="timeGroup.startTime">
        <!-- Time divider (except for first group) -->
        <div v-if="index > 0" class="shift-divider"></div>

        <!-- Staff List -->
        <ul>
          <li
            v-for="staffStatus in timeGroup.staff"
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
      </div>
    </section>

    <section v-if="runnerPoolStatus.assignedStaff.length === 0" class="empty-state">
      <p>No staff assigned</p>
    </section>
  </article>
</template>


