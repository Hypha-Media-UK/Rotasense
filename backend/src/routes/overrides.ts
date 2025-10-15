import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { timeSchema, positiveIntSchema, overrideTypeSchema } from '../validation/schemas';

const router = express.Router();

// Validation schemas
const createOverrideSchema = z.object({
  date: z.string().datetime('Invalid date format'),
  endDate: z.string().datetime('Invalid end date format').optional(),
  staffId: positiveIntSchema.describe('Staff ID is required'),
  departmentId: positiveIntSchema.optional(),
  serviceId: positiveIntSchema.optional(),
  runnerPoolId: positiveIntSchema.optional(),
  overrideType: overrideTypeSchema,
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  reason: z.string().optional(),
  autoExpire: z.boolean().optional()
}).refine(
  (data) => {
    if (data.overrideType === 'TEMPORARY_ALLOCATION') {
      // For temporary allocation, exactly one of departmentId or serviceId must be provided
      const allocations = [data.departmentId, data.serviceId].filter(Boolean);
      return allocations.length === 1;
    }
    return true; // For absence, no allocation is required
  },
  {
    message: "For temporary allocation, exactly one of departmentId or serviceId must be provided"
  }
);

const updateOverrideSchema = createOverrideSchema.partial();

// GET /api/overrides - Get all daily overrides
router.get('/', async (req, res) => {
  try {
    const { date, staffId } = req.query;
    
    const whereClause: any = {};
    if (date) {
      const requestedDate = new Date(date as string);
      // Find overrides that are active on the requested date
      // This includes overrides where the date falls between start date and end date (inclusive)
      whereClause.AND = [
        { date: { lte: requestedDate } }, // Start date <= requested date
        {
          OR: [
            { endDate: null }, // Single-day overrides (no end date)
            { endDate: { gte: requestedDate } } // End date >= requested date
          ]
        }
      ];
    }
    if (staffId) {
      whereClause.staffId = parseInt(staffId as string);
    }

    const overrides = await prisma.daily_overrides.findMany({
      where: whereClause,
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true
      },
      orderBy: [
        { date: 'desc' },
        { staff: { name: 'asc' } }
      ]
    });

    res.json(overrides);
  } catch (error) {
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

    const override = await prisma.daily_overrides.findUnique({
      where: { id },
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true
      }
    });

    if (!override) {
      return res.status(404).json({ error: 'Override not found' });
    }

    res.json(override);
  } catch (error) {
    console.error('Error fetching override:', error);
    res.status(500).json({ error: 'Failed to fetch override' });
  }
});

// POST /api/overrides - Create a new override
router.post('/', async (req, res) => {
  try {
    const validatedData = createOverrideSchema.parse(req.body);
    
    const override = await prisma.daily_overrides.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null
      },
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true
      }
    });

    res.status(201).json(override);
  } catch (error) {
    if (error instanceof z.ZodError) {
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
    
    const updateData: any = { ...validatedData };
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }
    
    const override = await prisma.daily_overrides.update({
      where: { id },
      data: updateData,
      include: {
        staff: true,
        departments: {
          include: {
            buildings: true
          }
        },
        services: true
      }
    });

    res.json(override);
  } catch (error) {
    if (error instanceof z.ZodError) {
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

    await prisma.daily_overrides.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting override:', error);
    res.status(500).json({ error: 'Failed to delete override' });
  }
});

export default router;
