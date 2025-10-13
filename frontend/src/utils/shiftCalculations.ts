import type { Staff, DayOfWeek } from '@/types'

export interface SupervisorShiftInfo {
  isOnDuty: boolean;
  shiftType: 'day' | 'night';
  cycleDay: number; // 1-16 within the mega-cycle
}

/**
 * Calculate shift information for rotating day/night supervisors
 * 
 * Pattern: 4 days on (day shift) → 4 days off → 4 nights on (night shift) → 4 days off → repeat
 * This creates a 16-day mega-cycle
 */
export function calculateSupervisorShiftInfo(
  staff: Staff, 
  targetDate: Date, 
  zeroDate: Date
): SupervisorShiftInfo {
  if (staff.shiftPattern !== 'ROTATING_DAY_NIGHT') {
    throw new Error('This function is only for rotating day/night supervisors');
  }

  const daysOn = staff.daysOn || 4;
  const daysOff = staff.daysOff || 4;
  const shiftOffset = staff.shiftOffset || 0;
  
  // Calculate days since zero date
  const daysSinceZero = Math.floor(
    (targetDate.getTime() - zeroDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Apply shift offset
  const adjustedDays = daysSinceZero + shiftOffset;
  
  // 16-day mega-cycle (4 on day + 4 off + 4 on night + 4 off)
  const megaCycleLength = (daysOn + daysOff) * 2; // 16 days
  const cycleDay = ((adjustedDays % megaCycleLength) + megaCycleLength) % megaCycleLength + 1;
  
  // Determine shift status and type
  let isOnDuty: boolean;
  let shiftType: 'day' | 'night';
  
  if (cycleDay <= daysOn) {
    // Days 1-4: Day shift (on duty)
    isOnDuty = true;
    shiftType = 'day';
  } else if (cycleDay <= daysOn + daysOff) {
    // Days 5-8: Off duty
    isOnDuty = false;
    shiftType = 'day'; // Default to day when off duty
  } else if (cycleDay <= daysOn + daysOff + daysOn) {
    // Days 9-12: Night shift (on duty)
    isOnDuty = true;
    shiftType = 'night';
  } else {
    // Days 13-16: Off duty
    isOnDuty = false;
    shiftType = 'night'; // Default to night when off duty
  }
  
  return {
    isOnDuty,
    shiftType,
    cycleDay
  };
}

/**
 * Enhanced version of shift status calculation that handles both fixed and rotating patterns
 */
export function calculateEnhancedShiftStatus(
  staff: Staff, 
  targetDate: Date, 
  zeroDate: Date
): boolean {
  if (staff.scheduleType !== 'SHIFT_CYCLE') {
    return false; // Daily schedule staff handled elsewhere
  }
  
  if (staff.shiftPattern === 'ROTATING_DAY_NIGHT') {
    const shiftInfo = calculateSupervisorShiftInfo(staff, targetDate, zeroDate);
    return shiftInfo.isOnDuty;
  } else {
    // Existing logic for fixed day/night staff
    return calculateShiftStatus(staff, targetDate, zeroDate);
  }
}

/**
 * Original shift status calculation for fixed day/night staff
 * Kept for backward compatibility
 */
export function calculateShiftStatus(staff: Staff, targetDate: Date, zeroDate: Date): boolean {
  if (staff.scheduleType !== 'SHIFT_CYCLE') {
    return false;
  }

  const daysOn = staff.daysOn || 4;
  const daysOff = staff.daysOff || 4;
  const shiftOffset = staff.shiftOffset || 0;
  
  const daysSinceZero = Math.floor(
    (targetDate.getTime() - zeroDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const adjustedDays = daysSinceZero + shiftOffset;
  const cycleLength = daysOn + daysOff;
  const cycleDay = ((adjustedDays % cycleLength) + cycleLength) % cycleLength;
  
  return cycleDay < daysOn;
}

/**
 * Get the current shift type for any staff member
 */
export function getStaffShiftType(
  staff: Staff, 
  targetDate: Date, 
  zeroDate: Date
): 'day' | 'night' {
  if (staff.shiftPattern === 'ROTATING_DAY_NIGHT') {
    const shiftInfo = calculateSupervisorShiftInfo(staff, targetDate, zeroDate);
    return shiftInfo.shiftType;
  } else {
    return staff.isNightStaff ? 'night' : 'day';
  }
}

/**
 * Check if a staff member is a rotating supervisor
 */
export function isRotatingSupervisor(staff: Staff): boolean {
  return staff.category === 'SUPERVISOR' && staff.shiftPattern === 'ROTATING_DAY_NIGHT';
}

/**
 * Get a human-readable description of a staff member's schedule
 */
export function getScheduleDescription(staff: Staff): string {
  if (staff.scheduleType === 'DAILY') {
    return `Daily: ${staff.defaultStartTime} - ${staff.defaultEndTime}`;
  } else if (staff.scheduleType === 'SHIFT_CYCLE') {
    if (staff.shiftPattern === 'ROTATING_DAY_NIGHT') {
      return `${staff.daysOn || 4}/${staff.daysOff || 4} Rotating Day/Night Shifts`;
    } else {
      const shiftType = staff.isNightStaff ? 'Night' : 'Day';
      return `${staff.daysOn || 4}/${staff.daysOff || 4} ${shiftType} Shift Cycle`;
    }
  }
  return 'Unknown schedule';
}
