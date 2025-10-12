import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { positiveIntSchema, optionalPositiveIntSchema } from '../validation/schemas';

const router = express.Router();

// Validation schemas
const createRunnerAllocationSchema = z.object({
  staffId: positiveIntSchema.describe('Staff ID is required'),
  departmentId: optionalPositiveIntSchema,
  serviceId: optionalPositiveIntSchema,
  runnerPoolId: optionalPositiveIntSchema,
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format').optional(),
  createdByOverrideId: optionalPositiveIntSchema
}).refine(
  (data) => {
    // Exactly one of departmentId, serviceId, or runnerPoolId must be provided
    const allocations = [data.departmentId, data.serviceId, data.runnerPoolId].filter(Boolean);
    return allocations.length === 1;
  },
  { message: 'Exactly one of departmentId, serviceId, or runnerPoolId must be provided' }
);

const updateRunnerAllocationSchema = createRunnerAllocationSchema.partial();

// GET /api/runner-allocations - Get all runner allocations
router.get('/', async (req, res) => {
  try {
    const { staffId, active } = req.query;
    
    const whereClause: any = {};
    if (staffId) {
      whereClause.staffId = parseInt(staffId as string);
    }
    
    // Filter for active allocations (current date within range)
    if (active === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      whereClause.startDate = { lte: today };
      whereClause.OR = [
        { endDate: null },
        { endDate: { gte: today } }
      ];
    }

    const allocations = await prisma.runner_allocations.findMany({
      where: whereClause,
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true,
        runner_pools: true,
        daily_overrides: true
      },
      orderBy: [
        { startDate: 'desc' },
        { staff: { name: 'asc' } }
      ]
    });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching runner allocations:', error);
    res.status(500).json({ error: 'Failed to fetch runner allocations' });
  }
});

// GET /api/runner-allocations/:id - Get a specific runner allocation
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid runner allocation ID' });
    }

    const allocation = await prisma.runner_allocations.findUnique({
      where: { id },
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true,
        runner_pools: true,
        daily_overrides: true
      }
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Runner allocation not found' });
    }

    res.json(allocation);
  } catch (error) {
    console.error('Error fetching runner allocation:', error);
    res.status(500).json({ error: 'Failed to fetch runner allocation' });
  }
});

// POST /api/runner-allocations - Create a new runner allocation
router.post('/', async (req, res) => {
  try {
    const validatedData = createRunnerAllocationSchema.parse(req.body);
    
    const allocation = await prisma.runner_allocations.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null
      },
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true,
        runner_pools: true,
        daily_overrides: true
      }
    });

    res.status(201).json(allocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error creating runner allocation:', error);
    res.status(500).json({ error: 'Failed to create runner allocation' });
  }
});

// PUT /api/runner-allocations/:id - Update a runner allocation
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid runner allocation ID' });
    }

    const validatedData = updateRunnerAllocationSchema.parse(req.body);
    
    const updateData: any = { ...validatedData };
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }
    
    const allocation = await prisma.runner_allocations.update({
      where: { id },
      data: updateData,
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true,
        runner_pools: true,
        daily_overrides: true
      }
    });

    res.json(allocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.issues 
      });
    }
    
    console.error('Error updating runner allocation:', error);
    res.status(500).json({ error: 'Failed to update runner allocation' });
  }
});

// DELETE /api/runner-allocations/:id - Delete a runner allocation
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid runner allocation ID' });
    }

    await prisma.runner_allocations.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting runner allocation:', error);
    res.status(500).json({ error: 'Failed to delete runner allocation' });
  }
});

export default router;
