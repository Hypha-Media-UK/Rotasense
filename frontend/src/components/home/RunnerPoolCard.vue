<script setup lang="ts">
import type { RunnerPoolStatus, Staff } from '@/types'
import { computed, ref } from 'vue'
import StaffReassignmentModal from './StaffReassignmentModal.vue'
import { useConfigStore } from '@/stores/config'
import { useHomeStore } from '@/stores/home'

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

// Organize staff by shift start time (simplified like department cards)
const organizedStaff = computed(() => {
  // Show ALL staff in the runner pool, including temporarily allocated ones
  const allStaff = props.runnerPoolStatus.assignedStaff

  const staffByTime = new Map()

  allStaff.forEach(staffStatus => {
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
            :class="{ 'staff-temporarily-allocated': isTemporarilyAllocated(staffStatus) }"
          >
            <div class="staff-info">
              <button
                class="staff-name clickable-staff"
                @click="openStaffReassignmentModal(staffStatus.staff)"
                :title="'Click to reassign ' + staffStatus.staff.name"
              >
                {{ staffStatus.staff.name }}
              </button>
              <span
                v-if="isTemporarilyAllocated(staffStatus)"
                class="allocation-badge"
                :title="'Temporarily assigned to ' + getTemporaryAllocationLocation(staffStatus)"
              >
                → {{ getTemporaryAllocationLocation(staffStatus) }}
              </span>
            </div>
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

  <!-- Staff Reassignment Modal -->
  <StaffReassignmentModal
    :show="showReassignmentModal"
    :staff="selectedStaff"
    @close="closeReassignmentModal"
  />
</template>

<style scoped>
/* Clickable staff names */
.staff-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.clickable-staff {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 0.125rem 0.25rem;
  margin: -0.125rem -0.25rem;
}

.clickable-staff:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  transform: translateY(-1px);
}

.clickable-staff:active {
  transform: translateY(0);
}

/* Temporarily allocated staff styling */
.staff-item.staff-temporarily-allocated {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 4px solid #f59e0b;
  position: relative;
}

.staff-item.staff-temporarily-allocated::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 12px 12px 0;
  border-color: transparent #f59e0b transparent transparent;
}

.allocation-badge {
  font-size: 0.75rem;
  color: #92400e;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  border: 1px solid rgba(245, 158, 11, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.allocation-badge::before {
  content: '↗';
  font-size: 0.625rem;
  opacity: 0.7;
}
</style>

