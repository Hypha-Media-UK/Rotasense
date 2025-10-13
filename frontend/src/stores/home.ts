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
  RunnerPoolStatus,
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

    return configStore.staff
      .filter(staff => {
        // Check if staff is scheduled to work on the selected date
        if (staff.scheduleType === 'SHIFT_CYCLE') {
          return calculateShiftStatus(staff, selectedDate.value)
        } else if (staff.scheduleType === 'DAILY') {
          return staff.contractedDays.includes(selectedDayOfWeek.value)
        }

        // For runner pool staff without proper schedule configuration, include them
        // This handles edge cases where runner pool staff might not have schedules set up
        if (staff.runnerPoolId && !staff.scheduleType) {
          return true
        }

        return false
      })
      .map(staff => {
        // Check if staff member has an override for today
        const override = todaysOverrides.value.find(o => o.staffId === staff.id)

        // Get staff's regular allocation
        const allocation = configStore.allocations.find(a => a.staffId === staff.id)

        // Check if staff is scheduled to work today based on their schedule type
        let isScheduledToday = false
        if (staff.scheduleType === 'DAILY') {
          isScheduledToday = staff.contractedDays.includes(selectedDayOfWeek.value)
        } else if (staff.scheduleType === 'SHIFT_CYCLE') {
          // We already filtered for shift cycle staff who are on shift, so they are scheduled
          isScheduledToday = true
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
        if (allocation.departments) {
          currentLocation = allocation.departments.name
        } else if (allocation.services) {
          currentLocation = allocation.services.name
        }
      } else if (staff.runnerPoolId) {
        // Staff assigned to runner pool should be considered allocated
        const runnerPool = configStore.runnerPools.find(rp => rp.id === staff.runnerPoolId)
        if (runnerPool) {
          currentLocation = runnerPool.name
        }
      }



      // Determine time-based status for current day
      const isCurrentDay = isToday(selectedDate.value)
      let timeStatus = 'scheduled' // Default for future/past dates

      if (isCurrentDay && !isAbsent && currentLocation !== 'Unallocated') {
        timeStatus = calculateTimeStatus(staff, new Date())
      }



      // Determine final status
      const isActive = timeStatus === 'active' && isScheduledToday && !isAbsent && currentLocation !== 'Unallocated'
      const isScheduled = (timeStatus === 'scheduled' || !isCurrentDay) && isScheduledToday && !isAbsent && currentLocation !== 'Unallocated'
      const isOffDuty = timeStatus === 'off-duty' && isScheduledToday && !isAbsent && currentLocation !== 'Unallocated'

      return {
        staff,
        allocation,
        override,
        isActive,
        isAbsent,
        isScheduled,
        isOffDuty,
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

  // Calculate runner pool statuses (separated by day/night shift)
  const runnerPoolStatuses = computed((): RunnerPoolStatus[] => {
    const configStore = useConfigStore()

    const results: RunnerPoolStatus[] = []

    configStore.runnerPools.forEach(runnerPool => {
      // Get staff permanently assigned to this runner pool
      const assignedStaff = staffStatuses.value.filter(status =>
        status.staff.runnerPoolId === runnerPool.id
      )

      // Separate day and night staff
      const dayStaff = assignedStaff.filter(status => !status.staff.isNightStaff)
      const nightStaff = assignedStaff.filter(status => status.staff.isNightStaff)

      // Create day shift card if there are day staff
      if (dayStaff.length > 0) {
        const temporarilyAllocatedStaff = dayStaff.filter(status => {
          return status.override?.overrideType === 'TEMPORARY_ALLOCATION' &&
                 (status.override.departmentId || status.override.serviceId)
        })

        const activeStaff = dayStaff.filter(status => status.isActive && !status.isAbsent).length

        results.push({
          runnerPool: {
            ...runnerPool,
            name: runnerPool.name + ' (Day)',
            id: runnerPool.id * 1000 + 1 // Unique ID for day shift
          },
          assignedStaff: dayStaff,
          temporarilyAllocatedStaff,
          activeStaff,
          totalStaff: dayStaff.length
        })
      }

      // Create night shift card if there are night staff
      if (nightStaff.length > 0) {
        const temporarilyAllocatedStaff = nightStaff.filter(status => {
          return status.override?.overrideType === 'TEMPORARY_ALLOCATION' &&
                 (status.override.departmentId || status.override.serviceId)
        })

        const activeStaff = nightStaff.filter(status => status.isActive && !status.isAbsent).length

        results.push({
          runnerPool: {
            ...runnerPool,
            name: runnerPool.name + ' (Night)',
            id: runnerPool.id * 1000 + 2 // Unique ID for night shift
          },
          assignedStaff: nightStaff,
          temporarilyAllocatedStaff,
          activeStaff,
          totalStaff: nightStaff.length
        })
      }
    })

    return results.filter(status => {
      // Only show if marked to display on home OR has active staff
      return status.runnerPool.displayOnHome || status.activeStaff > 0
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
    return calculateTimeStatus(staff, new Date()) === 'active'
  }

  // Helper function to check if staff is scheduled to work later today
  function isStaffScheduledToWorkLaterToday(staff: any, currentDateTime: Date): boolean {
    const currentTime = currentDateTime.getHours() * 60 + currentDateTime.getMinutes()
    const startTime = parseTimeToMinutes(staff.defaultStartTime || '08:00')
    const endTime = parseTimeToMinutes(staff.defaultEndTime || '20:00')

    // For overnight shifts, check if their start time is later today
    const isOvernightShift = endTime < startTime

    if (isOvernightShift) {
      // If current time is before start time, they have a shift starting later today
      const result = currentTime < startTime



      return result
    }

    // For regular shifts, check if they're scheduled today and start time is in the future
    const currentDayOfWeek = format(currentDateTime, 'EEEE').toLowerCase() as DayOfWeek

    if (staff.scheduleType === 'DAILY') {
      // Check if they're contracted to work today and start time hasn't passed
      return staff.contractedDays.includes(currentDayOfWeek) && currentTime < startTime
    } else if (staff.scheduleType === 'SHIFT_CYCLE') {
      // Check if they're on shift today and start time hasn't passed
      return calculateShiftStatus(staff, currentDateTime) && currentTime < startTime
    }

    return false
  }

  // Helper function to parse time string to minutes since midnight
  function parseTimeToMinutes(timeString: string): number {
    const [hoursStr, minutesStr] = timeString.split(':')
    const hours = parseInt(hoursStr || '0') || 0
    const minutes = parseInt(minutesStr || '0') || 0
    return hours * 60 + minutes
  }

  // Test function for overnight shift logic (for development/debugging)
  function testOvernightShiftLogic() {
    const testStaff = {
      name: 'Test Overnight Staff',
      defaultStartTime: '13:00',
      defaultEndTime: '01:00',
      scheduleType: 'DAILY',
      contractedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }

    const testTimes = [
      '08:00', // Should be 'scheduled' (before shift start)
      '12:00', // Should be 'scheduled' (before shift start)
      '13:00', // Should be 'active' (shift start)
      '18:00', // Should be 'active' (during shift)
      '23:00', // Should be 'active' (during shift)
      '01:00', // Should be 'active' (shift end)
      '02:00', // Should be 'off-duty' (after shift, no more shifts today)
      '06:00'  // Should be 'off-duty' (after shift, no more shifts today)
    ]

    console.log('Testing overnight shift logic for 13:00-01:00 shift:')
    testTimes.forEach(timeStr => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const testDate = new Date()
      testDate.setHours(hours, minutes, 0, 0)

      const result = calculateTimeStatus(testStaff, testDate)
      console.log(`${timeStr}: ${result}`)
    })
  }

  // Expose test function for development
  ;(window as any).testOvernightShiftLogic = testOvernightShiftLogic

  // Helper function to calculate time-based status with overnight shift support
  function calculateTimeStatus(staff: any, currentDateTime: Date): string {
    const currentTime = currentDateTime.getHours() * 60 + currentDateTime.getMinutes()
    const startTime = parseTimeToMinutes(staff.defaultStartTime || '08:00')
    const endTime = parseTimeToMinutes(staff.defaultEndTime || '20:00')

    // Check if this is an overnight shift (end time is less than start time)
    const isOvernightShift = endTime < startTime

    if (isOvernightShift) {
      // For overnight shifts: active if after start time OR before end time
      if (currentTime >= startTime || currentTime <= endTime) {
        return 'active'
      } else {
        // Between end time and start time (the gap period)
        // Check if staff is scheduled to work later today
        if (isStaffScheduledToWorkLaterToday(staff, currentDateTime)) {
          return 'scheduled' // They have a shift starting later today
        } else {
          return 'off-duty' // They're not scheduled to work again today
        }
      }
    } else {
      // Normal day shift logic
      if (currentTime < startTime) {
        return 'scheduled' // Before working hours
      } else if (currentTime >= startTime && currentTime <= endTime) {
        return 'active' // During working hours
      } else {
        return 'off-duty' // After working hours
      }
    }
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
    runnerPoolStatuses,

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
