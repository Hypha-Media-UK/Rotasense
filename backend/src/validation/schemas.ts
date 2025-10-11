import { z } from 'zod';

// Common validation schemas used across multiple routes

export const daysOfWeekSchema = z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']));

export const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');

export const staffCategorySchema = z.enum(['REGULAR', 'RELIEF', 'SUPERVISOR']);

export const overrideTypeSchema = z.enum(['TEMPORARY_ALLOCATION', 'ABSENCE']);

export const scheduleTypeSchema = z.enum(['DAILY', 'SHIFT_CYCLE']);

// Common field validations
export const positiveIntSchema = z.number().int().positive();
export const nonEmptyStringSchema = z.string().min(1);
export const optionalPositiveIntSchema = z.number().int().positive().optional();
export const optionalNonNegativeIntSchema = z.number().int().min(0).optional();
export const zeroStartDateIdSchema = z.string().min(1);
