import type { StaffStatus } from '@/types'

/**
 * Get display hours for a staff member based on their shift type and section
 */
export function getDisplayHours(staffStatus: StaffStatus, isInNightSection: boolean = false): string {
  const staff = staffStatus.staff

  // For supervisors, show appropriate hours based on section
  if (staff.category === 'SUPERVISOR') {
    if (isInNightSection) {
      return '20:00 - 08:00'
    } else {
      return '08:00 - 20:00'
    }
  }

  // For rotating supervisors (legacy), show hours based on current shift type
  if (staffStatus.isRotatingSchedule && staffStatus.currentShiftType === 'night') {
    return '20:00 - 08:00'
  }

  // For fixed night staff, show night hours
  if (staff.isNightStaff) {
    return '20:00 - 08:00'
  }

  // Default to contracted hours
  return `${staff.defaultStartTime} - ${staff.defaultEndTime}`
}
