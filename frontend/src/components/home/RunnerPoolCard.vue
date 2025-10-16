<script setup lang="ts">
import type { RunnerPoolStatus, Staff } from '@/types'
import { computed, ref } from 'vue'
import StaffReassignmentModal from './StaffReassignmentModal.vue'
import { useConfigStore } from '@/stores/config'
import { useHomeStore } from '@/stores/home'
import { getDisplayHours } from '@/utils/displayUtils'

interface Props {
  runnerPoolStatus: RunnerPoolStatus
}

const props = defineProps<Props>()

// Stores
const configStore = useConfigStore()
const homeStore = useHomeStore()

// Modal state
const showReassignmentModal = ref(false)
const selectedStaff = ref<Staff | null>(null)

// Methods
function openStaffReassignmentModal(staff: Staff) {
  selectedStaff.value = staff
  showReassignmentModal.value = true
}

function closeReassignmentModal() {
  showReassignmentModal.value = false
  selectedStaff.value = null
}

function isTemporarilyAllocated(staffStatus: any) {
  return props.runnerPoolStatus.temporarilyAllocatedStaff.includes(staffStatus)
}

function getTemporaryAllocationLocation(staffStatus: any) {
  const override = staffStatus.override
  if (!override || override.overrideType !== 'TEMPORARY_ALLOCATION') return ''

  if (override.departmentId) {
    const dept = configStore.departments.find(d => d.id === override.departmentId)
    return dept ? dept.name : 'Department'
  }
  if (override.serviceId) {
    const service = configStore.services.find(s => s.id === override.serviceId)
    return service ? service.name : 'Service'
  }
  return 'Unknown'
}

function getAllocationTimeframe(staffStatus: any) {
  const override = staffStatus.override
  if (!override || override.overrideType !== 'TEMPORARY_ALLOCATION') return ''

  const startTime = override.startTime || staffStatus.staff.defaultStartTime
  const endTime = override.endTime || staffStatus.staff.defaultEndTime
  return `${startTime} - ${endTime}`
}

// Computed properties for enhanced UI (matching department card style)
const statusClass = computed(() => {
  if (props.runnerPoolStatus.activeStaff === 0) return 'status-closed'
  if (props.runnerPoolStatus.temporarilyAllocatedStaff.length > 0) return 'status-understaffed'
  return 'status-operational'
})

const statusText = computed(() => {
  if (props.runnerPoolStatus.activeStaff === 0) return 'No Staff'
  if (props.runnerPoolStatus.temporarilyAllocatedStaff.length > 0) {
    const allocatedCount = props.runnerPoolStatus.temporarilyAllocatedStaff.length
    return `${allocatedCount} Staff Allocated`
  }
  return 'Available'
})

// Note: Display hours logic moved to displayUtils

// Organize staff by shift start time with supervisors always at top
const organizedStaff = computed(() => {
  // Show ALL staff in the runner pool, including temporarily allocated ones
  const allStaff = props.runnerPoolStatus.assignedStaff

  // Separate supervisors from regular staff
  const supervisors = allStaff.filter(staffStatus => staffStatus.staff.category === 'SUPERVISOR')
  const regularStaff = allStaff.filter(staffStatus => staffStatus.staff.category !== 'SUPERVISOR')

  const result = []

  // Add supervisors group first (if any supervisors exist)
  if (supervisors.length > 0) {
    result.push({
      startTime: 'Supervisors',
      staff: supervisors.sort((a: any, b: any) => a.staff.name.localeCompare(b.staff.name))
    })
  }

  // Group regular staff by start time
  const staffByTime = new Map()

  regularStaff.forEach(staffStatus => {
    const startTime = staffStatus.staff.defaultStartTime

    if (!staffByTime.has(startTime)) {
      staffByTime.set(startTime, [])
    }

    staffByTime.get(startTime).push(staffStatus)
  })

  // Add regular staff groups sorted by start time
  const regularGroups = Array.from(staffByTime.entries())
    .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
    .map(([startTime, staff]) => ({
      startTime,
      staff: staff.sort((a: any, b: any) => a.staff.name.localeCompare(b.staff.name))
    }))

  return [...result, ...regularGroups]
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
            :class="{
              'staff-temporarily-allocated': isTemporarilyAllocated(staffStatus),
              'staff-supervisor': staffStatus.staff.category === 'SUPERVISOR'
            }"
            @click="openStaffReassignmentModal(staffStatus.staff)"
            :title="'Click to reassign ' + staffStatus.staff.name"
          >
            <div class="staff-layout">
              <div class="staff-main">
                <!-- Name -->
                <span class="staff-name">
                  {{ staffStatus.staff.name }}
                </span>

                <!-- Contracted hours -->
                <span class="contracted-hours">
                  {{ getDisplayHours(staffStatus) }}
                </span>
              </div>

              <!-- Allocation info (if temporarily allocated) -->
              <div v-if="isTemporarilyAllocated(staffStatus)" class="allocation-info">
                <span class="allocation-location">{{ getTemporaryAllocationLocation(staffStatus) }}</span>
                <span class="allocation-timeframe">{{ getAllocationTimeframe(staffStatus) }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="runnerPoolStatus.assignedStaff.length === 0" class="empty-state">
      <p>No staff assigned</p>
    </section>
  </article>

  <!-- Staff Reassignment Modal -->
  <StaffReassignmentModal
    :show="showReassignmentModal"
    :staff="selectedStaff"
    @close="closeReassignmentModal"
  />
</template>

<style scoped>
/* Section styling */
section {
  gap: 0;
}

/* Base staff item styling */
.staff-item {
  padding: 0.375rem 0.5rem;
  background: #f8f9fa;
  margin-bottom: 0.125rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

/* Supervisor styling - darker grey */
.staff-item.staff-supervisor {
  background: #e5e7eb;
}

.staff-item:hover {
  background: rgba(59, 130, 246, 0.1);
}

.staff-item:active {
  transform: translateY(1px);
}

/* New layout: Name | Contracted hours [Allocation | Time frame] */
.staff-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.staff-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.staff-name {
  font-weight: 600;
  flex-shrink: 0;
  text-align: left;
}

.contracted-hours {
  color: #6b7280;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.allocation-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(245, 158, 11, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.allocation-location {
  font-size: 0.75rem;
  color: #92400e;
  font-weight: 500;
}

.allocation-timeframe {
  font-size: 0.75rem;
  color: #f59e0b;
  font-weight: 500;
}

/* Temporarily allocated staff styling */
.staff-item.staff-temporarily-allocated {
  background: #fef3c7;
}


</style>

