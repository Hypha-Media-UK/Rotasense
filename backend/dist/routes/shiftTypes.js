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
const createShiftTypeSchema = zod_1.z.object({
    name: schemas_1.nonEmptyStringSchema.describe('Shift type name is required'),
    daysOn: zod_1.z.number().int().min(1, 'Days on must be at least 1'),
    daysOff: zod_1.z.number().int().min(0, 'Days off cannot be negative'),
    zeroStartDate: zod_1.z.string().datetime('Invalid date format'),
    offset: zod_1.z.number().int().min(0, 'Offset cannot be negative').optional(),
    displayOnHome: zod_1.z.boolean().optional()
});
const updateShiftTypeSchema = createShiftTypeSchema.partial();
// GET /api/shift-types - Get all shift types
router.get('/', async (req, res) => {
    try {
        const shiftTypes = await index_1.prisma.shiftType.findMany({
            include: {
                staffAllocations: {
                    include: {
                        staff: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(shiftTypes);
    }
    catch (error) {
        console.error('Error fetching shift types:', error);
        res.status(500).json({ error: 'Failed to fetch shift types' });
    }
});
// GET /api/shift-types/:id - Get a specific shift type
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid shift type ID' });
        }
        const shiftType = await index_1.prisma.shiftType.findUnique({
            where: { id },
            include: {
                staffAllocations: {
                    include: {
                        staff: true
                    }
                }
            }
        });
        if (!shiftType) {
            return res.status(404).json({ error: 'Shift type not found' });
        }
        res.json(shiftType);
    }
    catch (error) {
        console.error('Error fetching shift type:', error);
        res.status(500).json({ error: 'Failed to fetch shift type' });
    }
});
// POST /api/shift-types - Create a new shift type
router.post('/', async (req, res) => {
    try {
        const validatedData = createShiftTypeSchema.parse(req.body);
        const shiftType = await index_1.prisma.shiftType.create({
            data: {
                ...validatedData,
                zeroStartDate: new Date(validatedData.zeroStartDate)
            },
            include: {
                staffAllocations: {
                    include: {
                        staff: true
                    }
                }
            }
        });
        res.status(201).json(shiftType);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error creating shift type:', error);
        res.status(500).json({ error: 'Failed to create shift type' });
    }
});
// PUT /api/shift-types/:id - Update a shift type
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid shift type ID' });
        }
        const validatedData = updateShiftTypeSchema.parse(req.body);
        const updateData = { ...validatedData };
        if (validatedData.zeroStartDate) {
            updateData.zeroStartDate = new Date(validatedData.zeroStartDate);
        }
        const shiftType = await index_1.prisma.shiftType.update({
            where: { id },
            data: updateData,
            include: {
                staffAllocations: {
                    include: {
                        staff: true
                    }
                }
            }
        });
        res.json(shiftType);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error updating shift type:', error);
        res.status(500).json({ error: 'Failed to update shift type' });
    }
});
// DELETE /api/shift-types/:id - Delete a shift type
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid shift type ID' });
        }
        await index_1.prisma.shiftType.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting shift type:', error);
        res.status(500).json({ error: 'Failed to delete shift type' });
    }
});
exports.default = router;
//# sourceMappingURL=shiftTypes.js.map