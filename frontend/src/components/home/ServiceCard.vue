<script setup lang="ts">
import type { ServiceStatus } from '@/types'

interface Props {
  serviceStatus: ServiceStatus
}

defineProps<Props>()
</script>

<template>
  <article>
    <header>
      <h3>{{ serviceStatus.service.name }}</h3>
      <time>{{ serviceStatus.service.startTime }} - {{ serviceStatus.service.endTime }}</time>

      <div
        :class="{
          'status-understaffed': serviceStatus.isUnderstaffed,
          'status-active': serviceStatus.isOperational && !serviceStatus.isUnderstaffed
        }"
      >
        <span v-if="serviceStatus.isUnderstaffed">Understaffed</span>
        <span v-else-if="serviceStatus.isOperational">Operational</span>
        <span v-else>Closed</span>
      </div>

      <data :value="serviceStatus.activeStaff">
        {{ serviceStatus.activeStaff }} / {{ serviceStatus.requiredStaff }} Staff
      </data>
    </header>

    <section v-if="serviceStatus.assignedStaff.length > 0">
      <h4>Assigned Staff</h4>
      <ul>
        <li
          v-for="staffStatus in serviceStatus.assignedStaff"
          :key="staffStatus.staff.id"
          :class="{
            'staff-active': staffStatus.isActive,
            'staff-scheduled': staffStatus.isScheduled && !staffStatus.isActive,
            'staff-off-duty': staffStatus.isOffDuty,
            'staff-absent': staffStatus.isAbsent
          }"
        >
          <span>{{ staffStatus.staff.name }}</span>
          <span v-if="staffStatus.isAbsent">Absent</span>
          <span v-else-if="staffStatus.isActive">Active</span>
          <span v-else-if="staffStatus.isScheduled">Scheduled</span>
          <span v-else-if="staffStatus.isOffDuty">Off Duty</span>
        </li>
      </ul>
    </section>

    <p v-else>No staff assigned</p>
  </article>
</template>


