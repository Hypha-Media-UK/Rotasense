<script setup lang="ts">
import type { ServiceStatus } from '@/types'
import { computed } from 'vue'

interface Props {
  serviceStatus: ServiceStatus
}

const props = defineProps<Props>()

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

const capacityPercentage = computed(() => {
  const required = props.serviceStatus.requiredStaff
  const active = props.serviceStatus.activeStaff
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
        <h3>{{ serviceStatus.service.name }}</h3>
        <span class="status-badge" :class="statusClass">
          {{ statusText }}
        </span>
      </div>

      <time>{{ serviceStatus.service.startTime }} - {{ serviceStatus.service.endTime }}</time>

      <div class="capacity-indicator">
        <div class="capacity-bar">
          <div
            class="capacity-fill"
            :class="capacityClass"
            :style="{ width: capacityPercentage + '%' }"
          ></div>
        </div>
        <span class="capacity-text">
          {{ serviceStatus.activeStaff }} / {{ serviceStatus.requiredStaff }} Staff
        </span>
      </div>
    </header>

    <section v-if="serviceStatus.assignedStaff.length > 0">
      <h4>Assigned Staff</h4>
      <ul>
        <li
          v-for="staffStatus in serviceStatus.assignedStaff"
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


