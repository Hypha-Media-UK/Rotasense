<script setup lang="ts">
import type { ServiceStatus } from '@/types'

interface Props {
  serviceStatus: ServiceStatus
}

defineProps<Props>()
</script>

<template>
  <div class="service-card card">
    <div class="service-header">
      <div class="service-info">
        <h3 class="service-name">{{ serviceStatus.service.name }}</h3>
        <div class="service-meta">
          <span class="operational-hours">
            {{ serviceStatus.service.startTime }} - {{ serviceStatus.service.endTime }}
          </span>
        </div>
      </div>
      
      <div class="service-status">
        <div 
          class="status"
          :class="{
            'status-understaffed': serviceStatus.isUnderstaffed,
            'status-active': serviceStatus.isOperational && !serviceStatus.isUnderstaffed
          }"
        >
          <span v-if="serviceStatus.isUnderstaffed">Understaffed</span>
          <span v-else-if="serviceStatus.isOperational">Operational</span>
          <span v-else>Closed</span>
        </div>
        
        <div class="staffing-info">
          <span class="staffing-count">
            {{ serviceStatus.activeStaff }} / {{ serviceStatus.requiredStaff }}
          </span>
          <span class="staffing-label">Staff</span>
        </div>
      </div>
    </div>

    <div v-if="serviceStatus.assignedStaff.length > 0" class="staff-list">
      <h4 class="staff-list-title">Assigned Staff</h4>
      <div class="staff-grid">
        <div
          v-for="staffStatus in serviceStatus.assignedStaff"
          :key="staffStatus.staff.id"
          class="staff-item"
          :class="{
            'staff-active': staffStatus.isActive,
            'staff-absent': staffStatus.isAbsent,
            'staff-off-duty': !staffStatus.isActive && !staffStatus.isAbsent
          }"
        >
          <div class="staff-name">{{ staffStatus.staff.name }}</div>
          <div class="staff-status">
            <span v-if="staffStatus.isAbsent" class="status status-off-duty">Absent</span>
            <span v-else-if="staffStatus.isActive" class="status status-active">Active</span>
            <span v-else class="status status-off-duty">Off Duty</span>
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
.service-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.service-info {
  flex: 1;
}

.service-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-xs) 0;
}

.service-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.operational-hours {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.service-status {
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.staff-item.staff-active {
  border-color: var(--color-success);
  background-color: oklch(0.95 0.05 140);
}

.staff-item.staff-absent {
  border-color: var(--color-error);
  background-color: oklch(0.95 0.05 25);
}

.staff-item.staff-off-duty {
  border-color: var(--color-warning);
  background-color: oklch(0.95 0.05 80);
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
  .service-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }
  
  .service-status {
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
