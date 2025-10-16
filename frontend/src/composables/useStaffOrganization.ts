import { computed, type ComputedRef } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useHomeStore } from '@/stores/home'
import { calculateShiftInfo } from '@/utils/shiftCalculations'
import type { StaffStatus } from '@/types'

export interface OrganizedStaffGroup {
  timeLabel: string
  dayStaff: StaffStatus[]
  nightStaff: StaffStatus[]
}

export interface UseStaffOrganizationOptions {
  assignedStaff: StaffStatus[]
  entityType: 'department' | 'service'
}

/**
 * Composable for organizing staff by time groups and handling supervisor display logic
 */
export function useStaffOrganization(options: UseStaffOrganizationOptions): {
  organizedStaff: ComputedRef<OrganizedStaffGroup[]>
  getDisplayHours: (staffStatus: StaffStatus, isNightShift: boolean) => string
  sortStaffWithSupervisorsFirst: (staff: StaffStatus[]) => StaffStatus[]
} {
  const configStore = useConfigStore()
  const homeStore = useHomeStore()

  // Helper function to get display hours for staff
  function getDisplayHours(staffStatus: StaffStatus, isNightShift: boolean): string {
    const staff = staffStatus.staff

    // For supervisors on night shift, show night shift hours
    if (staff.category === 'SUPERVISOR' && isNightShift) {
      return '20:00 - 08:00'
    }

    // For supervisors on day shift or regular staff, show their default hours
    return `${staff.defaultStartTime} - ${staff.defaultEndTime}`
  }

  // Helper function to sort staff with supervisors first
  function sortStaffWithSupervisorsFirst(staff: StaffStatus[]): StaffStatus[] {
    return staff.sort((a, b) => {
      // Sort supervisors to the top
      if (a.staff.category === 'SUPERVISOR' && b.staff.category !== 'SUPERVISOR') return -1
      if (a.staff.category !== 'SUPERVISOR' && b.staff.category === 'SUPERVISOR') return 1
      // Then sort by name
      return a.staff.name.localeCompare(b.staff.name)
    })
  }

  // Organize staff by shift start time and day/night
  const organizedStaff = computed((): OrganizedStaffGroup[] => {
    const staffByTime = new Map<string, { dayStaff: StaffStatus[], nightStaff: StaffStatus[] }>()

    options.assignedStaff.forEach(staffStatus => {
      const startTime = staffStatus.staff.defaultStartTime

      if (!staffByTime.has(startTime)) {
        staffByTime.set(startTime, { dayStaff: [], nightStaff: [] })
      }

      // For supervisors, use enhanced logic to support both day and night display
      if (staffStatus.staff.category === 'SUPERVISOR') {
        // Get zero start date (use default if staff doesn't have one)
        const zeroStartDateId = staffStatus.staff.zeroStartDateId || 'default'
        const zeroStartDates = configStore.settings?.zeroStartDates || []
        const zeroStartDateEntry = zeroStartDates.find((zsd: any) => zsd.id === zeroStartDateId)

        if (zeroStartDateEntry) {
          const zeroStartDate = new Date(zeroStartDateEntry.date)

          // Handle all supervisors using the unified shift calculation
          const supervisorInfo = calculateShiftInfo(
            staffStatus.staff,
            homeStore.selectedDate,
            zeroStartDate
          )

          // Add to appropriate shift based on supervisor's current shift
          if (supervisorInfo.isOnDuty) {
            if (supervisorInfo.shiftType === 'day') {
              staffByTime.get(startTime)!.dayStaff.push(staffStatus)
            } else {
              staffByTime.get(startTime)!.nightStaff.push(staffStatus)
            }
          }
        } else {
          // Fallback: add to day staff if no zero start date
          staffByTime.get(startTime)!.dayStaff.push(staffStatus)
        }
      } else {
        // Regular staff - determine day/night based on shift type
        if (staffStatus.currentShiftType === 'night') {
          staffByTime.get(startTime)!.nightStaff.push(staffStatus)
        } else {
          staffByTime.get(startTime)!.dayStaff.push(staffStatus)
        }
      }
    })

    // Convert to array and sort
    return Array.from(staffByTime.entries())
      .map(([timeLabel, groups]) => ({
        timeLabel,
        dayStaff: sortStaffWithSupervisorsFirst(groups.dayStaff),
        nightStaff: sortStaffWithSupervisorsFirst(groups.nightStaff)
      }))
      .sort((a, b) => a.timeLabel.localeCompare(b.timeLabel))
  })

  return {
    organizedStaff,
    getDisplayHours,
    sortStaffWithSupervisorsFirst
  }
}
