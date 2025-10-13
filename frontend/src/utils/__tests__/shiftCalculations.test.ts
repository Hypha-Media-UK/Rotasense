import { describe, test, expect } from 'vitest'
import { calculateSupervisorShiftInfo, calculateEnhancedShiftStatus, getStaffShiftType, isRotatingSupervisor } from '../shiftCalculations'
import type { Staff } from '@/types'

describe('Supervisor Shift Calculations', () => {
  const zeroDate = new Date('2024-01-01') // Monday
  
  const rotatingSupervisor: Staff = {
    id: 1,
    name: 'Test Supervisor',
    category: 'SUPERVISOR',
    isNightStaff: false,
    scheduleType: 'SHIFT_CYCLE',
    daysOn: 4,
    daysOff: 4,
    shiftOffset: 0,
    zeroStartDateId: '1',
    shiftPattern: 'ROTATING_DAY_NIGHT',
    defaultStartTime: '08:00',
    defaultEndTime: '20:00',
    contractedDays: []
  }

  const fixedDaySupervisor: Staff = {
    ...rotatingSupervisor,
    shiftPattern: 'FIXED',
    isNightStaff: false
  }

  const fixedNightSupervisor: Staff = {
    ...rotatingSupervisor,
    shiftPattern: 'FIXED',
    isNightStaff: true
  }

  describe('calculateSupervisorShiftInfo', () => {
    test('Day 1-4: Day shift on duty', () => {
      const result = calculateSupervisorShiftInfo(rotatingSupervisor, new Date('2024-01-01'), zeroDate)
      expect(result).toEqual({ isOnDuty: true, shiftType: 'day', cycleDay: 1 })
      
      const result4 = calculateSupervisorShiftInfo(rotatingSupervisor, new Date('2024-01-04'), zeroDate)
      expect(result4).toEqual({ isOnDuty: true, shiftType: 'day', cycleDay: 4 })
    })

    test('Day 5-8: Off duty', () => {
      const result = calculateSupervisorShiftInfo(rotatingSupervisor, new Date('2024-01-05'), zeroDate)
      expect(result).toEqual({ isOnDuty: false, shiftType: 'day', cycleDay: 5 })
      
      const result8 = calculateSupervisorShiftInfo(rotatingSupervisor, new Date('2024-01-08'), zeroDate)
      expect(result8).toEqual({ isOnDuty: false, shiftType: 'day', cycleDay: 8 })
    })

    test('Day 9-12: Night shift on duty', () => {
      const result = calculateSupervisorShiftInfo(rotatingSupervisor, new Date('2024-01-09'), zeroDate)
      expect(result).toEqual({ isOnDuty: true, shiftType: 'night', cycleDay: 9 })
      
      const result12 = calculateSupervisorShiftInfo(rotatingSupervisor, new Date('2024-01-12'), zeroDate)
      expect(result12).toEqual({ isOnDuty: true, shiftType: 'night', cycleDay: 12 })
    })

    test('Day 13-16: Off duty', () => {
      const result = calculateSupervisorShiftInfo(rotatingSupervisor, new Date('2024-01-13'), zeroDate)
      expect(result).toEqual({ isOnDuty: false, shiftType: 'night', cycleDay: 13 })
      
      const result16 = calculateSupervisorShiftInfo(rotatingSupervisor, new Date('2024-01-16'), zeroDate)
      expect(result16).toEqual({ isOnDuty: false, shiftType: 'night', cycleDay: 16 })
    })

    test('Day 17: Cycle repeats - Day shift on duty', () => {
      const result = calculateSupervisorShiftInfo(rotatingSupervisor, new Date('2024-01-17'), zeroDate)
      expect(result).toEqual({ isOnDuty: true, shiftType: 'day', cycleDay: 1 })
    })

    test('Handles shift offset correctly', () => {
      const offsetSupervisor = { ...rotatingSupervisor, shiftOffset: 2 }
      const result = calculateSupervisorShiftInfo(offsetSupervisor, new Date('2024-01-01'), zeroDate)
      expect(result).toEqual({ isOnDuty: true, shiftType: 'day', cycleDay: 3 })
    })

    test('Throws error for non-rotating supervisors', () => {
      expect(() => {
        calculateSupervisorShiftInfo(fixedDaySupervisor, new Date('2024-01-01'), zeroDate)
      }).toThrow('This function is only for rotating day/night supervisors')
    })
  })

  describe('getStaffShiftType', () => {
    test('Returns correct shift type for rotating supervisor', () => {
      // Day shift period
      expect(getStaffShiftType(rotatingSupervisor, new Date('2024-01-01'), zeroDate)).toBe('day')
      expect(getStaffShiftType(rotatingSupervisor, new Date('2024-01-05'), zeroDate)).toBe('day') // Off duty but day period
      
      // Night shift period
      expect(getStaffShiftType(rotatingSupervisor, new Date('2024-01-09'), zeroDate)).toBe('night')
      expect(getStaffShiftType(rotatingSupervisor, new Date('2024-01-13'), zeroDate)).toBe('night') // Off duty but night period
    })

    test('Returns correct shift type for fixed supervisors', () => {
      expect(getStaffShiftType(fixedDaySupervisor, new Date('2024-01-01'), zeroDate)).toBe('day')
      expect(getStaffShiftType(fixedNightSupervisor, new Date('2024-01-01'), zeroDate)).toBe('night')
    })
  })

  describe('isRotatingSupervisor', () => {
    test('Identifies rotating supervisors correctly', () => {
      expect(isRotatingSupervisor(rotatingSupervisor)).toBe(true)
      expect(isRotatingSupervisor(fixedDaySupervisor)).toBe(false)
      expect(isRotatingSupervisor(fixedNightSupervisor)).toBe(false)
    })
  })

  describe('calculateEnhancedShiftStatus', () => {
    test('Uses rotating logic for rotating supervisors', () => {
      // On duty day
      expect(calculateEnhancedShiftStatus(rotatingSupervisor, new Date('2024-01-01'), zeroDate)).toBe(true)
      // Off duty day
      expect(calculateEnhancedShiftStatus(rotatingSupervisor, new Date('2024-01-05'), zeroDate)).toBe(false)
      // On duty night
      expect(calculateEnhancedShiftStatus(rotatingSupervisor, new Date('2024-01-09'), zeroDate)).toBe(true)
      // Off duty night
      expect(calculateEnhancedShiftStatus(rotatingSupervisor, new Date('2024-01-13'), zeroDate)).toBe(false)
    })

    test('Falls back to regular logic for fixed supervisors', () => {
      // This would need the regular calculateShiftStatus function to be properly tested
      // For now, just verify it doesn't throw
      expect(() => {
        calculateEnhancedShiftStatus(fixedDaySupervisor, new Date('2024-01-01'), zeroDate)
      }).not.toThrow()
    })
  })
})
