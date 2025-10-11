"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeroStartDateIdSchema = exports.optionalNonNegativeIntSchema = exports.optionalPositiveIntSchema = exports.nonEmptyStringSchema = exports.positiveIntSchema = exports.scheduleTypeSchema = exports.overrideTypeSchema = exports.staffCategorySchema = exports.timeSchema = exports.daysOfWeekSchema = void 0;
exports.validateShiftTimes = validateShiftTimes;
const zod_1 = require("zod");
// Common validation schemas used across multiple routes
exports.daysOfWeekSchema = zod_1.z.array(zod_1.z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']));
exports.timeSchema = zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');
// Helper function to parse time string to minutes since midnight
function parseTimeToMinutes(timeString) {
    const [hoursStr, minutesStr] = timeString.split(':');
    const hours = parseInt(hoursStr || '0') || 0;
    const minutes = parseInt(minutesStr || '0') || 0;
    return hours * 60 + minutes;
}
// Helper function to calculate shift duration in minutes
function calculateShiftDuration(startTime, endTime) {
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);
    if (end >= start) {
        // Same day shift
        return end - start;
    }
    else {
        // Overnight shift
        return (24 * 60) - start + end;
    }
}
// Validation function for shift times
function validateShiftTimes(startTime, endTime) {
    // Check if times are the same (invalid)
    if (startTime === endTime) {
        return { isValid: false, error: 'Start time and end time cannot be the same' };
    }
    const duration = calculateShiftDuration(startTime, endTime);
    const maxDurationMinutes = 12 * 60; // 12 hours in minutes
    // Check if shift exceeds maximum duration
    if (duration > maxDurationMinutes) {
        return { isValid: false, error: 'Shift duration cannot exceed 12 hours' };
    }
    // Check minimum shift duration (1 hour)
    if (duration < 60) {
        return { isValid: false, error: 'Shift duration must be at least 1 hour' };
    }
    return { isValid: true };
}
exports.staffCategorySchema = zod_1.z.enum(['REGULAR', 'RELIEF', 'SUPERVISOR']);
exports.overrideTypeSchema = zod_1.z.enum(['TEMPORARY_ALLOCATION', 'ABSENCE']);
exports.scheduleTypeSchema = zod_1.z.enum(['DAILY', 'SHIFT_CYCLE']);
// Common field validations
exports.positiveIntSchema = zod_1.z.number().int().positive();
exports.nonEmptyStringSchema = zod_1.z.string().min(1);
exports.optionalPositiveIntSchema = zod_1.z.number().int().positive().optional();
exports.optionalNonNegativeIntSchema = zod_1.z.number().int().min(0).optional();
exports.zeroStartDateIdSchema = zod_1.z.string().min(1);
//# sourceMappingURL=schemas.js.map