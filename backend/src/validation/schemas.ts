import { z } from 'zod';

// Common validation schemas used across multiple routes

export const daysOfWeekSchema = z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']));

export const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');

// Helper function to parse time string to minutes since midnight
function parseTimeToMinutes(timeString: string): number {
  const [hoursStr, minutesStr] = timeString.split(':')
  const hours = parseInt(hoursStr || '0') || 0
  const minutes = parseInt(minutesStr || '0') || 0
  return hours * 60 + minutes
}

// Helper function to calculate shift duration in minutes
function calculateShiftDuration(startTime: string, endTime: string): number {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)

  if (end >= start) {
    // Same day shift
    return end - start
  } else {
    // Overnight shift
    return (24 * 60) - start + end
  }
}

// Validation function for shift times
export function validateShiftTimes(startTime: string, endTime: string): { isValid: boolean; error?: string } {
  // Check if times are the same (invalid)
  if (startTime === endTime) {
    return { isValid: false, error: 'Start time and end time cannot be the same' }
  }

  const duration = calculateShiftDuration(startTime, endTime)
  const maxDurationMinutes = 12 * 60 // 12 hours in minutes

  // Check if shift exceeds maximum duration
  if (duration > maxDurationMinutes) {
    return { isValid: false, error: 'Shift duration cannot exceed 12 hours' }
  }

  // Check minimum shift duration (1 hour)
  if (duration < 60) {
    return { isValid: false, error: 'Shift duration must be at least 1 hour' }
  }

  return { isValid: true }
}

export const staffCategorySchema = z.enum(['REGULAR', 'RELIEF', 'SUPERVISOR']);

export const overrideTypeSchema = z.enum(['TEMPORARY_ALLOCATION', 'ABSENCE']);

export const scheduleTypeSchema = z.enum(['DAILY', 'SHIFT_CYCLE']);

// Common field validations
export const positiveIntSchema = z.number().int().positive();
export const nonEmptyStringSchema = z.string().min(1);
export const optionalPositiveIntSchema = z.number().int().positive().optional();
export const optionalNonNegativeIntSchema = z.number().int().min(0).optional();
export const zeroStartDateIdSchema = z.string().min(1);
