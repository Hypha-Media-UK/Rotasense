"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const index_1 = require("../index");
const schemas_1 = require("../validation/schemas");
const router = express_1.default.Router();
// Validation schemas
const createMinimumStaffPeriodSchema = zod_1.z.object({
    departmentId: schemas_1.positiveIntSchema.optional(),
    serviceId: schemas_1.positiveIntSchema.optional(),
    startTime: schemas_1.timeSchema,
    endTime: schemas_1.timeSchema,
    minStaff: zod_1.z.number().int().min(1, 'Minimum staff must be at least 1'),
    daysOfWeek: schemas_1.daysOfWeekSchema
}).refine((data) => {
    // Ensure exactly one of departmentId or serviceId is provided
    return (data.departmentId && !data.serviceId) || (!data.departmentId && data.serviceId);
}, {
    message: "Either departmentId or serviceId must be provided, but not both"
}).refine((data) => {
    // Validate operational times
    const validation = (0, schemas_1.validateShiftTimes)(data.startTime, data.endTime);
    return validation.isValid;
}, {
    message: "Invalid operational times: duration must be between 1-12 hours and start/end times cannot be the same"
});
const updateMinimumStaffPeriodSchema = zod_1.z.object({
    startTime: schemas_1.timeSchema.optional(),
    endTime: schemas_1.timeSchema.optional(),
    minStaff: zod_1.z.number().int().min(1, 'Minimum staff must be at least 1').optional(),
    daysOfWeek: schemas_1.daysOfWeekSchema.optional()
}).refine((data) => {
    // Validate operational times if both are provided
    if (data.startTime && data.endTime) {
        const validation = (0, schemas_1.validateShiftTimes)(data.startTime, data.endTime);
        return validation.isValid;
    }
    return true;
}, {
    message: "Invalid operational times: duration must be between 1-12 hours and start/end times cannot be the same"
});
// GET /api/minimum-staff-periods - Get all minimum staff periods
router.get('/', async (req, res) => {
    try {
        const { departmentId, serviceId } = req.query;
        const where = {};
        if (departmentId) {
            where.departmentId = parseInt(departmentId);
        }
        if (serviceId) {
            where.serviceId = parseInt(serviceId);
        }
        const periods = await index_1.prisma.minimum_staff_periods.findMany({
            where,
            include: {
                departments: true,
                services: true
            },
            orderBy: [
                { startTime: 'asc' }
            ]
        });
        // Parse daysOfWeek JSON for each period
        const periodsWithParsedData = periods.map(period => ({
            ...period,
            daysOfWeek: JSON.parse(period.daysOfWeek)
        }));
        res.json(periodsWithParsedData);
    }
    catch (error) {
        console.error('Error fetching minimum staff periods:', error);
        res.status(500).json({ error: 'Failed to fetch minimum staff periods' });
    }
});
// GET /api/minimum-staff-periods/:id - Get a specific minimum staff period
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const period = await index_1.prisma.minimum_staff_periods.findUnique({
            where: { id },
            include: {
                departments: true,
                services: true
            }
        });
        if (!period) {
            return res.status(404).json({ error: 'Minimum staff period not found' });
        }
        const periodWithParsedData = {
            ...period,
            daysOfWeek: JSON.parse(period.daysOfWeek)
        };
        res.json(periodWithParsedData);
    }
    catch (error) {
        console.error('Error fetching minimum staff period:', error);
        res.status(500).json({ error: 'Failed to fetch minimum staff period' });
    }
});
// POST /api/minimum-staff-periods - Create a new minimum staff period
router.post('/', async (req, res) => {
    try {
        const validatedData = createMinimumStaffPeriodSchema.parse(req.body);
        // Check if department or service exists
        if (validatedData.departmentId) {
            const department = await index_1.prisma.departments.findUnique({
                where: { id: validatedData.departmentId }
            });
            if (!department) {
                return res.status(404).json({ error: 'Department not found' });
            }
        }
        if (validatedData.serviceId) {
            const service = await index_1.prisma.services.findUnique({
                where: { id: validatedData.serviceId }
            });
            if (!service) {
                return res.status(404).json({ error: 'Service not found' });
            }
        }
        const period = await index_1.prisma.minimum_staff_periods.create({
            data: {
                ...validatedData,
                daysOfWeek: JSON.stringify(validatedData.daysOfWeek)
            },
            include: {
                departments: true,
                services: true
            }
        });
        const periodWithParsedData = {
            ...period,
            daysOfWeek: JSON.parse(period.daysOfWeek)
        };
        res.status(201).json(periodWithParsedData);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error creating minimum staff period:', error);
        res.status(500).json({ error: 'Failed to create minimum staff period' });
    }
});
// PUT /api/minimum-staff-periods/:id - Update a minimum staff period
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateMinimumStaffPeriodSchema.parse(req.body);
        // Check if period exists
        const existingPeriod = await index_1.prisma.minimum_staff_periods.findUnique({
            where: { id }
        });
        if (!existingPeriod) {
            return res.status(404).json({ error: 'Minimum staff period not found' });
        }
        const updateData = { ...validatedData };
        if (validatedData.daysOfWeek) {
            updateData.daysOfWeek = JSON.stringify(validatedData.daysOfWeek);
        }
        const period = await index_1.prisma.minimum_staff_periods.update({
            where: { id },
            data: updateData,
            include: {
                departments: true,
                services: true
            }
        });
        const periodWithParsedData = {
            ...period,
            daysOfWeek: JSON.parse(period.daysOfWeek)
        };
        res.json(periodWithParsedData);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error updating minimum staff period:', error);
        res.status(500).json({ error: 'Failed to update minimum staff period' });
    }
});
// DELETE /api/minimum-staff-periods/:id - Delete a minimum staff period
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Check if period exists
        const existingPeriod = await index_1.prisma.minimum_staff_periods.findUnique({
            where: { id }
        });
        if (!existingPeriod) {
            return res.status(404).json({ error: 'Minimum staff period not found' });
        }
        await index_1.prisma.minimum_staff_periods.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting minimum staff period:', error);
        res.status(500).json({ error: 'Failed to delete minimum staff period' });
    }
});
exports.default = router;
//# sourceMappingURL=minimum-staff-periods.js.map