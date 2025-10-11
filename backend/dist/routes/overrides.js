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
const createOverrideSchema = zod_1.z.object({
    date: zod_1.z.string().datetime('Invalid date format'),
    staffId: schemas_1.positiveIntSchema.describe('Staff ID is required'),
    departmentId: schemas_1.positiveIntSchema.optional(),
    serviceId: schemas_1.positiveIntSchema.optional(),
    overrideType: schemas_1.overrideTypeSchema,
    startTime: schemas_1.timeSchema.optional(),
    endTime: schemas_1.timeSchema.optional(),
    reason: zod_1.z.string().optional()
}).refine((data) => {
    if (data.overrideType === 'TEMPORARY_ALLOCATION') {
        // For temporary allocation, exactly one of departmentId or serviceId must be provided
        const allocations = [data.departmentId, data.serviceId].filter(Boolean);
        return allocations.length === 1;
    }
    return true; // For absence, no allocation is required
}, {
    message: "For temporary allocation, exactly one of departmentId or serviceId must be provided"
});
const updateOverrideSchema = createOverrideSchema.partial();
// GET /api/overrides - Get all daily overrides
router.get('/', async (req, res) => {
    try {
        const { date, staffId } = req.query;
        const whereClause = {};
        if (date) {
            whereClause.date = new Date(date);
        }
        if (staffId) {
            whereClause.staffId = parseInt(staffId);
        }
        const overrides = await index_1.prisma.dailyOverride.findMany({
            where: whereClause,
            include: {
                staff: true,
                department: {
                    include: {
                        building: true
                    }
                },
                service: true
            },
            orderBy: [
                { date: 'desc' },
                { staff: { name: 'asc' } }
            ]
        });
        res.json(overrides);
    }
    catch (error) {
        console.error('Error fetching overrides:', error);
        res.status(500).json({ error: 'Failed to fetch overrides' });
    }
});
// GET /api/overrides/:id - Get a specific override
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid override ID' });
        }
        const override = await index_1.prisma.dailyOverride.findUnique({
            where: { id },
            include: {
                staff: true,
                department: {
                    include: {
                        building: true
                    }
                },
                service: true
            }
        });
        if (!override) {
            return res.status(404).json({ error: 'Override not found' });
        }
        res.json(override);
    }
    catch (error) {
        console.error('Error fetching override:', error);
        res.status(500).json({ error: 'Failed to fetch override' });
    }
});
// POST /api/overrides - Create a new override
router.post('/', async (req, res) => {
    try {
        const validatedData = createOverrideSchema.parse(req.body);
        const override = await index_1.prisma.dailyOverride.create({
            data: {
                ...validatedData,
                date: new Date(validatedData.date)
            },
            include: {
                staff: true,
                department: {
                    include: {
                        building: true
                    }
                },
                service: true
            }
        });
        res.status(201).json(override);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error creating override:', error);
        res.status(500).json({ error: 'Failed to create override' });
    }
});
// PUT /api/overrides/:id - Update an override
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid override ID' });
        }
        const validatedData = updateOverrideSchema.parse(req.body);
        const updateData = { ...validatedData };
        if (validatedData.date) {
            updateData.date = new Date(validatedData.date);
        }
        const override = await index_1.prisma.dailyOverride.update({
            where: { id },
            data: updateData,
            include: {
                staff: true,
                department: {
                    include: {
                        building: true
                    }
                },
                service: true
            }
        });
        res.json(override);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error updating override:', error);
        res.status(500).json({ error: 'Failed to update override' });
    }
});
// DELETE /api/overrides/:id - Delete an override
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid override ID' });
        }
        await index_1.prisma.dailyOverride.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting override:', error);
        res.status(500).json({ error: 'Failed to delete override' });
    }
});
exports.default = router;
//# sourceMappingURL=overrides.js.map