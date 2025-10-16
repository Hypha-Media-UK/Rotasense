import type { Staff, DayOfWeek } from '@/types'

// Caching for expensive shift calculations
const shiftCalculationCache = new Map<string, any>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  value: T
  timestamp: number
}

function getCacheKey(prefix: string, ...args: any[]): string {
  return `${prefix}:${args.map(arg =>
    arg instanceof Date ? arg.getTime() : JSON.stringify(arg)
  ).join(':')}`
}

function getCachedValue<T>(key: string): T | null {
  const entry = shiftCalculationCache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    shiftCalculationCache.delete(key)
    return null
  }

  return entry.value
}

function setCachedValue<T>(key: string, value: T): void {
  shiftCalculationCache.set(key, {
    value,
    timestamp: Date.now()
  })
}

/**
 * Unified shift information interface for all staff types
 */
export interface ShiftInfo {
  isOnDuty: boolean;
  shiftType: 'day' | 'night';
  cycleDay: number; // 1-8 within the cycle
}

/**
 * Calculate unified shift information for all staff types
 *
 * This replaces the complex 16-day mega-cycle with a simple 8-day cycle.
 * For supervisors, it automatically switches between day and night shifts every 8 days.
 */
export function calculateShiftInfo(
  staff: Staff,
  targetDate: Date,
  zeroDate: Date
): ShiftInfo {
  // Check cache first
  const cacheKey = getCacheKey('shiftInfo', staff.id, targetDate, zeroDate)
  const cached = getCachedValue<ShiftInfo>(cacheKey)
  if (cached) return cached

  if (staff.scheduleType !== 'SHIFT_CYCLE') {
    // For daily schedule staff, they're not on a shift cycle
    const result = { isOnDuty: false, shiftType: 'day' as const, cycleDay: 0 }
    setCachedValue(cacheKey, result)
    return result
  }

  const daysOn = staff.daysOn || 4;
  const daysOff = staff.daysOff || 4;
  const shiftOffset = staff.shiftOffset || 0;

  // Normalize dates to avoid timezone issues
  const targetDateNormalized = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const zeroDateNormalized = new Date(zeroDate.getFullYear(), zeroDate.getMonth(), zeroDate.getDate());

  // Calculate days since zero date
  const daysSinceZero = Math.floor(
    (targetDateNormalized.getTime() - zeroDateNormalized.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Apply shift offset
  const adjustedDays = daysSinceZero + shiftOffset;

  // 8-day cycle (4 on + 4 off)
  const cycleLength = daysOn + daysOff; // 8 days
  const cycleDay = ((adjustedDays % cycleLength) + cycleLength) % cycleLength + 1;

  // Determine if on duty (same for all staff)
  const isOnDuty = cycleDay <= daysOn;

  // Determine shift type
  let shiftType: 'day' | 'night';

  if (staff.category === 'SUPERVISOR' && staff.scheduleType === 'SHIFT_CYCLE') {
    // For supervisors: automatically switch between day and night every 8 days
    const eightDayCycles = Math.floor(adjustedDays / 8);
    shiftType = (eightDayCycles % 2 === 0) ? 'day' : 'night';
  } else {
    // For regular staff: use isNightStaff flag
    shiftType = staff.isNightStaff ? 'night' : 'day';
  }

  const result = {
    isOnDuty,
    shiftType,
    cycleDay
  };

  // Cache the result
  setCachedValue(cacheKey, result)
  return result
}

/**
 * Get whether a staff member is on duty (simplified interface)
 */
export function isStaffOnDuty(
  staff: Staff,
  targetDate: Date,
  zeroDate: Date
): boolean {
  const shiftInfo = calculateShiftInfo(staff, targetDate, zeroDate);
  return shiftInfo.isOnDuty;
}

/**
 * Get the shift type for a staff member (simplified interface)
 */
export function getStaffShiftType(
  staff: Staff,
  targetDate: Date,
  zeroDate: Date
): 'day' | 'night' {
  const shiftInfo = calculateShiftInfo(staff, targetDate, zeroDate);
  return shiftInfo.shiftType;
}

// Legacy function names for backward compatibility
export function calculateEnhancedShiftStatus(
  staff: Staff,
  targetDate: Date,
  zeroDate: Date
): boolean {
  return isStaffOnDuty(staff, targetDate, zeroDate);
}

export function calculateShiftStatus(staff: Staff, targetDate: Date, zeroDate: Date): boolean {
  return isStaffOnDuty(staff, targetDate, zeroDate);
}

/**
 * Check if a staff member is a rotating supervisor
 * Supervisors with SHIFT_CYCLE schedule automatically rotate between day and night
 */
export function isRotatingSupervisor(staff: Staff): boolean {
  return staff.category === 'SUPERVISOR' && staff.scheduleType === 'SHIFT_CYCLE';
}

/**
 * Get supervisors working day shifts on the target date
 */
export function getDaySupervisorsForDate(
  allSupervisors: Staff[],
  targetDate: Date,
  zeroDate: Date
): Staff[] {
  return allSupervisors.filter(supervisor => {
    if (supervisor.category !== 'SUPERVISOR') {
      return false;
    }

    const shiftInfo = calculateShiftInfo(supervisor, targetDate, zeroDate);
    return shiftInfo.isOnDuty && shiftInfo.shiftType === 'day';
  });
}

/**
 * Get supervisors working night shifts on the target date
 */
export function getNightSupervisorsForDate(
  allSupervisors: Staff[],
  targetDate: Date,
  zeroDate: Date
): Staff[] {
  return allSupervisors.filter(supervisor => {
    if (supervisor.category !== 'SUPERVISOR') {
      return false;
    }

    const shiftInfo = calculateShiftInfo(supervisor, targetDate, zeroDate);
    return shiftInfo.isOnDuty && shiftInfo.shiftType === 'night';
  });
}

/**
 * Get supervisor shift type (simplified interface)
 */
export function getSupervisorShiftType(
  supervisor: Staff,
  targetDate: Date,
  zeroDate: Date
): 'day' | 'night' | null {
  if (supervisor.category !== 'SUPERVISOR') {
    return null;
  }

  const shiftInfo = calculateShiftInfo(supervisor, targetDate, zeroDate);
  return shiftInfo.isOnDuty ? shiftInfo.shiftType : null;
}

/**
 * Get a human-readable description of a staff member's schedule
 */
export function getScheduleDescription(staff: Staff): string {
  if (staff.scheduleType === 'DAILY') {
    return `Daily: ${staff.defaultStartTime} - ${staff.defaultEndTime}`;
  } else if (staff.scheduleType === 'SHIFT_CYCLE') {
    if (staff.category === 'SUPERVISOR') {
      return `${staff.daysOn || 4}/${staff.daysOff || 4} Rotating Day/Night Shifts`;
    } else {
      const shiftType = staff.isNightStaff ? 'Night' : 'Day';
      return `${staff.daysOn || 4}/${staff.daysOff || 4} ${shiftType} Shift Cycle`;
    }
  }
  return 'Unknown schedule';
}
