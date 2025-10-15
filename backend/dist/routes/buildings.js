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
const createBuildingSchema = zod_1.z.object({
    name: schemas_1.nonEmptyStringSchema.describe('Building name is required')
});
const updateBuildingSchema = zod_1.z.object({
    name: schemas_1.nonEmptyStringSchema.optional()
});
// GET /api/buildings - Get all buildings with their departments
router.get('/', async (req, res) => {
    try {
        const buildings = await index_1.prisma.buildings.findMany({
            include: {
                departments: {
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(buildings);
    }
    catch (error) {
        console.error('Error fetching buildings:', error);
        res.status(500).json({ error: 'Failed to fetch buildings' });
    }
});
// GET /api/buildings/:id - Get a specific building
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid building ID' });
        }
        const building = await index_1.prisma.buildings.findUnique({
            where: { id },
            include: {
                departments: {
                    orderBy: { name: 'asc' }
                }
            }
        });
        if (!building) {
            return res.status(404).json({ error: 'Building not found' });
        }
        res.json(building);
    }
    catch (error) {
        console.error('Error fetching building:', error);
        res.status(500).json({ error: 'Failed to fetch building' });
    }
});
// POST /api/buildings - Create a new building
router.post('/', async (req, res) => {
    try {
        const validatedData = createBuildingSchema.parse(req.body);
        const building = await index_1.prisma.buildings.create({
            data: validatedData,
            include: {
                departments: true
            }
        });
        res.status(201).json(building);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error creating building:', error);
        res.status(500).json({ error: 'Failed to create building' });
    }
});
// PUT /api/buildings/:id - Update a building
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid building ID' });
        }
        const validatedData = updateBuildingSchema.parse(req.body);
        const building = await index_1.prisma.buildings.update({
            where: { id },
            data: validatedData,
            include: {
                departments: true
            }
        });
        res.json(building);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Error updating building:', error);
        res.status(500).json({ error: 'Failed to update building' });
    }
});
// DELETE /api/buildings/:id - Delete a building
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid building ID' });
        }
        await index_1.prisma.buildings.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting building:', error);
        res.status(500).json({ error: 'Failed to delete building' });
    }
});
exports.default = router;
//# sourceMappingURL=buildings.js.map