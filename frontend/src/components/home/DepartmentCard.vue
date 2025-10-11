<script setup lang="ts">
import type { DepartmentStatus } from '@/types'

interface Props {
  departmentStatus: DepartmentStatus
}

defineProps<Props>()
</script>

<template>
  <div class="department-card card">
    <div class="department-header">
      <div class="department-info">
        <h3 class="department-name">{{ departmentStatus.department.name }}</h3>
        <div class="department-meta">
          <span class="operational-hours">
            {{ departmentStatus.department.startTime }} - {{ departmentStatus.department.endTime }}
          </span>
        </div>
      </div>

      <div class="department-status">
        <div
          class="status"
          :class="{
            'status-understaffed': departmentStatus.isUnderstaffed,
            'status-active': departmentStatus.isOperational && !departmentStatus.isUnderstaffed
          }"
        >
          <span v-if="departmentStatus.isUnderstaffed">Understaffed</span>
          <span v-else-if="departmentStatus.isOperational">Operational</span>
          <span v-else>Closed</span>
        </div>

        <div class="staffing-info">
          <span class="staffing-count">
            {{ departmentStatus.activeStaff }} / {{ departmentStatus.requiredStaff }}
          </span>
          <span class="staffing-label">Staff</span>
        </div>
      </div>
    </div>

    <div v-if="departmentStatus.assignedStaff.length > 0" class="staff-list">
      <h4 class="staff-list-title">Assigned Staff</h4>
      <div class="staff-grid">
        <div
          v-for="staffStatus in departmentStatus.assignedStaff"
          :key="staffStatus.staff.id"
          class="staff-item"
          :class="{
            'staff-active': staffStatus.isActive,
            'staff-scheduled': staffStatus.isScheduled && !staffStatus.isActive,
            'staff-off-duty': staffStatus.isOffDuty,
            'staff-absent': staffStatus.isAbsent
          }"
        >
          <div class="staff-name">{{ staffStatus.staff.name }}</div>
          <div class="staff-status">
            <span v-if="staffStatus.isAbsent" class="status status-absent">Absent</span>
            <span v-else-if="staffStatus.isActive" class="status status-active">Active</span>
            <span v-else-if="staffStatus.isScheduled" class="status status-scheduled">Scheduled</span>
            <span v-else-if="staffStatus.isOffDuty" class="status status-off-duty">Off Duty</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-staff">
      <p class="text-muted text-sm">No staff assigned</p>
    </div>
  </div>
</template>

<style scoped>
.department-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.department-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.department-info {
  flex: 1;
}

.department-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-xs) 0;
}

.department-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.operational-hours {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.department-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
}

.staffing-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.staffing-count {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.staffing-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.staff-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.staff-list-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.staff-grid {
  display: grid;
  gap: var(--space-xs);
}

.staff-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.staff-item.staff-active {
  background-color: oklch(0.95 0.05 140);
}

.staff-item.staff-scheduled {
  background-color: #f3f4f6;
}

.staff-item.staff-absent {
  background-color: oklch(0.95 0.05 25);
}

.staff-item.staff-off-duty {
  background-color: rgba(250, 250, 250, 0.3);
  opacity: 0.7;
}

.staff-item.staff-off-duty .staff-name {
  color: #9ca3af;
}

.staff-item.staff-active .staff-name {
  color: var(--color-success);
}

.staff-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
}

.staff-status .status {
  font-size: var(--font-size-xs);
}

.no-staff {
  padding: var(--space-md);
  text-align: center;
  background-color: var(--color-background);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .department-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .department-status {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .staffing-info {
    align-items: flex-start;
  }

  .staff-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-xs);
  }

  .staff-name {
    text-align: center;
  }

  .staff-status {
    text-align: center;
  }
}
</style>
