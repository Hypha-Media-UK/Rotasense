import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { nonEmptyStringSchema, optionalNonNegativeIntSchema } from '../validation/schemas';

const router = express.Router();

// Validation schemas
const createRunnerPoolSchema = z.object({
  name: nonEmptyStringSchema.describe('Runner pool name is required'),
  description: z.string().optional(),
  displayOnHome: z.boolean().optional(),
  displayOrder: optionalNonNegativeIntSchema
});

const updateRunnerPoolSchema = createRunnerPoolSchema.partial();

// GET /api/runner-pools - Get all runner pools
router.get('/', async (req, res) => {
  try {
    const runnerPools = await prisma.runner_pools.findMany({
      include: {
        staff: {
          include: {
            staff_allocations: {
              include: {
                departments: {
                  include: {
                    buildings: true
                  }
                },
                services: true
              }
            }
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(runnerPools);
  } catch (error) {
    console.error('Error fetching runner pools:', error);
    res.status(500).json({ error: 'Failed to fetch runner pools' });
  }
});

// GET /api/runner-pools/:id - Get a specific runner pool
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid runner pool ID' });
    }

    const runnerPool = await prisma.runner_pools.findUnique({
      where: { id },
      include: {
        staff: {
          include: {
            staff_allocations: {
              include: {
                departments: {
                  include: {
                    buildings: true
                  }
                },
                services: true
              }
            }
          }
        }
      }
    });

    if (!runnerPool) {
      return res.status(404).json({ error: 'Runner pool not found' });
    }

    res.json(runnerPool);
  } catch (error) {
    console.error('Error fetching runner pool:', error);
    res.status(500).json({ error: 'Failed to fetch runner pool' });
  }
});

// POST /api/runner-pools - Create a new runner pool
router.post('/', async (req, res) => {
  try {
    const validatedData = createRunnerPoolSchema.parse(req.body);
    
    const runnerPool = await prisma.runner_pools.create({
      data: validatedData,
      include: {
        staff: {
          include: {
            staff_allocations: {
              include: {
                departments: {
                  include: {
                    buildings: true
                  }
                },
                services: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(runnerPool);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error creating runner pool:', error);
    res.status(500).json({ error: 'Failed to create runner pool' });
  }
});

// PUT /api/runner-pools/:id - Update a runner pool
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid runner pool ID' });
    }

    const validatedData = updateRunnerPoolSchema.parse(req.body);
    
    const runnerPool = await prisma.runner_pools.update({
      where: { id },
      data: validatedData,
      include: {
        staff: {
          include: {
            staff_allocations: {
              include: {
                departments: {
                  include: {
                    buildings: true
                  }
                },
                services: true
              }
            }
          }
        }
      }
    });

    res.json(runnerPool);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error updating runner pool:', error);
    res.status(500).json({ error: 'Failed to update runner pool' });
  }
});

// DELETE /api/runner-pools/:id - Delete a runner pool
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid runner pool ID' });
    }

    // Check if any staff are assigned to this pool
    const staffCount = await prisma.staff.count({
      where: { runnerPoolId: id }
    });

    if (staffCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete runner pool with assigned staff. Please reassign staff first.' 
      });
    }

    await prisma.runner_pools.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting runner pool:', error);
    res.status(500).json({ error: 'Failed to delete runner pool' });
  }
});

export default router;
