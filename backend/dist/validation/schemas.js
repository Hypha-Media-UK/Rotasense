"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zeroStartDateIdSchema = exports.optionalPositiveIntSchema = exports.nonEmptyStringSchema = exports.positiveIntSchema = exports.scheduleTypeSchema = exports.overrideTypeSchema = exports.staffCategorySchema = exports.timeSchema = exports.daysOfWeekSchema = void 0;
const zod_1 = require("zod");
// Common validation schemas used across multiple routes
exports.daysOfWeekSchema = zod_1.z.array(zod_1.z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']));
exports.timeSchema = zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');
exports.staffCategorySchema = zod_1.z.enum(['REGULAR', 'RELIEF', 'SUPERVISOR']);
exports.overrideTypeSchema = zod_1.z.enum(['TEMPORARY_ALLOCATION', 'ABSENCE']);
exports.scheduleTypeSchema = zod_1.z.enum(['DAILY', 'SHIFT_CYCLE']);
// Common field validations
exports.positiveIntSchema = zod_1.z.number().int().positive();
exports.nonEmptyStringSchema = zod_1.z.string().min(1);
exports.optionalPositiveIntSchema = zod_1.z.number().int().positive().optional();
exports.zeroStartDateIdSchema = zod_1.z.string().min(1);
//# sourceMappingURL=schemas.js.map