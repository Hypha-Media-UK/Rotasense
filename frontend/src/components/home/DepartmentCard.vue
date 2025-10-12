<script setup lang="ts">
import type { DepartmentStatus } from '@/types'

interface Props {
  departmentStatus: DepartmentStatus
}

defineProps<Props>()
</script>

<template>
  <article>
    <header>
      <h3>{{ departmentStatus.department.name }}</h3>
      <time>{{ departmentStatus.department.startTime }} - {{ departmentStatus.department.endTime }}</time>

      <div
        :class="{
          'status-understaffed': departmentStatus.isUnderstaffed,
          'status-active': departmentStatus.isOperational && !departmentStatus.isUnderstaffed
        }"
      >
        <span v-if="departmentStatus.isUnderstaffed">Understaffed</span>
        <span v-else-if="departmentStatus.isOperational">Operational</span>
        <span v-else>Closed</span>
      </div>

      <data :value="departmentStatus.activeStaff">
        {{ departmentStatus.activeStaff }} / {{ departmentStatus.requiredStaff }} Staff
      </data>
    </header>

    <section v-if="departmentStatus.assignedStaff.length > 0">
      <h4>Assigned Staff</h4>
      <ul>
        <li
          v-for="staffStatus in departmentStatus.assignedStaff"
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


