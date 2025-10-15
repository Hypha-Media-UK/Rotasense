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
const createServiceSchema = zod_1.z.object({
    name: schemas_1.nonEmptyStringSchema.describe('Service name is required'),
    is24x7: zod_1.z.boolean().optional(),
    operationalDays: schemas_1.daysOfWeekSchema,
    startTime: schemas_1.timeSchema,
    endTime: schemas_1.timeSchema,
    minStaff: zod_1.z.number().int().min(0, 'Minimum staff cannot be negative'),
    displayOnHome: zod_1.z.boolean().optional()
}).refine((data) => {
    // Validate operational times
    const validation = (0, schemas_1.validateShiftTimes)(data.startTime, data.endTime);
    return validation.isValid;
}, {
    message: "Invalid operational times: duration must be between 1-12 hours and start/end times cannot be the same"
});
const updateServiceSchema = zod_1.z.object({
    name: schemas_1.nonEmptyStringSchema.optional(),
    is24x7: zod_1.z.boolean().optional(),
    operationalDays: schemas_1.daysOfWeekSchema.optional(),
    startTime: schemas_1.timeSchema.optional(),
    endTime: schemas_1.timeSchema.optional(),
    minStaff: zod_1.z.number().int().min(0, 'Minimum staff cannot be negative').optional(),
    displayOnHome: zod_1.z.boolean().optional()
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
// GET /api/services - Get all services
router.get('/', async (req, res) => {
    try {
        const services = await index_1.prisma.services.findMany({
            include: {
                staff_allocations: {
                    include: {
                        staff: true
                    }
                },
                minimum_staff_periods: {
                    orderBy: { startTime: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });
        // Parse JSON strings back to arrays
        const servicesWithParsedData = services.map((service) => ({
            ...service,
            operationalDays: JSON.parse(service.operationalDays),
            minimum_staff_periods: service.minimum_staff_periods.map((period) => ({
                ...period,
                daysOfWeek: JSON.parse(period.daysOfWeek)
            }))
        }));
        res.json(servicesWithParsedData);
    }
    catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});
// GET /api/services/:id - Get a specific service
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid service ID' });
        }
        const service = await index_1.prisma.services.findUnique({
            where: { id },
            include: {
                staff_allocations: {
                    include: {
                        staff: true
                    }
                },
                minimum_staff_periods: {
                    orderBy: { startTime: 'asc' }
                }
            }
        });
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        const serviceWithParsedData = {
            ...service,
            operationalDays: JSON.parse(service.operationalDays),
            minimum_staff_periods: service.minimum_staff_periods.map((period) => ({
                ...period,
                daysOfWeek: JSON.parse(period.daysOfWeek)
            }))
        };
        res.json(serviceWithParsedData);
    }
    catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});
// POST /api/services - Create a new service
router.post('/', async (req, res) => {
    try {
        const validatedData = createServiceSchema.parse(req.body);
        const service = await index_1.prisma.services.create({
            data: {
                ...validatedData,
                operationalDays: JSON.stringify(validatedData.operationalDays)
            },
            include: {
                staff_allocations: {
                    include: {
                        staff: true
                    }
                }
            }
        });
        const serviceWithParsedData = {
            ...service,
            operationalDays: JSON.parse(service.operationalDays)
        };
        res.status(201).json(serviceWithParsedData);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});
// PUT /api/services/:id - Update a service
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid service ID' });
        }
        const validatedData = updateServiceSchema.parse(req.body);
        const updateData = { ...validatedData };
        if (validatedData.operationalDays) {
            updateData.operationalDays = JSON.stringify(validatedData.operationalDays);
        }
        const service = await index_1.prisma.services.update({
            where: { id },
            data: updateData,
            include: {
                staff_allocations: {
                    include: {
                        staff: true
                    }
                }
            }
        });
        const serviceWithParsedData = {
            ...service,
            operationalDays: JSON.parse(service.operationalDays)
        };
        res.json(serviceWithParsedData);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
});
// DELETE /api/services/:id - Delete a service
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid service ID' });
        }
        await index_1.prisma.services.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});
exports.default = router;
//# sourceMappingURL=services.js.map