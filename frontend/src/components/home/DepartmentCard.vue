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

const capacityPercentage = computed(() => {
  const required = props.departmentStatus.requiredStaff
  const active = props.departmentStatus.activeStaff
  return required > 0 ? Math.min((active / required) * 100, 100) : 0
})

const capacityClass = computed(() => {
  const percentage = capacityPercentage.value
  if (percentage < 100) return 'understaffed'
  if (percentage === 100) return 'optimal'
  return 'overstaffed'
})
</script>

<template>
  <article>
    <header>
      <div class="card-title-row">
        <h3>{{ departmentStatus.department.name }}</h3>
        <span class="status-badge" :class="statusClass">
          {{ statusText }}
        </span>
      </div>

      <time>{{ departmentStatus.department.startTime }} - {{ departmentStatus.department.endTime }}</time>

      <div class="capacity-indicator">
        <div class="capacity-bar">
          <div
            class="capacity-fill"
            :class="capacityClass"
            :style="{ width: capacityPercentage + '%' }"
          ></div>
        </div>
        <span class="capacity-text">
          {{ departmentStatus.activeStaff }} / {{ departmentStatus.requiredStaff }} Staff
        </span>
      </div>
    </header>

    <section v-if="departmentStatus.assignedStaff.length > 0">
      <h4>Assigned Staff</h4>
      <ul>
        <li
          v-for="staffStatus in departmentStatus.assignedStaff"
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
            <span v-else-if="staffStatus.isActive">Active</span>
            <span v-else-if="staffStatus.isScheduled">Scheduled</span>
            <span v-else-if="staffStatus.isOffDuty">Off Duty</span>
          </span>
        </li>
      </ul>
    </section>

    <div v-else class="empty-state">
      <p>No staff assigned</p>
    </div>
  </article>
</template>


