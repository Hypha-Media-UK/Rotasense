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


