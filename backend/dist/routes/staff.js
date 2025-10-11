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
const createStaffSchema = zod_1.z.object({
    name: schemas_1.nonEmptyStringSchema.describe('Staff name is required'),
    category: schemas_1.staffCategorySchema.optional(),
    scheduleType: schemas_1.scheduleTypeSchema.optional(),
    daysOn: schemas_1.optionalPositiveIntSchema,
    daysOff: schemas_1.optionalPositiveIntSchema,
    shiftOffset: schemas_1.optionalPositiveIntSchema,
    zeroStartDateId: schemas_1.zeroStartDateIdSchema.optional(),
    defaultStartTime: schemas_1.timeSchema.optional(),
    defaultEndTime: schemas_1.timeSchema.optional(),
    contractedDays: schemas_1.daysOfWeekSchema
}).refine((data) => {
    // If scheduleType is SHIFT_CYCLE, require shift cycle fields
    if (data.scheduleType === 'SHIFT_CYCLE') {
        return data.daysOn && data.daysOff !== undefined && data.zeroStartDateId;
    }
    return true;
}, {
    message: "For shift cycle schedules, daysOn, daysOff, and zeroStartDateId are required"
});
const updateStaffSchema = zod_1.z.object({
    name: schemas_1.nonEmptyStringSchema.optional(),
    category: schemas_1.staffCategorySchema.optional(),
    scheduleType: schemas_1.scheduleTypeSchema.optional(),
    daysOn: schemas_1.optionalPositiveIntSchema,
    daysOff: schemas_1.optionalPositiveIntSchema,
    shiftOffset: schemas_1.optionalPositiveIntSchema,
    zeroStartDateId: schemas_1.zeroStartDateIdSchema.optional(),
    defaultStartTime: schemas_1.timeSchema.optional(),
    defaultEndTime: schemas_1.timeSchema.optional(),
    contractedDays: schemas_1.daysOfWeekSchema.optional()
}).refine((data) => {
    // If scheduleType is SHIFT_CYCLE, require shift cycle fields
    if (data.scheduleType === 'SHIFT_CYCLE') {
        return data.daysOn && data.daysOff !== undefined && data.zeroStartDateId;
    }
    return true;
}, {
    message: "For shift cycle schedules, daysOn, daysOff, and zeroStartDateId are required"
});
// GET /api/staff - Get all staff members
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const whereClause = {};
        if (category && typeof category === 'string') {
            whereClause.category = category.toUpperCase();
        }
        const staff = await index_1.prisma.staff.findMany({
            where: whereClause,
            include: {
                allocations: {
                    include: {
                        department: {
                            include: {
                                building: true
                            }
                        },
                        service: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        // Parse JSON strings back to arrays
        const staffWithParsedData = staff.map(member => ({
            ...member,
            contractedDays: JSON.parse(member.contractedDays)
        }));
        res.json(staffWithParsedData);
    }
    catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
});
// GET /api/staff/:id - Get a specific staff member
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid staff ID' });
        }
        const staff = await index_1.prisma.staff.findUnique({
            where: { id },
            include: {
                allocations: {
                    include: {
                        department: {
                            include: {
                                building: true
                            }
                        },
                        service: true
                    }
                }
            }
        });
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        const staffWithParsedData = {
            ...staff,
            contractedDays: JSON.parse(staff.contractedDays)
        };
        res.json(staffWithParsedData);
    }
    catch (error) {
        console.error('Error fetching staff member:', error);
        res.status(500).json({ error: 'Failed to fetch staff member' });
    }
});
// POST /api/staff - Create a new staff member
router.post('/', async (req, res) => {
    try {
        const validatedData = createStaffSchema.parse(req.body);
        const staff = await index_1.prisma.staff.create({
            data: {
                ...validatedData,
                contractedDays: JSON.stringify(validatedData.contractedDays)
            },
            include: {
                allocations: {
                    include: {
                        department: {
                            include: {
                                building: true
                            }
                        },
                        service: true
                    }
                }
            }
        });
        const staffWithParsedData = {
            ...staff,
            contractedDays: JSON.parse(staff.contractedDays)
        };
        res.status(201).json(staffWithParsedData);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error creating staff member:', error);
        res.status(500).json({ error: 'Failed to create staff member' });
    }
});
// PUT /api/staff/:id - Update a staff member
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid staff ID' });
        }
        const validatedData = updateStaffSchema.parse(req.body);
        const updateData = { ...validatedData };
        if (validatedData.contractedDays) {
            updateData.contractedDays = JSON.stringify(validatedData.contractedDays);
        }
        const staff = await index_1.prisma.staff.update({
            where: { id },
            data: updateData,
            include: {
                allocations: {
                    include: {
                        department: {
                            include: {
                                building: true
                            }
                        },
                        service: true
                    }
                }
            }
        });
        const staffWithParsedData = {
            ...staff,
            contractedDays: JSON.parse(staff.contractedDays)
        };
        res.json(staffWithParsedData);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error updating staff member:', error);
        res.status(500).json({ error: 'Failed to update staff member' });
    }
});
// DELETE /api/staff/:id - Delete a staff member
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid staff ID' });
        }
        await index_1.prisma.staff.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting staff member:', error);
        res.status(500).json({ error: 'Failed to delete staff member' });
    }
});
exports.default = router;
//# sourceMappingURL=staff.js.map