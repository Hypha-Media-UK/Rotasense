import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, differenceInDays } from 'date-fns'
import { apiService } from '@/services/api'
import { useConfigStore } from './config'
import type {
  DailyOverride,
  DepartmentStatus,
  ServiceStatus,
  StaffStatus,
  DayOfWeek,
  CreateOverrideForm
} from '@/types'

export const useHomeStore = defineStore('home', () => {
  // State
  const selectedDate = ref(new Date())
  const dailyOverrides = ref<DailyOverride[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const selectedWeek = computed(() => {
    const start = startOfWeek(selectedDate.value, { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(selectedDate.value, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  })

  const selectedDateString = computed(() => format(selectedDate.value, 'yyyy-MM-dd'))
  const selectedDayOfWeek = computed(() => format(selectedDate.value, 'EEEE').toLowerCase() as DayOfWeek)

  const isSelectedDateToday = computed(() => isToday(selectedDate.value))

  // Get overrides for the selected date
  const todaysOverrides = computed(() =>
    dailyOverrides.value.filter(override =>
      format(new Date(override.date), 'yyyy-MM-dd') === selectedDateString.value
    )
  )

  // Calculate staff status for the selected date
  const staffStatuses = computed((): StaffStatus[] => {
    const configStore = useConfigStore()

    return configStore.staff.map(staff => {
      // Check if staff member has an override for today
      const override = todaysOverrides.value.find(o => o.staffId === staff.id)

      // Get staff's regular allocation
      const allocation = configStore.allocations.find(a => a.staffId === staff.id)

      // Check if staff is scheduled to work today based on their schedule type
      let isScheduledToday = false
      if (staff.scheduleType === 'DAILY') {
        isScheduledToday = staff.contractedDays.includes(selectedDayOfWeek.value)
      } else if (staff.scheduleType === 'SHIFT_CYCLE') {
        isScheduledToday = calculateShiftStatus(staff, selectedDate.value)
      }

      // Determine if staff is absent
      const isAbsent = override?.overrideType === 'ABSENCE'

      // Determine current location
      let currentLocation = 'Unallocated'
      if (isAbsent) {
        currentLocation = 'Absent'
      } else if (override?.overrideType === 'TEMPORARY_ALLOCATION') {
        if (override.department) {
          currentLocation = override.department.name
        } else if (override.service) {
          currentLocation = override.service.name
        }
      } else if (allocation) {
        if (allocation.department) {
          currentLocation = allocation.department.name
        } else if (allocation.service) {
          currentLocation = allocation.service.name
        }
      }

      // For shift cycle staff, show "Off Duty" if not scheduled today
      if (staff.scheduleType === 'SHIFT_CYCLE' && !isScheduledToday && !isAbsent && !override) {
        currentLocation = 'Off Duty (Shift Rotation)'
      }

      // Check if staff is within working hours (only for current day)
      const isWithinWorkingHours = isToday(selectedDate.value) ? isStaffWithinWorkingHours(staff, selectedDate.value) : true

      // Determine if staff is active (scheduled, not absent, allocated, and within working hours if today)
      const isActive = isScheduledToday && !isAbsent && currentLocation !== 'Unallocated' && !currentLocation.includes('Off Duty') && isWithinWorkingHours

      return {
        staff,
        allocation,
        override,
        isActive,
        isAbsent,
        currentLocation
      }
    })
  })

  // Calculate department statuses
  const departmentStatuses = computed((): DepartmentStatus[] => {
    const configStore = useConfigStore()

    return configStore.departments
      .map(department => {
        // Check if department is operational today (24/7 or specific days)
        const isOperational = department.is24x7 || department.operationalDays.includes(selectedDayOfWeek.value)

        // Get staff assigned to this department
        const assignedStaff = staffStatuses.value.filter(status => {
          // Check for temporary allocation
          if (status.override?.overrideType === 'TEMPORARY_ALLOCATION' && status.override.departmentId === department.id) {
            return true
          }
          // Check for regular allocation (if no override)
          if (!status.override && status.allocation?.departmentId === department.id) {
            return true
          }
          return false
        })

        const activeStaff = assignedStaff.filter(s => s.isActive).length
        const isUnderstaffed = isOperational && activeStaff < department.minStaff

        return {
          department,
          assignedStaff,
          isOperational,
          isUnderstaffed,
          requiredStaff: department.minStaff,
          activeStaff
        }
      })
      .filter(status => {
        // Only show if operational for this day AND (has active staff OR marked to display)
        return status.isOperational && (status.activeStaff > 0 || status.department.displayOnHome)
      })
  })

  // Calculate service statuses
  const serviceStatuses = computed((): ServiceStatus[] => {
    const configStore = useConfigStore()

    return configStore.services
      .map(service => {
        // Check if service is operational today (24/7 or specific days)
        const isOperational = service.is24x7 || service.operationalDays.includes(selectedDayOfWeek.value)

        // Get staff assigned to this service
        const assignedStaff = staffStatuses.value.filter(status => {
          // Check for temporary allocation
          if (status.override?.overrideType === 'TEMPORARY_ALLOCATION' && status.override.serviceId === service.id) {
            return true
          }
          // Check for regular allocation (if no override)
          if (!status.override && status.allocation?.serviceId === service.id) {
            return true
          }
          return false
        })

        const activeStaff = assignedStaff.filter(s => s.isActive).length
        const isUnderstaffed = isOperational && activeStaff < service.minStaff

        return {
          service,
          assignedStaff,
          isOperational,
          isUnderstaffed,
          requiredStaff: service.minStaff,
          activeStaff
        }
      })
      .filter(status => {
        // Only show if operational for this day AND (has active staff OR marked to display)
        return status.isOperational && (status.activeStaff > 0 || status.service.displayOnHome)
      })
  })

  // Helper function to calculate shift status for staff with shift cycles
  function calculateShiftStatus(staff: any, date: Date): boolean {
    if (!staff.daysOn || !staff.daysOff || !staff.zeroStartDateId) {
      return false
    }

    const configStore = useConfigStore()
    const zeroStartDate = getZeroStartDate(staff.zeroStartDateId, configStore.settings)
    if (!zeroStartDate) {
      return false
    }

    const daysSinceZero = differenceInDays(date, new Date(zeroStartDate))
    const cyclePosition = (daysSinceZero + (staff.shiftOffset || 0)) % (staff.daysOn + staff.daysOff)
    return cyclePosition < staff.daysOn
  }

  // Helper function to get zero start date from settings
  function getZeroStartDate(zeroStartDateId: string, settings: any): string | null {
    if (!settings?.zeroStartDates) {
      return null
    }

    const zeroStartDateEntry = settings.zeroStartDates.find((zsd: any) => zsd.id === zeroStartDateId)
    return zeroStartDateEntry?.date || null
  }

  // Helper function to check if staff is within working hours
  function isStaffWithinWorkingHours(staff: any, date: Date): boolean {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight

    // Parse staff working hours
    const startTime = parseTimeToMinutes(staff.defaultStartTime || '08:00')
    const endTime = parseTimeToMinutes(staff.defaultEndTime || '20:00')

    // Check if current time is within working hours
    return currentTime >= startTime && currentTime <= endTime
  }

  // Helper function to parse time string to minutes since midnight
  function parseTimeToMinutes(timeString: string): number {
    const [hoursStr, minutesStr] = timeString.split(':')
    const hours = parseInt(hoursStr || '0') || 0
    const minutes = parseInt(minutesStr || '0') || 0
    return hours * 60 + minutes
  }

  // Actions
  async function fetchOverrides(date?: Date) {
    loading.value = true
    error.value = null

    try {
      const targetDate = date || selectedDate.value
      const dateString = format(targetDate, 'yyyy-MM-dd')
      const overrides = await apiService.getOverrides(dateString)
      dailyOverrides.value = overrides
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch overrides'
      console.error('Error fetching overrides:', err)
    } finally {
      loading.value = false
    }
  }

  async function createOverride(data: CreateOverrideForm) {
    try {
      const newOverride = await apiService.createOverride(data)
      dailyOverrides.value.push(newOverride)
      return newOverride
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create override'
      throw err
    }
  }

  async function updateOverride(id: number, data: Partial<CreateOverrideForm>) {
    try {
      const updatedOverride = await apiService.updateOverride(id, data)
      const index = dailyOverrides.value.findIndex(o => o.id === id)
      if (index !== -1) {
        dailyOverrides.value[index] = updatedOverride
      }
      return updatedOverride
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update override'
      throw err
    }
  }

  async function deleteOverride(id: number) {
    try {
      await apiService.deleteOverride(id)
      dailyOverrides.value = dailyOverrides.value.filter(o => o.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete override'
      throw err
    }
  }

  function setSelectedDate(date: Date) {
    selectedDate.value = date
    // Fetch overrides for the new date
    fetchOverrides(date)
  }

  function goToToday() {
    setSelectedDate(new Date())
  }

  function goToPreviousWeek() {
    const newDate = new Date(selectedDate.value)
    newDate.setDate(newDate.getDate() - 7)
    setSelectedDate(newDate)
  }

  function goToNextWeek() {
    const newDate = new Date(selectedDate.value)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedDate(newDate)
  }

  return {
    // State
    selectedDate,
    dailyOverrides,
    loading,
    error,

    // Computed
    selectedWeek,
    selectedDateString,
    selectedDayOfWeek,
    isSelectedDateToday,
    todaysOverrides,
    staffStatuses,
    departmentStatuses,
    serviceStatuses,

    // Actions
    fetchOverrides,
    createOverride,
    updateOverride,
    deleteOverride,
    setSelectedDate,
    goToToday,
    goToPreviousWeek,
    goToNextWeek
  }
})
