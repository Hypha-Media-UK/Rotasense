<script setup lang="ts">
import type { RunnerPoolStatus } from '@/types'
import { computed } from 'vue'

interface Props {
  runnerPoolStatus: RunnerPoolStatus
}

const props = defineProps<Props>()

// Computed properties for enhanced UI
const statusClass = computed(() => {
  if (props.runnerPoolStatus.activeStaff === 0) return 'status-empty'
  if (props.runnerPoolStatus.temporarilyAllocatedStaff.length > 0) return 'status-allocated'
  return 'status-available'
})

const statusText = computed(() => {
  if (props.runnerPoolStatus.activeStaff === 0) return 'No Active Staff'
  if (props.runnerPoolStatus.temporarilyAllocatedStaff.length > 0) return 'Staff Allocated'
  return 'Available'
})

// Organize staff by availability and shift start time
const organizedStaff = computed(() => {
  const availableStaff = props.runnerPoolStatus.assignedStaff.filter(staffStatus => 
    !props.runnerPoolStatus.temporarilyAllocatedStaff.includes(staffStatus)
  )
  
  const staffByTime = new Map()

  availableStaff.forEach(staffStatus => {
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

// Organize temporarily allocated staff by their current location
const allocatedStaffByLocation = computed(() => {
  const locationMap = new Map()
  
  props.runnerPoolStatus.temporarilyAllocatedStaff.forEach(staffStatus => {
    const location = staffStatus.currentLocation
    if (!locationMap.has(location)) {
      locationMap.set(location, [])
    }
    locationMap.get(location).push(staffStatus)
  })
  
  return Array.from(locationMap.entries()).map(([location, staff]) => ({
    location,
    staff
  }))
})
</script>

<template>
  <article class="runner-pool-card" :class="statusClass">
    <header class="card-header">
      <div class="header-content">
        <h3 class="pool-name">{{ runnerPoolStatus.runnerPool.name }}</h3>
        <div class="status-badge" :class="statusClass">
          {{ statusText }}
        </div>
      </div>
      <div class="staff-summary">
        <span class="staff-count">
          {{ runnerPoolStatus.activeStaff }}/{{ runnerPoolStatus.totalStaff }} Active
        </span>
        <span v-if="runnerPoolStatus.temporarilyAllocatedStaff.length > 0" class="allocated-count">
          ({{ runnerPoolStatus.temporarilyAllocatedStaff.length }} Allocated)
        </span>
      </div>
      <p v-if="runnerPoolStatus.runnerPool.description" class="pool-description">
        {{ runnerPoolStatus.runnerPool.description }}
      </p>
    </header>

    <div class="card-content">
      <!-- Available Staff Section -->
      <div v-if="organizedStaff.length > 0" class="staff-section">
        <h4 class="section-title">Available Staff</h4>
        <div v-for="timeGroup in organizedStaff" :key="timeGroup.startTime" class="time-group">
          <div class="time-header">
            <span class="start-time">{{ timeGroup.startTime }}</span>
          </div>
          
          <!-- Day Staff -->
          <div v-if="timeGroup.dayStaff.length > 0" class="staff-group">
            <div class="staff-list">
              <div
                v-for="staffStatus in timeGroup.dayStaff"
                :key="staffStatus.staff.id"
                class="staff-member"
                :class="{
                  'staff-active': staffStatus.isActive,
                  'staff-absent': staffStatus.isAbsent,
                  'staff-off-duty': staffStatus.isOffDuty
                }"
              >
                <span class="staff-name">{{ staffStatus.staff.name }}</span>
                <span v-if="staffStatus.isAbsent" class="staff-status absent">Absent</span>
                <span v-else-if="staffStatus.isOffDuty" class="staff-status off-duty">Off Duty</span>
                <span v-else class="staff-status active">Available</span>
              </div>
            </div>
          </div>

          <!-- Night Staff -->
          <div v-if="timeGroup.nightStaff.length > 0" class="staff-group night-staff">
            <div class="night-indicator">🌙 Night Shift</div>
            <div class="staff-list">
              <div
                v-for="staffStatus in timeGroup.nightStaff"
                :key="staffStatus.staff.id"
                class="staff-member"
                :class="{
                  'staff-active': staffStatus.isActive,
                  'staff-absent': staffStatus.isAbsent,
                  'staff-off-duty': staffStatus.isOffDuty
                }"
              >
                <span class="staff-name">{{ staffStatus.staff.name }}</span>
                <span v-if="staffStatus.isAbsent" class="staff-status absent">Absent</span>
                <span v-else-if="staffStatus.isOffDuty" class="staff-status off-duty">Off Duty</span>
                <span v-else class="staff-status active">Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Temporarily Allocated Staff Section -->
      <div v-if="allocatedStaffByLocation.length > 0" class="staff-section allocated-section">
        <h4 class="section-title">Currently Allocated</h4>
        <div v-for="locationGroup in allocatedStaffByLocation" :key="locationGroup.location" class="allocation-group">
          <div class="allocation-header">
            <span class="allocation-location">→ {{ locationGroup.location }}</span>
          </div>
          <div class="staff-list">
            <div
              v-for="staffStatus in locationGroup.staff"
              :key="staffStatus.staff.id"
              class="staff-member allocated"
            >
              <span class="staff-name">{{ staffStatus.staff.name }}</span>
              <span class="staff-status allocated">Allocated</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="organizedStaff.length === 0 && allocatedStaffByLocation.length === 0" class="empty-state">
        <p>No staff assigned to this runner pool</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.runner-pool-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;
}

.runner-pool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* Status-based styling */
.status-available {
  border-color: #10b981;
}

.status-allocated {
  border-color: #f59e0b;
}

.status-empty {
  border-color: #6b7280;
}

.card-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e5e7eb;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.pool-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.status-available {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.status-allocated {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-empty {
  background: #f3f4f6;
  color: #374151;
}

.staff-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.staff-count {
  font-weight: 500;
}

.allocated-count {
  color: #f59e0b;
  font-weight: 500;
}

.pool-description {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.card-content {
  padding: 1.5rem;
}

.staff-section {
  margin-bottom: 1.5rem;
}

.staff-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.allocated-section .section-title {
  color: #f59e0b;
  border-bottom-color: #fbbf24;
}

.time-group {
  margin-bottom: 1rem;
}

.time-group:last-child {
  margin-bottom: 0;
}

.time-header {
  margin-bottom: 0.5rem;
}

.start-time {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.staff-group {
  margin-bottom: 0.75rem;
}

.night-staff {
  background: #f8fafc;
  border-radius: 6px;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
}

.night-indicator {
  font-size: 0.75rem;
  font-weight: 500;
  color: #4f46e5;
  margin-bottom: 0.5rem;
}

.staff-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.staff-member {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.staff-member:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.staff-name {
  font-weight: 500;
  color: #1f2937;
}

.staff-status {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.staff-status.active {
  background: #d1fae5;
  color: #065f46;
}

.staff-status.absent {
  background: #fee2e2;
  color: #991b1b;
}

.staff-status.off-duty {
  background: #f3f4f6;
  color: #374151;
}

.staff-status.allocated {
  background: #fef3c7;
  color: #92400e;
}

.allocation-group {
  margin-bottom: 1rem;
}

.allocation-group:last-child {
  margin-bottom: 0;
}

.allocation-header {
  margin-bottom: 0.5rem;
}

.allocation-location {
  font-size: 0.875rem;
  font-weight: 500;
  color: #f59e0b;
  background: #fef3c7;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.staff-member.allocated {
  border-color: #fbbf24;
  background: #fffbeb;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-state p {
  margin: 0;
  font-style: italic;
}
</style>
