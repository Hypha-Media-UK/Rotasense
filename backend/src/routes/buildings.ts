import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { nonEmptyStringSchema } from '../validation/schemas';

const router = express.Router();

// Validation schemas
const createBuildingSchema = z.object({
  name: nonEmptyStringSchema.describe('Building name is required')
});

const updateBuildingSchema = z.object({
  name: nonEmptyStringSchema.optional()
});

// GET /api/buildings - Get all buildings with their departments
router.get('/', async (req, res) => {
  try {
    const buildings = await prisma.buildings.findMany({
      include: {
        departments: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(buildings);
  } catch (error) {
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

    const building = await prisma.buildings.findUnique({
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
  } catch (error) {
    console.error('Error fetching building:', error);
    res.status(500).json({ error: 'Failed to fetch building' });
  }
});

// POST /api/buildings - Create a new building
router.post('/', async (req, res) => {
  try {
    const validatedData = createBuildingSchema.parse(req.body);
    
    const building = await prisma.buildings.create({
      data: validatedData,
      include: {
        departments: true
      }
    });

    res.status(201).json(building);
  } catch (error) {
    if (error instanceof z.ZodError) {
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
    
    const building = await prisma.buildings.update({
      where: { id },
      data: validatedData,
      include: {
        departments: true
      }
    });

    res.json(building);
  } catch (error) {
    if (error instanceof z.ZodError) {
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

    await prisma.buildings.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting building:', error);
    res.status(500).json({ error: 'Failed to delete building' });
  }
});

export default router;
